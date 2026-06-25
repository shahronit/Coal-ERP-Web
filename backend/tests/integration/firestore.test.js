/**
 * Integration tests for Firestore provider (run with emulators).
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   FIREBASE_PROJECT_ID=coal-trading-app \
 *   DATABASE_PROVIDER=firestore \
 *   node --test tests/integration/firestore.test.js
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_PROVIDER = 'firestore';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'coal-trading-app';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}

const { getDb, connectDatabase, disconnectDatabase } = require('../../src/db');
const { generateNumber } = require('../../src/utils/sequence');

describe('Firestore integration', () => {
  before(async () => {
    await connectDatabase();
  });

  after(async () => {
    await disconnectDatabase();
  });

  it('creates and reads app settings singleton', async () => {
    const db = getDb();
    await db.appSetting.create({
      data: { id: 'global', companyName: 'Test Co', setupCompleted: false },
    });
    const row = await db.appSetting.findUnique({ where: { id: 'global' } });
    assert.equal(row.companyName, 'Test Co');
  });

  it('generates sequence numbers', async () => {
    const num = await generateNumber('TST');
    assert.match(num, /^TST-\d{4}-\d{5}$/);
  });

  it('runs purchase confirm flow with inventory batch', async () => {
    const db = getDb();
    const quality = await db.coalQuality.create({
      data: { name: `Q-${Date.now()}`, isActive: true },
    });
    const supplier = await db.supplier.create({
      data: { name: `S-${Date.now()}`, isActive: true },
    });

    const purchase = await db.purchase.create({
      data: {
        purchaseNumber: `PUR-TEST-${Date.now()}`,
        purchaseDate: new Date(),
        supplierId: supplier.id,
        status: 'CONFIRMED',
        netAmount: 1000,
        subtotal: 1000,
      },
    });

    const line = await db.purchaseLineItem.create({
      data: {
        purchaseId: purchase.id,
        qualityId: quality.id,
        weight: 10,
        rate: 100,
        costPerMT: 100,
        costPerMTIncGst: 118,
        netAmount: 1000,
      },
    });

    const batch = await db.inventoryBatch.create({
      data: {
        purchaseLineItemId: line.id,
        qualityId: quality.id,
        purchaseDate: new Date(),
        originalWeight: 10,
        remainingWeight: 10,
        costPerMT: 100,
        costPerMTIncGst: 118,
      },
    });

    assert.equal(batch.remainingWeight, 10);

    await db.stockLedger.create({
      data: {
        qualityId: quality.id,
        entryType: 'PURCHASE_IN',
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        weightMT: 10,
        balanceMT: 10,
        costPerMT: 100,
      },
    });

    const ledger = await db.stockLedger.findFirst({
      where: { referenceId: purchase.id },
    });
    assert.ok(ledger);
    assert.equal(Number(ledger.balanceMT), 10);
  });

  it('FIFO allocation decrements batch remaining weight', async () => {
    const db = getDb();
    const batches = await db.inventoryBatch.findMany({
      where: { remainingWeight: { gt: 0 } },
      orderBy: { purchaseDate: 'asc' },
      take: 1,
    });
    if (batches.length === 0) return;

    const batch = batches[0];
    const consume = 1;
    await db.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        remainingWeight: { decrement: consume },
        soldWeight: { increment: consume },
      },
    });

    const updated = await db.inventoryBatch.findUnique({ where: { id: batch.id } });
    assert.equal(Number(updated.remainingWeight), Number(batch.remainingWeight) - consume);
  });
});
