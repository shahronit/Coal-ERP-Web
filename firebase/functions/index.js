const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
const BACKUP_BUCKET = process.env.BACKUP_GCS_BUCKET || `${PROJECT_ID}-backups`;
const API_URL = process.env.TRADECRM_API_URL;

/**
 * Monthly Firestore + Storage backup trigger.
 * Calls Cloud Run backup endpoint or runs export directly.
 * Configure Cloud Scheduler: 0 2 1 * * (1st of month, 2am)
 */
exports.monthlyBackup = onSchedule(
  {
    schedule: '0 2 1 * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/backup/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.BACKUP_CRON_TOKEN || ''}`,
        },
      });
      if (!res.ok) throw new Error(`Backup API failed: ${res.status}`);
      return;
    }

    const bucket = admin.storage().bucket(BACKUP_BUCKET);
    const stamp = new Date().toISOString().slice(0, 7);
    const exportPath = `gs://${BACKUP_BUCKET}/firestore-exports/${stamp}`;
    const client = new admin.firestore.v1.FirestoreAdminClient();
    const databaseName = client.databasePath(PROJECT_ID, '(default)');
    await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: exportPath,
    });
    console.log('Firestore export started:', exportPath);
  },
);

/**
 * Keep-alive ping for Firestore (optional — prevents Supabase-style concerns on other hosts).
 * Every 3 days at midnight IST.
 */
exports.keepAlive = onSchedule(
  {
    schedule: '0 0 */3 * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    await admin.firestore().collection('appSettings').doc('global').get();
    console.log('Keep-alive ping OK');
  },
);

exports.health = onRequest({ region: 'asia-south1' }, (_req, res) => {
  res.json({ ok: true, service: 'tradecrm-functions' });
});
