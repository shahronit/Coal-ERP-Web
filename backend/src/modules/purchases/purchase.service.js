const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { calculatePurchaseDocument } = require('../../utils/calculations');
const { generateNumber } = require('../../utils/sequence');
const { createBatchesFromPurchase, rebuildPurchaseInventory } = require('../../services/inventory/fifoEngine');
const { paginate, findById } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { hasPermission, PERMISSIONS } = require('../../config/permissions');
const {
  createPurchaseLineItems,
  createPurchaseAdjustments,
} = require('../../utils/adjustmentPersist');

const ADJUSTMENT_INCLUDES = {
  incomeAdjustments: { include: { incomeType: true, purchaseLineItem: { include: { quality: true } } } },
  expenseAdjustments: { include: { expenseType: true, purchaseLineItem: { include: { quality: true } } } },
};

const PURCHASE_INCLUDE = {
  supplier: true,
  location: true,
  purchaseBatch: true,
  ...ADJUSTMENT_INCLUDES,
  lineItems: { include: { quality: true, inventoryBatch: true } },
};

const mapPurchaseLineCreate = (l) => ({
  qualityId: l.qualityId,
  truckNumber: l.truckNumber || null,
  weight: l.weight,
  rate: l.rate,
  freight: l.freight || 0,
  additionalExpenses: l.additionalExpenses || 0,
  applyGst: l.applyGst === true,
  taxConfigurationId: l.taxConfigurationId || null,
  gstRate: l.gstRate || 0,
  gstAmount: l.gstAmount,
  totalCost: l.totalCost,
  costPerMT: l.costPerMT,
  costPerMTIncGst: l.costPerMTIncGst,
  netAmount: l.netAmount,
});

const mapStoredAdjustmentsForCalc = (adjustments, lineItems, typeKey) =>
  (adjustments || []).map((a) => ({
    [typeKey]: a[typeKey],
    basisType: a.basisType,
    value: a.value,
    description: a.description,
    lineIndex: a.purchaseLineItemId
      ? lineItems.findIndex((line) => line.id === a.purchaseLineItemId)
      : undefined,
  }));

const replacePurchaseLinesAndAdjustments = async (
  tx,
  purchaseId,
  lineItems,
  expenseAdjustments,
  incomeAdjustments,
) => {
  await tx.purchaseLineItem.deleteMany({ where: { purchaseId } });
  await tx.purchaseIncomeAdjustment.deleteMany({ where: { purchaseId } });
  await tx.purchaseExpenseAdjustment.deleteMany({ where: { purchaseId } });
  const lineIds = await createPurchaseLineItems(tx, purchaseId, lineItems, mapPurchaseLineCreate);
  await createPurchaseAdjustments(tx, purchaseId, lineIds, expenseAdjustments, incomeAdjustments);
};

const buildLineItems = async (lineItems, expenseAdjustments = [], incomeAdjustments = [], isIndirect = false) => {
  for (const line of lineItems) {
    const quality = await prisma.coalQuality.findFirst({
      where: { id: line.qualityId, deletedAt: null },
    });
    if (!quality) throw new AppError(`Coal quality ${line.qualityId} not found`, 404);
  }

  const calc = calculatePurchaseDocument({
    lineItems,
    expenseAdjustments,
    incomeAdjustments,
    isIndirect,
  });

  return {
    lineItems: calc.lineItems,
    subtotal: calc.subtotal,
    freightTotal: calc.freightTotal,
    expenseTotal: calc.expenseTotal,
    expenseAdjustmentTotal: calc.expenseAdjustmentTotal,
    incomeAdjustmentTotal: calc.incomeAdjustmentTotal,
    gstTotal: calc.gstTotal,
    netAmount: calc.netAmount,
    outstanding: calc.outstanding,
    resolvedExpenseAdjustments: calc.expenseAdjustments,
    resolvedIncomeAdjustments: calc.incomeAdjustments,
  };
};

const list = (query) =>
  paginate('purchase', {
    ...mergeListQuery(query, { dateField: 'purchaseDate', filterKeys: ['supplierId', 'status'] }),
    searchFields: ['purchaseNumber', 'notes', 'truckNumber'],
    include: {
      supplier: true,
      location: true,
      purchaseBatch: true,
      lineItems: { include: { quality: true } },
    },
  });

const get = async (id) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id, deletedAt: null },
    include: PURCHASE_INCLUDE,
  });
  if (!purchase) throw new AppError('Purchase not found', 404);
  return purchase;
};

const create = async (data, userId) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, deletedAt: null },
  });
  if (!supplier) throw new AppError('Supplier not found', 404);

  if (data.locationId) {
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, deletedAt: null },
    });
    if (!location) throw new AppError('Location not found', 404);
  }

  const purchaseNumber = await generateNumber('PUR');
  const isIndirect = (data.purchaseType || 'DIRECT') === 'INDIRECT';
  const expenseAdjustments = data.expenseAdjustments || [];
  const incomeAdjustments = data.incomeAdjustments || [];
  const {
    lineItems,
    resolvedExpenseAdjustments,
    resolvedIncomeAdjustments,
    ...totals
  } = await buildLineItems(data.lineItems, expenseAdjustments, incomeAdjustments, isIndirect);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        purchaseNumber,
        purchaseDate: new Date(data.purchaseDate),
        purchaseType: data.purchaseType || 'DIRECT',
        purchaseBatchId: data.purchaseBatchId || null,
        supplierId: data.supplierId,
        locationId: data.locationId || null,
        truckNumber: data.truckNumber || null,
        billStockPercent: 100,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        status: 'DRAFT',
        ...totals,
        paidAmount: 0,
        createdById: userId,
        updatedById: userId,
      },
    });

    const lineIds = await createPurchaseLineItems(tx, purchase.id, lineItems, mapPurchaseLineCreate);
    await createPurchaseAdjustments(
      tx,
      purchase.id,
      lineIds,
      resolvedExpenseAdjustments,
      resolvedIncomeAdjustments,
    );

    return tx.purchase.findFirst({
      where: { id: purchase.id },
      include: PURCHASE_INCLUDE,
    });
  });
};

const update = async (id, data, userId) => {
  const purchase = await findById('purchase', id);
  if (!purchase) throw new AppError('Purchase not found', 404);

  const purchaseType = data.purchaseType || purchase.purchaseType;
  const isIndirect = purchaseType === 'INDIRECT';
  const expenseAdjustments = data.expenseAdjustments || [];
  const incomeAdjustments = data.incomeAdjustments || [];
  const updateData = { updatedById: userId };
  const wasConfirmed = purchase.status === 'CONFIRMED';

  if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
  if (data.purchaseType) updateData.purchaseType = data.purchaseType;
  if (data.purchaseBatchId !== undefined) updateData.purchaseBatchId = data.purchaseBatchId || null;
  if (data.supplierId) updateData.supplierId = data.supplierId;
  if (data.locationId !== undefined) updateData.locationId = data.locationId || null;
  if (data.truckNumber !== undefined) updateData.truckNumber = data.truckNumber || null;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  updateData.billStockPercent = 100;

  if (data.lineItems) {
    const {
      lineItems,
      resolvedExpenseAdjustments,
      resolvedIncomeAdjustments,
      ...totals
    } = await buildLineItems(data.lineItems, expenseAdjustments, incomeAdjustments, isIndirect);
    Object.assign(updateData, totals);

    if (wasConfirmed) {
      return prisma.$transaction(async (tx) => {
        await rebuildPurchaseInventory(tx, id);
        await tx.purchase.update({ where: { id }, data: updateData });
        await replacePurchaseLinesAndAdjustments(
          tx,
          id,
          lineItems,
          resolvedExpenseAdjustments,
          resolvedIncomeAdjustments,
        );
        const updated = await tx.purchase.findFirst({
          where: { id },
          include: PURCHASE_INCLUDE,
        });
        await createBatchesFromPurchase(tx, updated);
        return updated;
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.purchase.update({ where: { id }, data: updateData });
      await replacePurchaseLinesAndAdjustments(
        tx,
        id,
        lineItems,
        resolvedExpenseAdjustments,
        resolvedIncomeAdjustments,
      );
      return tx.purchase.findFirst({
        where: { id },
        include: PURCHASE_INCLUDE,
      });
    });
  }

  return prisma.purchase.update({
    where: { id },
    data: updateData,
    include: PURCHASE_INCLUDE,
  });
};

const confirm = async (id, userId) => {
  const purchase = await get(id);
  if (purchase.status === 'CONFIRMED') throw new AppError('Already confirmed', 400);

  const expenseAdjustments = mapStoredAdjustmentsForCalc(
    purchase.expenseAdjustments,
    purchase.lineItems,
    'expenseTypeId',
  );
  const incomeAdjustments = mapStoredAdjustmentsForCalc(
    purchase.incomeAdjustments,
    purchase.lineItems,
    'incomeTypeId',
  );
  const lineInputs = purchase.lineItems.map((l) => ({
    id: l.id,
    qualityId: l.qualityId,
    truckNumber: l.truckNumber,
    weight: l.weight,
    rate: l.rate,
    freight: l.freight,
    additionalExpenses: l.additionalExpenses,
    gstRate: l.gstRate,
    applyGst: l.applyGst,
    taxConfigurationId: l.taxConfigurationId,
  }));

  const calc = calculatePurchaseDocument({
    lineItems: lineInputs,
    expenseAdjustments,
    incomeAdjustments,
    isIndirect: purchase.purchaseType === 'INDIRECT',
  });

  return prisma.$transaction(async (tx) => {
    for (let i = 0; i < calc.lineItems.length; i += 1) {
      const line = calc.lineItems[i];
      const existing = purchase.lineItems[i];
      if (!existing) continue;
      await tx.purchaseLineItem.update({
        where: { id: existing.id },
        data: {
          totalCost: line.totalCost,
          costPerMT: line.costPerMT,
          costPerMTIncGst: line.costPerMTIncGst,
          gstAmount: line.gstAmount,
          netAmount: line.netAmount,
        },
      });
    }

    await tx.purchase.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        updatedById: userId,
        subtotal: calc.subtotal,
        freightTotal: calc.freightTotal,
        expenseTotal: calc.expenseTotal,
        expenseAdjustmentTotal: calc.expenseAdjustmentTotal,
        incomeAdjustmentTotal: calc.incomeAdjustmentTotal,
        gstTotal: calc.gstTotal,
        netAmount: calc.netAmount,
        outstanding: calc.outstanding,
      },
    });

    const confirmed = await tx.purchase.findFirst({
      where: { id },
      include: { lineItems: { include: { quality: true } } },
    });
    await createBatchesFromPurchase(tx, confirmed);
    return confirmed;
  });
};

const remove = async (id, role) => {
  if (!hasPermission(role, PERMISSIONS.PURCHASES_DELETE)) throw new AppError('Not authorized', 403);
  const purchase = await findById('purchase', id);
  if (!purchase) throw new AppError('Purchase not found', 404);
  if (purchase.status === 'CONFIRMED') throw new AppError('Cannot delete confirmed purchase', 400);
  return prisma.purchase.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, get, create, update, confirm, remove };
