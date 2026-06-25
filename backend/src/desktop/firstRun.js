const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { getDb } = require('../db');
const config = require('../config');
const logger = require('../config/logger');
const { isPostgresUrl } = require('../utils/databaseUrl');
const { getAppSettings, updateAppSettings, migrateSettingsFromFile } = require('../services/appSettings');
const { ensureDemoUsers } = require('../services/demoSeed/demoSeedService');

const execFileAsync = promisify(execFile);

const backendRoot = process.env.TRADECRM_BACKEND_DIR || path.resolve(__dirname, '../..');

const DEMO_EMAIL = process.env.TRADECRM_INITIAL_EMAIL || 'superadmin@tradecrm.com';
const LEGACY_DEMO_EMAIL = 'superadmin@tradecrm.local';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const resolvePrismaCli = () => {
  const candidates = [
    path.join(backendRoot, 'node_modules/prisma/build/index.js'),
    path.resolve(backendRoot, '../node_modules/prisma/build/index.js'),
    path.resolve(process.cwd(), 'node_modules/prisma/build/index.js'),
  ];
  const cli = candidates.find((candidate) => fs.existsSync(candidate));
  if (!cli) throw new Error('Unable to locate Prisma CLI for migration deploy');
  return cli;
};

const resolveMigrationEnv = () => {
  const env = { ...process.env, DATABASE_URL: config.databaseUrl };
  delete env.ELECTRON_RUN_AS_NODE;
  if (process.versions.electron) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }
  process.env.DATABASE_URL = config.databaseUrl;
  return env;
};

const resolveMigrateExecutable = () => {
  if (process.env.TRADECRM_NODE_BIN && fs.existsSync(process.env.TRADECRM_NODE_BIN)) {
    return process.env.TRADECRM_NODE_BIN;
  }

  if (process.versions.electron) return process.execPath;

  const systemNode = ['/opt/homebrew/bin/node', '/usr/local/bin/node'].find((candidate) => fs.existsSync(candidate));
  if (systemNode) return systemNode;

  return process.execPath;
};

const runMigrateDeploy = async () => {
  const prismaCli = resolvePrismaCli();
  const schemaPath = path.join(backendRoot, 'prisma/schema.prisma');
  const migrateExecutable = resolveMigrateExecutable();
  const maxAttempts = isPostgresUrl(config.databaseUrl) ? 1 : 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await execFileAsync(
        migrateExecutable,
        [prismaCli, 'migrate', 'deploy', '--schema', schemaPath],
        {
          cwd: backendRoot,
          env: resolveMigrationEnv(),
          timeout: 120000,
        },
      );
      return;
    } catch (error) {
      const message = `${error.stderr || ''}${error.stdout || ''}${error.message || ''}`;
      const isLocked = /database is locked/i.test(message);
      if (!isLocked || attempt === maxAttempts) {
        logger.error('Database migration failed', { error: message, attempt });
        throw new Error(isLocked ? 'Database is locked. Quit other app instances and try again.' : message);
      }
      logger.warn('Database locked during migration, retrying', { attempt });
      await sleep(500 * attempt);
    }
  }
};

const applyMigrations = async () => {
  fs.mkdirSync(config.dataDir, { recursive: true });
  if (config.isFirestoreProvider) {
    logger.info('Firestore provider active — skipping Prisma migrations');
    const { initFirebase } = require('../config/firestore');
    initFirebase();
    return;
  }
  logger.info('Applying pending database migrations if needed');
  await runMigrateDeploy();
};

const ensureDemoAccess = async () => {
  const db = getDb();
  try {
    await migrateSettingsFromFile(db);

    const legacyUser = await db.user.findFirst({
      where: { email: LEGACY_DEMO_EMAIL, deletedAt: null },
    });
    if (legacyUser) {
      await db.user.update({
        where: { id: legacyUser.id },
        data: { email: DEMO_EMAIL },
      });
      logger.info('Migrated legacy demo admin email to current demo address');
    }

    const userCount = await db.user.count({ where: { deletedAt: null } });
    if (userCount === 0) {
      await ensureDemoUsers();
      logger.info('Initial demo users created');
      await updateAppSettings({
        companyName: 'Demo Coal Trading Co.',
        setupCompleted: true,
      });
    }
  } finally {
    await db.$disconnect();
  }
};

const persistDatabaseLocation = async () => {
  const settings = await getAppSettings();
  if (!settings.uploadDir) {
    await updateAppSettings({ uploadDir: config.uploadDir });
  }
};

const ensureDesktopDatabase = async () => {
  await applyMigrations();
  await ensureDemoAccess();
  await persistDatabaseLocation();
};

module.exports = {
  ensureDesktopDatabase,
  applyMigrations,
  ensureDemoAccess,
  seedInitialAdmin: ensureDemoAccess,
};
