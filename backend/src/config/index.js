const path = require('path');
const fs = require('fs');
const os = require('os');

const backendRoot = path.join(__dirname, '../..');
require('dotenv').config({ path: path.join(backendRoot, '.env'), override: true });

// Electron sets TRADECRM_DESKTOP_PORT after picking/bind port — keep it over .env PORT
if (process.env.TRADECRM_DESKTOP_PORT) {
  process.env.PORT = process.env.TRADECRM_DESKTOP_PORT;
}

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(backendRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

// Cloud deploy (Render, etc.): write service account JSON from env to a temp file
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = path.join(os.tmpdir(), 'firebase-service-account.json');
  fs.writeFileSync(credPath, process.env.FIREBASE_SERVICE_ACCOUNT_JSON, { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

const deployMode = process.env.TRADECRM_MODE || 'standalone';
const userDataDir = process.env.TRADECRM_USER_DATA_DIR || path.join(os.homedir(), '.tradecrm-pro');
const dataDir = process.env.TRADECRM_DATA_DIR || path.join(userDataDir, 'data');
const uploadDir = process.env.UPLOAD_DIR || path.join(userDataDir, 'uploads');
const settingsPath = process.env.TRADECRM_SETTINGS_PATH || path.join(userDataDir, 'settings.json');

const readCustomDatabasePath = () => {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.customDatabasePath && typeof settings.customDatabasePath === 'string') {
      return settings.customDatabasePath.trim();
    }
  } catch {
    // ignore missing settings
  }
  return null;
};

const databasePath = process.env.TRADECRM_DATABASE_PATH
  || readCustomDatabasePath()
  || path.join(dataDir, 'tradecrm.db');

const databaseUrl = process.env.DATABASE_URL
  || 'postgresql://tradecrm:tradecrm@127.0.0.1:5432/tradecrm';

process.env.DATABASE_URL = databaseUrl;

const getDatabaseProvider = () => (process.env.DATABASE_PROVIDER || 'postgres').toLowerCase();

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
  || process.env.GCLOUD_PROJECT
  || 'coal-trading-app';
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET
  || `${firebaseProjectId}.firebasestorage.app`;
const backupGcsBucket = process.env.BACKUP_GCS_BUCKET || `${firebaseProjectId}-backups`;

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS || '';
  const origins = raw.split(',').map((item) => item.trim()).filter(Boolean);
  if (process.env.RENDER_EXTERNAL_URL && !origins.includes(process.env.RENDER_EXTERNAL_URL)) {
    origins.push(process.env.RENDER_EXTERNAL_URL);
  }
  return origins;
};

module.exports = {
  deployMode,
  isServerMode: deployMode === 'server',
  isClientMode: deployMode === 'client',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  nodeEnv: process.env.NODE_ENV || 'development',
  userDataDir,
  dataDir,
  databasePath,
  settingsPath,
  secretsPath: process.env.TRADECRM_SECRETS_PATH || path.join(userDataDir, 'secrets.json'),
  databaseUrl,
  get databaseProvider() {
    return getDatabaseProvider();
  },
  get isFirestoreProvider() {
    return getDatabaseProvider() === 'firestore';
  },
  firebase: {
    projectId: firebaseProjectId,
    storageBucket: firebaseStorageBucket,
    backupGcsBucket: backupGcsBucket,
  },
  corsAllowedOrigins: parseAllowedOrigins(),
  remoteApiUrl: process.env.TRADECRM_REMOTE_API_URL || '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173',
  uploadDir,
  largeTransactionThreshold: parseFloat(process.env.LARGE_TRANSACTION_THRESHOLD || '100000'),
  lowStockThresholdPercent: parseFloat(process.env.LOW_STOCK_THRESHOLD_PERCENT || '10'),
  smtp: {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
