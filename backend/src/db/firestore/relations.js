/** Prisma-style include → Firestore join resolution */
const INCLUDE_MAP = {
  purchase: {
    supplier: { model: 'supplier', fk: 'supplierId' },
    location: { model: 'location', fk: 'locationId' },
    purchaseBatch: { model: 'purchaseBatch', fk: 'purchaseBatchId' },
    createdBy: { model: 'user', fk: 'createdById' },
    updatedBy: { model: 'user', fk: 'updatedById' },
    lineItems: { model: 'purchaseLineItem', fk: 'purchaseId', reverse: true },
    incomeAdjustments: { model: 'purchaseIncomeAdjustment', fk: 'purchaseId', reverse: true },
    expenseAdjustments: { model: 'purchaseExpenseAdjustment', fk: 'purchaseId', reverse: true },
  },
  purchaseLineItem: {
    quality: { model: 'coalQuality', fk: 'qualityId' },
    taxConfiguration: { model: 'taxConfiguration', fk: 'taxConfigurationId' },
    inventoryBatch: { model: 'inventoryBatch', fk: 'purchaseLineItemId', reverse: true, single: true },
    purchase: { model: 'purchase', fk: 'purchaseId' },
  },
  purchaseIncomeAdjustment: {
    incomeType: { model: 'incomeType', fk: 'incomeTypeId' },
    purchaseLineItem: { model: 'purchaseLineItem', fk: 'purchaseLineItemId' },
  },
  purchaseExpenseAdjustment: {
    expenseType: { model: 'expenseType', fk: 'expenseTypeId' },
    purchaseLineItem: { model: 'purchaseLineItem', fk: 'purchaseLineItemId' },
  },
  sale: {
    customer: { model: 'customer', fk: 'customerId' },
    salesBatch: { model: 'salesBatch', fk: 'salesBatchId' },
    lineItems: { model: 'saleLineItem', fk: 'saleId', reverse: true },
    freightEntries: { model: 'saleFreightEntry', fk: 'saleId', reverse: true },
    incomeAdjustments: { model: 'saleIncomeAdjustment', fk: 'saleId', reverse: true },
    expenseAdjustments: { model: 'saleExpenseAdjustment', fk: 'saleId', reverse: true },
  },
  saleLineItem: {
    quality: { model: 'coalQuality', fk: 'qualityId' },
    taxConfiguration: { model: 'taxConfiguration', fk: 'taxConfigurationId' },
    allocations: { model: 'inventoryAllocation', fk: 'saleLineItemId', reverse: true },
  },
  inventoryAllocation: {
    inventoryBatch: { model: 'inventoryBatch', fk: 'inventoryBatchId' },
    saleLineItem: { model: 'saleLineItem', fk: 'saleLineItemId' },
  },
  inventoryBatch: {
    quality: { model: 'coalQuality', fk: 'qualityId' },
    location: { model: 'location', fk: 'locationId' },
    purchaseBatch: { model: 'purchaseBatch', fk: 'purchaseBatchId' },
    purchaseLineItem: { model: 'purchaseLineItem', fk: 'purchaseLineItemId' },
  },
  expense: { expenseType: { model: 'expenseType', fk: 'expenseTypeId' } },
  asset: { assetType: { model: 'assetType', fk: 'assetTypeId' } },
  partnerInvestment: {
    partner: { model: 'partner', fk: 'partnerId' },
    returns: { model: 'investmentReturn', fk: 'investmentId', reverse: true },
  },
  activity: {
    lead: { model: 'lead', fk: 'leadId' },
    customer: { model: 'customer', fk: 'customerId' },
    owner: { model: 'user', fk: 'ownerId' },
  },
  lead: {
    owner: { model: 'user', fk: 'ownerId' },
    activities: { model: 'activity', fk: 'leadId', reverse: true },
  },
  document: { uploadedBy: { model: 'user', fk: 'uploadedById' } },
  backupRecord: { createdBy: { model: 'user', fk: 'createdById' } },
};

/** Nested where filters that require a join pre-step */
const NESTED_WHERE = {
  inventoryBatch: {
    purchaseLineItem: { via: 'purchaseLineItemId', target: 'purchaseLineItem', nestedKey: 'purchaseId' },
  },
};

module.exports = { INCLUDE_MAP, NESTED_WHERE };
