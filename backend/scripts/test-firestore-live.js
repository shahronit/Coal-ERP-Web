#!/usr/bin/env node
/**
 * Smoke test: write + read master data on live Firestore.
 *   node backend/scripts/test-firestore-live.js
 */
const path = require('path');
const backendRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(backendRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const { getDb, connectDatabase, disconnectDatabase } = require('../src/db');
const { getFirestore } = require('../src/config/firestore');

const stamp = Date.now();

const run = async () => {
  console.log('Firestore live test — coal-trading-app\n');
  await connectDatabase();
  const db = getDb();

  const admin = await db.user.findFirst({
    where: { email: 'superadmin@tradecrm.com', deletedAt: null },
  });
  if (!admin) throw new Error('Migrated superadmin user not found in Firestore');
  console.log(`✓ Fetched user: ${admin.email} (${admin.role})`);

  const location = await db.location.create({
    data: {
      name: `Test Yard ${stamp}`,
      address: 'Mumbai, MH',
      isActive: true,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
  console.log(`✓ Created location: ${location.name} [${location.id}]`);

  const quality = await db.coalQuality.create({
    data: {
      name: `Test GCV ${stamp}`,
      gcv: 5800,
      ashPercent: 11,
      moisturePercent: 8,
      isActive: true,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
  console.log(`✓ Created coal quality: ${quality.name} [${quality.id}]`);

  const supplier = await db.supplier.create({
    data: {
      name: `Test Supplier ${stamp}`,
      phone: '9876543210',
      isActive: true,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
  console.log(`✓ Created supplier: ${supplier.name} [${supplier.id}]`);

  const customer = await db.customer.create({
    data: {
      name: `Test Customer ${stamp}`,
      phone: '9123456780',
      isActive: true,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
  console.log(`✓ Created customer: ${customer.name} [${customer.id}]`);

  const locations = await db.location.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log(`\n✓ findMany locations (latest ${locations.length}):`);
  locations.forEach((row) => console.log(`    - ${row.name}`));

  const qualities = await db.coalQuality.count({ where: { deletedAt: null } });
  const suppliers = await db.supplier.count({ where: { deletedAt: null } });
  const customers = await db.customer.count({ where: { deletedAt: null } });
  console.log(`\n✓ Counts — qualities: ${qualities}, suppliers: ${suppliers}, customers: ${customers}`);

  const fsDoc = await getFirestore().collection('locations').doc(location.id).get();
  if (!fsDoc.exists) throw new Error('Direct Firestore read failed');
  console.log(`✓ Direct Firestore read: locations/${location.id} → ${fsDoc.data().name}`);

  console.log('\nAll Firestore read/write tests passed.');
};

run()
  .catch((e) => {
    console.error('\n✗ Test failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
