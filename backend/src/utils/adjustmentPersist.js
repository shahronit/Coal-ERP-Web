const { lineItemIdAtIndex } = require('./adjustmentBasis');

const mapPurchaseExpenseCreate = (items, lineIds) => items.map((a) => ({
  expenseTypeId: a.expenseTypeId,
  basisType: a.basisType || 'FLAT',
  value: a.value,
  resolvedAmount: a.resolvedAmount,
  description: a.description || null,
  purchaseLineItemId: lineItemIdAtIndex(lineIds, a.lineIndex),
}));

const mapPurchaseIncomeCreate = (items, lineIds) => items.map((a) => ({
  incomeTypeId: a.incomeTypeId,
  basisType: a.basisType || 'FLAT',
  value: a.value,
  resolvedAmount: a.resolvedAmount,
  description: a.description || null,
  purchaseLineItemId: lineItemIdAtIndex(lineIds, a.lineIndex),
}));

const mapSaleExpenseCreate = (items, lineIds) => items.map((a) => ({
  expenseTypeId: a.expenseTypeId,
  basisType: a.basisType || 'FLAT',
  value: a.value,
  resolvedAmount: a.resolvedAmount,
  description: a.description || null,
  saleLineItemId: lineItemIdAtIndex(lineIds, a.lineIndex),
}));

const mapSaleIncomeCreate = (items, lineIds) => items.map((a) => ({
  incomeTypeId: a.incomeTypeId,
  basisType: a.basisType || 'FLAT',
  value: a.value,
  resolvedAmount: a.resolvedAmount,
  description: a.description || null,
  saleLineItemId: lineItemIdAtIndex(lineIds, a.lineIndex),
}));

const createPurchaseLineItems = async (tx, purchaseId, lineItems, mapLineCreate) => {
  const lineIds = [];
  for (const line of lineItems) {
    const created = await tx.purchaseLineItem.create({
      data: { ...mapLineCreate(line), purchaseId },
    });
    lineIds.push(created.id);
  }
  return lineIds;
};

const createSaleLineItems = async (tx, saleId, lineItems, mapLineCreate) => {
  const lineIds = [];
  for (const line of lineItems) {
    const created = await tx.saleLineItem.create({
      data: { ...mapLineCreate(line), saleId },
    });
    lineIds.push(created.id);
  }
  return lineIds;
};

const createPurchaseAdjustments = async (tx, purchaseId, lineIds, expenseItems, incomeItems) => {
  for (const adj of mapPurchaseExpenseCreate(expenseItems, lineIds)) {
    await tx.purchaseExpenseAdjustment.create({ data: { ...adj, purchaseId } });
  }
  for (const adj of mapPurchaseIncomeCreate(incomeItems, lineIds)) {
    await tx.purchaseIncomeAdjustment.create({ data: { ...adj, purchaseId } });
  }
};

const createSaleAdjustments = async (tx, saleId, lineIds, expenseItems, incomeItems) => {
  for (const adj of mapSaleExpenseCreate(expenseItems, lineIds)) {
    await tx.saleExpenseAdjustment.create({ data: { ...adj, saleId } });
  }
  for (const adj of mapSaleIncomeCreate(incomeItems, lineIds)) {
    await tx.saleIncomeAdjustment.create({ data: { ...adj, saleId } });
  }
};

module.exports = {
  mapPurchaseExpenseCreate,
  mapPurchaseIncomeCreate,
  mapSaleExpenseCreate,
  mapSaleIncomeCreate,
  createPurchaseLineItems,
  createSaleLineItems,
  createPurchaseAdjustments,
  createSaleAdjustments,
};
