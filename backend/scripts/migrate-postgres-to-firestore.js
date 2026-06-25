#!/usr/bin/env node
/**
 * One-time migration: copy data from PostgreSQL into Firestore.
 *
 * Usage:
 *   DATABASE_URL=postgresql://tradecrm:tradecrm@127.0.0.1:5432/tradecrm \
 *   FIREBASE_PROJECT_ID=coal-trading-app \
 *   DATABASE_PROVIDER=firestore \
 *   node backend/scripts/migrate-postgres-to-firestore.js
 */
const { PrismaClient } = require('@prisma/client');
const { initFirebase, getFirestore } = require('../src/config/firestore');
const { MODEL_TO_COLLECTION } = require('../src/db/collections');
const { toFirestoreValue } = require('../src/db/firestore/converters');
const { uploadFile, useFirebaseStorage } = require('../src/services/storage/storageAdapter');
const config = require('../src/config');
const fs = require('fs');
const path = require('path');

process.env.DATABASE_PROVIDER = 'firestore';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.startsWith('postgresql://')) {
  console.error('Set DATABASE_URL to a postgresql:// connection string.');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const TABLES_IN_ORDER = [
  'user', 'userProfile', 'refreshToken', 'passwordResetToken',
  'partner', 'supplier', 'customer', 'coalQuality', 'purchaseBatch', 'salesBatch',
  'location', 'expenseType', 'incomeType', 'assetType', 'taxConfiguration',
  'purchase', 'purchaseIncomeAdjustment', 'purchaseExpenseAdjustment', 'purchaseLineItem',
  'inventoryBatch', 'sale', 'saleFreightEntry', 'saleExpenseAdjustment', 'saleIncomeAdjustment',
  'saleLineItem', 'inventoryAllocation', 'stockLedger', 'payment', 'partnerInvestment',
  'investmentReturn', 'expense', 'asset', 'document', 'auditLog', 'notification',
  'reportTemplate', 'reportRun', 'lead', 'activity', 'sequenceCounter', 'appSetting', 'backupRecord',
];

const batchWrite = async (db, collectionName, rows) => {
  const batchSize = 400;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = db.batch();
    rows.slice(i, i + batchSize).forEach((row) => {
      const { id, ...rest } = row;
      const docId = collectionName === 'appSettings' && !id ? 'global' : id;
      batch.set(db.collection(collectionName).doc(docId), toFirestoreValue(rest));
    });
    await batch.commit();
    console.log(`  ${collectionName}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
};

const migrateDocuments = async () => {
  const docs = await prisma.document.findMany();
  let migrated = 0;
  for (const doc of docs) {
    if (!doc.filePath || !fs.existsSync(doc.filePath)) continue;
    if (useFirebaseStorage()) {
      const fakeFile = {
        path: doc.filePath,
        filename: doc.filename,
        mimetype: doc.mimeType,
      };
      const dest = doc.filePath.startsWith('uploads/') ? doc.filePath : `uploads/${doc.filename}`;
      await uploadFile(fakeFile, dest);
      doc.filePath = dest;
      migrated += 1;
    }
  }
  return { total: docs.length, filesMigrated: migrated };
};

const main = async () => {
  initFirebase();
  const db = getFirestore();
  console.log('Migrating PostgreSQL → Firestore...\n');

  for (const model of TABLES_IN_ORDER) {
    const collection = MODEL_TO_COLLECTION[model];
    if (!collection) {
      console.warn(`Skip unknown model: ${model}`);
      continue;
    }
    const rows = await prisma[model].findMany();
    console.log(`${model} → ${collection} (${rows.length} rows)`);
    if (rows.length === 0) continue;
    await batchWrite(db, collection, rows);
  }

  console.log('\nMigrating document files to Storage...');
  const docStats = await migrateDocuments();
  console.log('Documents:', docStats);

  await prisma.$disconnect();
  console.log('\nDone.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
