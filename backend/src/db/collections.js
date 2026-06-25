/** Prisma model name → Firestore collection id */
const MODEL_TO_COLLECTION = {
  user: 'users',
  userProfile: 'userProfiles',
  refreshToken: 'refreshTokens',
  passwordResetToken: 'passwordResetTokens',
  partner: 'partners',
  supplier: 'suppliers',
  customer: 'customers',
  coalQuality: 'coalQualities',
  purchaseBatch: 'purchaseBatches',
  salesBatch: 'salesBatches',
  location: 'locations',
  expenseType: 'expenseTypes',
  incomeType: 'incomeTypes',
  assetType: 'assetTypes',
  taxConfiguration: 'taxConfigurations',
  purchase: 'purchases',
  purchaseLineItem: 'purchaseLineItems',
  purchaseIncomeAdjustment: 'purchaseIncomeAdjustments',
  purchaseExpenseAdjustment: 'purchaseExpenseAdjustments',
  inventoryBatch: 'inventoryBatches',
  sale: 'sales',
  saleLineItem: 'saleLineItems',
  saleFreightEntry: 'saleFreightEntries',
  saleExpenseAdjustment: 'saleExpenseAdjustments',
  saleIncomeAdjustment: 'saleIncomeAdjustments',
  inventoryAllocation: 'inventoryAllocations',
  stockLedger: 'stockLedger',
  payment: 'payments',
  partnerInvestment: 'partnerInvestments',
  investmentReturn: 'investmentReturns',
  expense: 'expenses',
  asset: 'assets',
  document: 'documents',
  auditLog: 'auditLogs',
  notification: 'notifications',
  reportTemplate: 'reportTemplates',
  reportRun: 'reportRuns',
  lead: 'leads',
  activity: 'activities',
  sequenceCounter: 'sequenceCounters',
  appSetting: 'appSettings',
  backupRecord: 'backupRecords',
};

const getCollectionName = (model) => {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  const name = MODEL_TO_COLLECTION[key];
  if (!name) throw new Error(`Unknown Firestore model: ${model}`);
  return name;
};

module.exports = { MODEL_TO_COLLECTION, getCollectionName };
