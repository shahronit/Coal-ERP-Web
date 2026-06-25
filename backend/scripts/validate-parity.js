#!/usr/bin/env node
/**
 * Compare row counts and key totals between PostgreSQL and Firestore.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... DATABASE_PROVIDER=firestore node backend/scripts/validate-parity.js
 */
const { PrismaClient } = require('@prisma/client');
const { initFirebase, getFirestore } = require('../src/config/firestore');
const { MODEL_TO_COLLECTION } = require('../src/db/collections');
const { toNumber } = require('../src/utils/calculations');

process.env.DATABASE_PROVIDER = 'firestore';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const checks = [];

const compareCount = async (model, collection) => {
  const pgCount = await prisma[model].count();
  const snap = await getFirestore().collection(collection).get();
  const fsCount = snap.size;
  const ok = pgCount === fsCount;
  checks.push({ model, pgCount, fsCount, ok });
  return ok;
};

const main = async () => {
  initFirebase();
  const db = getFirestore();
  console.log('Parity validation: PostgreSQL vs Firestore\n');

  for (const [model, collection] of Object.entries(MODEL_TO_COLLECTION)) {
    await compareCount(model, collection);
  }

  const [pgPurchaseSum, pgSaleProfit, pgStock] = await Promise.all([
    prisma.purchase.aggregate({ where: { deletedAt: null }, _sum: { netAmount: true } }),
    prisma.sale.aggregate({ where: { deletedAt: null }, _sum: { profit: true } }),
    prisma.inventoryBatch.aggregate({ _sum: { remainingWeight: true } }),
  ]);

  const purchaseSnap = await db.collection('purchases').where('deletedAt', '==', null).get();
  let fsPurchaseSum = 0;
  purchaseSnap.docs.forEach((d) => { fsPurchaseSum += toNumber(d.data().netAmount); });

  const saleSnap = await db.collection('sales').where('deletedAt', '==', null).get();
  let fsSaleProfit = 0;
  saleSnap.docs.forEach((d) => { fsSaleProfit += toNumber(d.data().profit); });

  const batchSnap = await db.collection('inventoryBatches').get();
  let fsStock = 0;
  batchSnap.docs.forEach((d) => { fsStock += toNumber(d.data().remainingWeight); });

  const totals = [
    {
      metric: 'purchase netAmount sum',
      pg: toNumber(pgPurchaseSum._sum.netAmount),
      fs: fsPurchaseSum,
    },
    {
      metric: 'sale profit sum',
      pg: toNumber(pgSaleProfit._sum.profit),
      fs: fsSaleProfit,
    },
    {
      metric: 'inventory remainingWeight sum',
      pg: toNumber(pgStock._sum.remainingWeight),
      fs: fsStock,
    },
  ];

  console.log('\n--- Row counts ---');
  checks.forEach(({ model, pgCount, fsCount, ok }) => {
    console.log(`${ok ? 'OK' : 'FAIL'} ${model}: pg=${pgCount} fs=${fsCount}`);
  });

  console.log('\n--- Totals ---');
  let failed = checks.some((c) => !c.ok);
  totals.forEach(({ metric, pg, fs }) => {
    const ok = Math.abs(pg - fs) < 0.01;
    if (!ok) failed = true;
    console.log(`${ok ? 'OK' : 'FAIL'} ${metric}: pg=${pg} fs=${fs}`);
  });

  await prisma.$disconnect();
  if (failed) {
    console.error('\nParity validation FAILED');
    process.exit(1);
  }
  console.log('\nParity validation PASSED');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
