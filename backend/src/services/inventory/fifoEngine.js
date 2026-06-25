const prisma = require('../../config/database');
const { InsufficientStockError } = require('../../utils/AppError');
const {
  toNumber,
  round,
  FIFO_COST_BASIS,
  resolveFifoCostPerMT,
  weightedAverageCostPerMT,
} = require('../../utils/calculations');
const { getAppSettings } = require('../appSettings');

const getFifoCostBasis = async () => {
  const settings = await getAppSettings();
  return settings.fifoCostBasis === FIFO_COST_BASIS.INC_GST
    ? FIFO_COST_BASIS.INC_GST
    : FIFO_COST_BASIS.EX_GST;
};

const getQualityBalance = async (tx, qualityId, locationId) => {
  const where = { qualityId };
  if (locationId) where.locationId = locationId;
  const last = await tx.stockLedger.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return last ? toNumber(last.balanceMT) : 0;
};

const writeLedgerEntry = async (tx, {
  qualityId,
  locationId,
  batchId,
  entryType,
  referenceType,
  referenceId,
  weightMT,
  costPerMT,
}) => {
  const balance = await getQualityBalance(tx, qualityId, locationId);
  const newBalance = round(balance + weightMT, 3);
  return tx.stockLedger.create({
    data: {
      qualityId,
      locationId,
      batchId,
      entryType,
      referenceType,
      referenceId,
      weightMT,
      balanceMT: newBalance,
      costPerMT,
    },
  });
};

const rebuildPurchaseInventory = async (tx, purchaseId) => {
  const lineItems = await tx.purchaseLineItem.findMany({ where: { purchaseId } });
  for (const line of lineItems) {
    const batch = await tx.inventoryBatch.findFirst({ where: { purchaseLineItemId: line.id } });
    if (batch && toNumber(batch.soldWeight) > 0) {
      throw new InsufficientStockError('Cannot edit this purchase — stock from this bill has already been sold');
    }
  }

  const batches = await tx.inventoryBatch.findMany({
    where: { purchaseLineItem: { purchaseId } },
  });
  for (const batch of batches) {
    await tx.inventoryBatch.delete({ where: { id: batch.id } });
  }
  await tx.stockLedger.deleteMany({
    where: { referenceType: 'PURCHASE', referenceId: purchaseId },
  });
};

const createBatchesFromPurchase = async (tx, purchase) => {
  const lineItems = await tx.purchaseLineItem.findMany({
    where: { purchaseId: purchase.id },
    include: { quality: true },
  });

  for (const line of lineItems) {
    const weight = toNumber(line.weight);
    const batch = await tx.inventoryBatch.create({
      data: {
        purchaseLineItemId: line.id,
        qualityId: line.qualityId,
        purchaseBatchId: purchase.purchaseBatchId,
        locationId: purchase.locationId,
        purchaseDate: purchase.purchaseDate,
        originalWeight: weight,
        remainingWeight: weight,
        costPerMT: line.costPerMT,
        costPerMTIncGst: line.costPerMTIncGst,
      },
    });

    await writeLedgerEntry(tx, {
      qualityId: line.qualityId,
      locationId: purchase.locationId,
      batchId: batch.id,
      entryType: 'PURCHASE_IN',
      referenceType: 'PURCHASE',
      referenceId: purchase.id,
      weightMT: weight,
      costPerMT: line.costPerMT,
    });
  }
};

const buildAllocationPreviewRows = (batches, remainingDemand, fifoCostBasis) => {
  const preview = [];
  let demand = remainingDemand;

  for (const batch of batches) {
    if (demand <= 0) break;
    const available = toNumber(batch.remainingWeight);
    if (available <= 0) continue;
    const consume = Math.min(available, demand);
    const costPerMTExGst = toNumber(batch.costPerMT);
    const costPerMTIncGst = toNumber(batch.costPerMTIncGst) || costPerMTExGst;
    const activeRate = resolveFifoCostPerMT(batch, fifoCostBasis);
    preview.push({
      batchId: batch.id,
      purchaseNumber: batch.purchaseLineItem?.purchase?.purchaseNumber,
      purchaseDate: batch.purchaseDate,
      consumeMT: consume,
      costPerMT: costPerMTExGst,
      costPerMTIncGst,
      activeCostPerMT: activeRate,
      allocatedCost: round(consume * activeRate),
      allocatedCostExGst: round(consume * costPerMTExGst),
      allocatedCostIncGst: round(consume * costPerMTIncGst),
    });
    demand = round(demand - consume, 3);
  }

  return { preview, shortfall: demand > 0.001 ? demand : 0 };
};

const summarizeAllocationPreview = (preview, shortfall, fifoCostBasis) => {
  const totalWeight = preview.reduce((s, row) => s + toNumber(row.consumeMT), 0);
  const totalAllocatedCost = round(preview.reduce((s, row) => s + toNumber(row.allocatedCost), 0));
  const totalAllocatedCostExGst = round(preview.reduce((s, row) => s + toNumber(row.allocatedCostExGst), 0));
  const totalAllocatedCostIncGst = round(preview.reduce((s, row) => s + toNumber(row.allocatedCostIncGst), 0));

  const averageCostPerMTExGst = weightedAverageCostPerMT(
    preview.map((row) => ({ weight: row.consumeMT, rate: row.costPerMT })),
    'rate'
  );
  const averageCostPerMTIncGst = weightedAverageCostPerMT(
    preview.map((row) => ({ weight: row.consumeMT, rate: row.costPerMTIncGst })),
    'rate'
  );
  const averageCostPerMT = fifoCostBasis === FIFO_COST_BASIS.INC_GST
    ? averageCostPerMTIncGst
    : averageCostPerMTExGst;

  return {
    preview,
    shortfall,
    totalWeight: round(totalWeight, 3),
    totalAllocatedCost,
    totalAllocatedCostExGst,
    totalAllocatedCostIncGst,
    averageCostPerMT,
    averageCostPerMTExGst,
    averageCostPerMTIncGst,
    fifoCostBasis,
  };
};

const allocateStock = async (tx, {
  qualityId,
  locationId,
  weight,
  grossAmount = 0,
  netAmount = 0,
  referenceId,
}) => {
  const where = {
    qualityId,
    remainingWeight: { gt: 0 },
  };
  if (locationId) where.locationId = locationId;

  const batches = await tx.inventoryBatch.findMany({
    where,
    orderBy: [{ purchaseDate: 'asc' }, { id: 'asc' }],
  });

  const totalDemand = toNumber(weight);
  let remainingDemand = totalDemand;
  const allocations = [];

  for (const batch of batches) {
    if (remainingDemand <= 0) break;

    const available = toNumber(batch.remainingWeight);
    if (available <= 0) continue;

    const consume = Math.min(available, remainingDemand);
    const batchRateExGst = toNumber(batch.costPerMT);
    const allocatedCost = round(consume * batchRateExGst);
    const ratio = totalDemand > 0 ? consume / totalDemand : 0;
    const allocatedRevenue = round(toNumber(grossAmount) * ratio);
    const taxableRevenue = allocatedRevenue;
    const profit = round(allocatedRevenue - allocatedCost);

    await tx.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        remainingWeight: { decrement: consume },
        soldWeight: { increment: consume },
        realizedRevenue: { increment: allocatedRevenue },
        taxableRevenue: { increment: taxableRevenue },
        realizedProfit: { increment: profit },
      },
    });

    allocations.push({
      inventoryBatchId: batch.id,
      weight: consume,
      allocatedCost,
      allocatedRevenue,
      taxableRevenue,
      profit,
    });

    remainingDemand = round(remainingDemand - consume, 3);
  }

  if (remainingDemand > 0.001) {
    throw new InsufficientStockError(`Insufficient stock. Short by ${remainingDemand} MT`);
  }

  if (referenceId) {
    await writeLedgerEntry(tx, {
      qualityId,
      locationId,
      entryType: 'SALE_OUT',
      referenceType: 'SALE',
      referenceId,
      weightMT: -totalDemand,
      costPerMT: null,
    });
  }

  return allocations;
};

const previewAllocation = async ({ qualityId, locationId, weight }) => {
  const fifoCostBasis = await getFifoCostBasis();
  const where = { qualityId, remainingWeight: { gt: 0 } };
  if (locationId) where.locationId = locationId;

  const batches = await prisma.inventoryBatch.findMany({
    where,
    orderBy: [{ purchaseDate: 'asc' }, { id: 'asc' }],
    include: {
      quality: true,
      purchaseLineItem: { include: { purchase: true } },
    },
  });

  const { preview, shortfall } = buildAllocationPreviewRows(
    batches,
    toNumber(weight),
    fifoCostBasis
  );

  return summarizeAllocationPreview(preview, shortfall, fifoCostBasis);
};

const getAvailableStock = async (filters = {}) => {
  const where = { remainingWeight: { gt: 0 } };
  if (filters.qualityId) where.qualityId = filters.qualityId;
  if (filters.locationId) where.locationId = filters.locationId;
  if (filters.purchaseBatchId) where.purchaseBatchId = filters.purchaseBatchId;

  const batches = await prisma.inventoryBatch.findMany({
    where,
    include: { quality: true, location: true, purchaseBatch: true },
    orderBy: { purchaseDate: 'asc' },
  });

  const fifoCostBasis = await getFifoCostBasis();
  const stockMap = {};

  for (const batch of batches) {
    const key = `${batch.qualityId}-${batch.locationId || 'default'}`;
    if (!stockMap[key]) {
      stockMap[key] = {
        qualityId: batch.qualityId,
        quality: batch.quality,
        locationId: batch.locationId,
        location: batch.location,
        totalWeight: 0,
        totalValue: 0,
        batches: [],
      };
    }

    const weight = toNumber(batch.remainingWeight);
    const cost = resolveFifoCostPerMT(batch, fifoCostBasis);

    stockMap[key].totalWeight += weight;
    stockMap[key].totalValue += round(weight * cost);
    stockMap[key].batches.push(batch);
  }

  let results = Object.values(stockMap);
  const q = String(filters.search || '').trim().toLowerCase();
  if (q) {
    results = results.filter((row) =>
      [row.quality?.name, row.location?.name]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }
  return results;
};

const getOverallStockByQuality = async (filters = {}) => {
  const fifoCostBasis = await getFifoCostBasis();
  const batchWhere = { remainingWeight: { gt: 0 } };
  if (filters.qualityId) batchWhere.qualityId = filters.qualityId;

  const batches = await prisma.inventoryBatch.findMany({
    where: batchWhere,
    include: { quality: true, location: true },
    orderBy: { purchaseDate: 'asc' },
  });

  const qualityMap = {};
  const locationSet = new Set();

  for (const batch of batches) {
    const weight = toNumber(batch.remainingWeight);
    if (weight <= 0) continue;
    const cost = resolveFifoCostPerMT(batch, fifoCostBasis);
    const locName = batch.location?.name || 'Unassigned';
    locationSet.add(locName);

    if (!qualityMap[batch.qualityId]) {
      qualityMap[batch.qualityId] = {
        qualityId: batch.qualityId,
        quality: batch.quality,
        totalWeight: 0,
        totalValue: 0,
        byLocation: {},
      };
    }
    qualityMap[batch.qualityId].totalWeight += weight;
    qualityMap[batch.qualityId].totalValue += round(weight * cost);
    qualityMap[batch.qualityId].byLocation[locName] = round(
      (qualityMap[batch.qualityId].byLocation[locName] || 0) + weight,
      3
    );
  }

  let rows = Object.values(qualityMap).map((row) => ({
    ...row,
    totalWeight: round(row.totalWeight, 3),
    totalValue: round(row.totalValue),
    averageCostPerMT: row.totalWeight > 0 ? round(row.totalValue / row.totalWeight, 4) : 0,
  }));

  const q = String(filters.search || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) =>
      String(row.quality?.name ?? '').toLowerCase().includes(q)
    );
  }

  const grandTotalMT = round(rows.reduce((s, r) => s + r.totalWeight, 0), 3);
  const grandTotalValue = round(rows.reduce((s, r) => s + r.totalValue, 0));

  return {
    rows,
    locations: [...locationSet].sort(),
    grandTotalMT,
    grandTotalValue,
  };
};

const getInventoryValue = async () => {
  const fifoCostBasis = await getFifoCostBasis();
  const batches = await prisma.inventoryBatch.findMany();
  return batches.reduce(
    (sum, b) => sum + toNumber(b.remainingWeight) * resolveFifoCostPerMT(b, fifoCostBasis),
    0
  );
};

const getTotalStockMT = async () => {
  const result = await prisma.inventoryBatch.aggregate({ _sum: { remainingWeight: true } });
  return toNumber(result._sum.remainingWeight);
};

const getMovements = async (query = {}) => {
  const { page = 1, limit = 20, qualityId, locationId, purchaseBatchId, search } = query;
  const where = {};
  if (qualityId) where.qualityId = qualityId;
  if (locationId) where.locationId = locationId;
  if (purchaseBatchId) {
    const batches = await prisma.inventoryBatch.findMany({
      where: { purchaseBatchId },
      select: { id: true },
    });
    const batchIds = batches.map((b) => b.id);
    where.batchId = { in: batchIds.length ? batchIds : ['__none__'] };
  }

  let data = await prisma.stockLedger.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { quality: true, location: true, batch: true },
  });

  const q = String(search || '').trim().toLowerCase();
  if (q) {
    data = data.filter((row) =>
      [row.entryType, row.referenceType, row.referenceId, row.quality?.name, row.location?.name]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }

  const total = data.length;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const paged = data.slice(skip, skip + parseInt(limit, 10));

  return {
    data: paged,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
  };
};

module.exports = {
  createBatchesFromPurchase,
  rebuildPurchaseInventory,
  allocateStock,
  previewAllocation,
  getAvailableStock,
  getOverallStockByQuality,
  getInventoryValue,
  getTotalStockMT,
  getMovements,
  writeLedgerEntry,
  getFifoCostBasis,
};
