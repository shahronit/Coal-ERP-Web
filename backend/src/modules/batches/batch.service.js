const prisma = require('../../config/database');
const { toNumber, round } = require('../../utils/calculations');

const getPurchaseBatchSummary = async (batchId) => {
  const batch = await prisma.purchaseBatch.findFirst({
    where: { id: batchId, deletedAt: null },
  });
  if (!batch) return null;

  const purchases = await prisma.purchase.findMany({
    where: { purchaseBatchId: batchId, deletedAt: null, status: 'CONFIRMED' },
    include: { lineItems: true },
  });

  const inventoryBatches = await prisma.inventoryBatch.findMany({
    where: { purchaseBatchId: batchId },
    include: { allocations: true },
  });

  const totalPurchasedMT = purchases.reduce(
    (s, p) => s + p.lineItems.reduce((ls, l) => ls + toNumber(l.weight), 0),
    0
  );
  const remainingMT = inventoryBatches.reduce((s, b) => s + toNumber(b.remainingWeight), 0);
  const soldMT = inventoryBatches.reduce((s, b) => s + toNumber(b.soldWeight), 0);
  const totalCost = purchases.reduce((s, p) => s + toNumber(p.subtotal), 0);
  const realizedRevenue = inventoryBatches.reduce((s, b) => s + toNumber(b.realizedRevenue), 0);
  const realizedProfit = inventoryBatches.reduce((s, b) => s + toNumber(b.realizedProfit), 0);

  return {
    batch,
    totalPurchasedMT: round(totalPurchasedMT, 3),
    remainingMT: round(remainingMT, 3),
    soldMT: round(soldMT, 3),
    totalCost: round(totalCost),
    realizedRevenue: round(realizedRevenue),
    realizedProfit: round(realizedProfit),
    purchaseCount: purchases.length,
  };
};

const getSalesBatchSummary = async (batchId) => {
  const batch = await prisma.salesBatch.findFirst({
    where: { id: batchId, deletedAt: null },
  });
  if (!batch) return null;

  const sales = await prisma.sale.findMany({
    where: { salesBatchId: batchId, deletedAt: null, status: 'CONFIRMED' },
    include: { lineItems: true },
  });

  const totalSoldMT = sales.reduce(
    (s, sale) => s + sale.lineItems.reduce((ls, l) => ls + toNumber(l.weight), 0),
    0
  );
  const totalRevenue = sales.reduce((s, sale) => s + toNumber(sale.grossAmount), 0);
  const totalCost = sales.reduce((s, sale) => s + toNumber(sale.totalCost), 0);
  const totalProfit = sales.reduce((s, sale) => s + toNumber(sale.profit), 0);

  return {
    batch,
    totalSoldMT: round(totalSoldMT, 3),
    totalRevenue: round(totalRevenue),
    totalCost: round(totalCost),
    totalProfit: round(totalProfit),
    saleCount: sales.length,
  };
};

const listSummaries = async (type) => {
  if (type === 'purchase') {
    const batches = await prisma.purchaseBatch.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
    return Promise.all(batches.map((b) => getPurchaseBatchSummary(b.id)));
  }

  const batches = await prisma.salesBatch.findMany({
    where: { deletedAt: null },
    orderBy: { startDate: 'desc' },
  });
  return Promise.all(batches.map((b) => getSalesBatchSummary(b.id)));
};

module.exports = { getPurchaseBatchSummary, getSalesBatchSummary, listSummaries };
