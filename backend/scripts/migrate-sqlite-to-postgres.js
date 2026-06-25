#!/usr/bin/env node
/**
 * One-time migration: copy data from a legacy SQLite tradecrm.db into PostgreSQL.
 *
 * Usage:
 *   SQLITE_PATH=~/Library/Application\ Support/coal-trading-erp/data/tradecrm.db \
 *   DATABASE_URL=postgresql://tradecrm:tradecrm@127.0.0.1:5432/tradecrm \
 *   node backend/scripts/migrate-sqlite-to-postgres.js
 *
 * Prerequisites:
 *   1. PostgreSQL running (docker compose up -d postgres)
 *   2. npx prisma migrate deploy --schema backend/prisma/schema.prisma
 *   3. sqlite3 CLI installed (macOS: preinstalled)
 *   4. pg_dump/pg_restore not required for this script
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const sqlitePath = process.env.SQLITE_PATH;
const databaseUrl = process.env.DATABASE_URL;

if (!sqlitePath || !fs.existsSync(sqlitePath)) {
  console.error('Set SQLITE_PATH to an existing tradecrm.db file.');
  process.exit(1);
}
if (!databaseUrl?.startsWith('postgresql://')) {
  console.error('Set DATABASE_URL to a postgresql:// connection string.');
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;
const prisma = new PrismaClient();

const TABLES_IN_ORDER = [
  'User',
  'UserProfile',
  'RefreshToken',
  'PasswordResetToken',
  'Partner',
  'Supplier',
  'Customer',
  'CoalQuality',
  'PurchaseBatch',
  'SalesBatch',
  'Location',
  'ExpenseType',
  'IncomeType',
  'AssetType',
  'TaxConfiguration',
  'Purchase',
  'PurchaseIncomeAdjustment',
  'PurchaseExpenseAdjustment',
  'PurchaseLineItem',
  'InventoryBatch',
  'Sale',
  'SaleFreightEntry',
  'SaleExpenseAdjustment',
  'SaleIncomeAdjustment',
  'SaleLineItem',
  'InventoryAllocation',
  'StockLedger',
  'Payment',
  'PartnerInvestment',
  'InvestmentReturn',
  'Expense',
  'Asset',
  'Document',
  'AuditLog',
  'Notification',
  'ReportTemplate',
  'ReportRun',
  'Lead',
  'Activity',
  'SequenceCounter',
];

const exportTableJson = (table) => {
  const sql = `SELECT json_group_array(json(row)) FROM "${table}";`;
  const output = execFileSync('sqlite3', [sqlitePath, sql], { encoding: 'utf8' }).trim();
  if (!output || output === '[null]') return [];
  const parsed = JSON.parse(output);
  return parsed.filter(Boolean);
};

const coerceRow = (row) => {
  const next = { ...row };
  Object.entries(next).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      next[key] = new Date(value);
    }
  });
  return next;
};

const modelAccessor = (table) => {
  const map = {
    User: prisma.user,
    UserProfile: prisma.userProfile,
    RefreshToken: prisma.refreshToken,
    PasswordResetToken: prisma.passwordResetToken,
    Partner: prisma.partner,
    Supplier: prisma.supplier,
    Customer: prisma.customer,
    CoalQuality: prisma.coalQuality,
    PurchaseBatch: prisma.purchaseBatch,
    SalesBatch: prisma.salesBatch,
    Location: prisma.location,
    ExpenseType: prisma.expenseType,
    IncomeType: prisma.incomeType,
    AssetType: prisma.assetType,
    TaxConfiguration: prisma.taxConfiguration,
    Purchase: prisma.purchase,
    PurchaseIncomeAdjustment: prisma.purchaseIncomeAdjustment,
    PurchaseExpenseAdjustment: prisma.purchaseExpenseAdjustment,
    PurchaseLineItem: prisma.purchaseLineItem,
    InventoryBatch: prisma.inventoryBatch,
    Sale: prisma.sale,
    SaleFreightEntry: prisma.saleFreightEntry,
    SaleExpenseAdjustment: prisma.saleExpenseAdjustment,
    SaleIncomeAdjustment: prisma.saleIncomeAdjustment,
    SaleLineItem: prisma.saleLineItem,
    InventoryAllocation: prisma.inventoryAllocation,
    StockLedger: prisma.stockLedger,
    Payment: prisma.payment,
    PartnerInvestment: prisma.partnerInvestment,
    InvestmentReturn: prisma.investmentReturn,
    Expense: prisma.expense,
    Asset: prisma.asset,
    Document: prisma.document,
    AuditLog: prisma.auditLog,
    Notification: prisma.notification,
    ReportTemplate: prisma.reportTemplate,
    ReportRun: prisma.reportRun,
    Lead: prisma.lead,
    Activity: prisma.activity,
    SequenceCounter: prisma.sequenceCounter,
  };
  return map[table];
};

const migrateSettingsFile = async () => {
  const settingsPath = process.env.TRADECRM_SETTINGS_PATH
    || path.join(path.dirname(sqlitePath), '..', 'settings.json');
  if (!fs.existsSync(settingsPath)) return;

  const fileSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  await prisma.appSetting.upsert({
    where: { id: 'global' },
    create: {
      id: 'global',
      companyName: fileSettings.companyName || null,
      appName: fileSettings.appName || null,
      companyLogo: fileSettings.companyLogo || null,
      setupCompleted: Boolean(fileSettings.setupCompleted),
      crmEnabled: Boolean(fileSettings.crmEnabled),
      autoBackupEnabled: fileSettings.autoBackupEnabled !== false,
      fifoCostBasis: fileSettings.fifoCostBasis === 'INC_GST' ? 'INC_GST' : 'EX_GST',
      roleModules: fileSettings.roleModules || null,
      backupDir: fileSettings.backupDir || null,
      lastBackupAt: fileSettings.lastBackupAt ? new Date(fileSettings.lastBackupAt) : null,
      customDatabasePath: fileSettings.customDatabasePath || null,
    },
    update: {
      companyName: fileSettings.companyName || null,
      appName: fileSettings.appName || null,
      companyLogo: fileSettings.companyLogo || null,
      setupCompleted: Boolean(fileSettings.setupCompleted),
      crmEnabled: Boolean(fileSettings.crmEnabled),
      autoBackupEnabled: fileSettings.autoBackupEnabled !== false,
      fifoCostBasis: fileSettings.fifoCostBasis === 'INC_GST' ? 'INC_GST' : 'EX_GST',
      roleModules: fileSettings.roleModules || null,
      backupDir: fileSettings.backupDir || null,
      lastBackupAt: fileSettings.lastBackupAt ? new Date(fileSettings.lastBackupAt) : null,
      customDatabasePath: fileSettings.customDatabasePath || null,
    },
  });
  console.log('Migrated settings.json -> AppSetting');
};

const main = async () => {
  console.log('SQLite source:', sqlitePath);
  console.log('PostgreSQL target:', databaseUrl.replace(/:[^:@/]+@/, ':***@'));

  for (const table of TABLES_IN_ORDER) {
    const rows = exportTableJson(table).map(coerceRow);
    const model = modelAccessor(table);
    if (!model) continue;

    let inserted = 0;
    for (const row of rows) {
      try {
        await model.upsert({ where: { id: row.id }, create: row, update: row });
        inserted += 1;
      } catch (err) {
        console.warn(`  skip ${table} id=${row.id}: ${err.message}`);
      }
    }
    console.log(`${table}: ${inserted}/${rows.length} rows`);
  }

  await migrateSettingsFile();

  console.log('\nVerification checklist:');
  console.log('- Users:', await prisma.user.count());
  console.log('- Purchases:', await prisma.purchase.count());
  console.log('- Sales:', await prisma.sale.count());
  console.log('- Inventory batches:', await prisma.inventoryBatch.count());
  console.log('- Payments:', await prisma.payment.count());
  console.log('\nDone. Point all clients to the shared server API URL.');
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
