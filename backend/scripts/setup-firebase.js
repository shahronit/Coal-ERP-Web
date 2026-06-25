#!/usr/bin/env node
/**
 * Verify Firebase setup and optionally migrate Postgres → Firestore.
 *
 *   node backend/scripts/setup-firebase.js
 *   node backend/scripts/setup-firebase.js --migrate
 */
const path = require('path');
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');

const backendRoot = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(backendRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS.replace(/^\.\//, ''))
  : path.join(backendRoot, 'serviceAccountKey.json');

const projectId = process.env.FIREBASE_PROJECT_ID || 'coal-trading-app';
const migrate = process.argv.includes('--migrate');

const fail = (msg) => {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
};

const ok = (msg) => console.log(`✓ ${msg}`);

(async () => {
  console.log(`Firebase setup — ${projectId}\n`);

  if (!fs.existsSync(keyPath)) {
    fail(`Service account key not found at ${keyPath}\n  Download from Firebase Console → Project settings → Service accounts`);
  }
  ok(`Service account key: ${path.basename(keyPath)}`);

  if (process.env.DATABASE_PROVIDER !== 'firestore') {
    fail('Set DATABASE_PROVIDER=firestore in backend/.env');
  }
  ok('DATABASE_PROVIDER=firestore');

  const auth = new GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();

  let databases;
  try {
    const res = await client.request({
      url: `https://firestore.googleapis.com/v1/projects/${projectId}/databases`,
      method: 'GET',
    });
    databases = res.data.databases || [];
  } catch (e) {
    fail(`Cannot reach Firestore API: ${e.response?.data?.error?.message || e.message}`);
  }

  if (databases.length === 0) {
    console.error(`
✗ Firestore database not created yet.

  1. Open: https://console.firebase.google.com/project/${projectId}/firestore
  2. Click "Create database"
  3. Choose Native mode, region asia-south1 (Mumbai)
  4. Enable Blaze billing if prompted (required for Storage + Cloud Run)

  Then re-run:  npm run setup:firebase -- --migrate
`);
    process.exit(1);
  }
  ok(`Firestore database(s): ${databases.map((d) => d.name.split('/').pop()).join(', ')}`);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  const { initFirebase, getFirestore } = require('../src/config/firestore');
  initFirebase();
  await getFirestore().collection('_setup').doc('ping').set({
    checkedAt: new Date().toISOString(),
    source: 'setup-firebase.js',
  });
  ok('Firestore write test passed');

  try {
    const admin = require('firebase-admin');
    const [exists] = await admin.storage().bucket().exists();
    if (exists) ok('Storage bucket reachable');
    else console.warn('⚠ Storage bucket not found — enable Storage in Firebase Console');
  } catch (e) {
    console.warn(`⚠ Storage check skipped: ${e.message}`);
  }

  if (migrate) {
    console.log('\nMigrating Postgres → Firestore...');
    const { execFileSync } = require('child_process');
    execFileSync(process.execPath, [path.join(__dirname, 'migrate-postgres-to-firestore.js')], {
      cwd: backendRoot,
      stdio: 'inherit',
      env: process.env,
    });
    ok('Migration complete');
    console.log('\nNext: quit Electron and run  npm run start:desktop  to use Firestore.');
  } else {
    console.log('\nRun with --migrate to copy Postgres data into Firestore.');
  }
})().catch((e) => fail(e.message));
