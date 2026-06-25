#!/usr/bin/env node
/**
 * Database health audit — run before debugging 500 errors.
 *   node backend/scripts/db-audit.js
 */
const path = require('path');
const backendRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env'), override: true });

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(backendRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const fs = require('fs');

const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => console.log(`  ✗ ${msg}`);
const warn = (msg) => console.log(`  ⚠ ${msg}`);

const run = async () => {
  console.log('\n=== TradeCRM Database Audit ===\n');

  const provider = (process.env.DATABASE_PROVIDER || 'postgres').toLowerCase();
  console.log(`DATABASE_PROVIDER: ${provider}`);

  if (provider === 'firestore') {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath || !fs.existsSync(keyPath)) {
      fail(`Service account missing: ${keyPath || '(not set)'}`);
      process.exitCode = 1;
    } else {
      ok(`Service account: ${path.basename(keyPath)}`);
    }

    const config = require('../src/config');
    const { connectDatabase, getDb, disconnectDatabase } = require('../src/db');
    await connectDatabase();
    ok(`Config reports: ${config.databaseProvider} (${config.firebase.projectId})`);

    const db = getDb();
    const userCount = await db.user.count({ where: { deletedAt: null } });
    const purchaseCount = await db.purchase.count({ where: { deletedAt: null } });
    ok(`Firestore reachable — users: ${userCount}, purchases: ${purchaseCount}`);

    const purchaseService = require('../src/modules/purchases/purchase.service');
    const user = await db.user.findFirst({ where: { email: 'superadmin@tradecrm.com', deletedAt: null } });
    const sup = await db.supplier.findFirst({ where: { deletedAt: null } });
    const q = await db.coalQuality.findFirst({ where: { deletedAt: null } });
    if (user && sup && q) {
      const created = await purchaseService.create({
        purchaseDate: new Date().toISOString(),
        purchaseType: 'DIRECT',
        supplierId: sup.id,
        lineItems: [{ qualityId: q.id, weight: 1, rate: 100, freight: 0, additionalExpenses: 0, applyGst: false }],
      }, user.id);
      ok(`Purchase create test: ${created.purchaseNumber}`);
      await db.purchase.update({ where: { id: created.id }, data: { deletedAt: new Date() } });
    } else {
      warn('Skipped purchase create test — missing user/supplier/quality');
    }

    await disconnectDatabase();
  } else {
    warn('Postgres mode — ensure docker postgres is running: npm run db:up');
    try {
      const { connectDatabase, disconnectDatabase } = require('../src/db');
      await connectDatabase();
      ok('Postgres connected');
      await disconnectDatabase();
    } catch (e) {
      fail(`Postgres unreachable: ${e.message}`);
      process.exitCode = 1;
    }
  }

  console.log('\n=== Audit complete ===\n');
};

run().catch((e) => {
  fail(e.message);
  process.exit(1);
});
