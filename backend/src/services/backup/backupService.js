const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const archiver = require('archiver');
const extract = require('extract-zip');
const prisma = require('../../config/database');
const { disconnectDatabase, connectDatabase, isPostgres, isSqlite, isFirestore } = prisma;
const { createFirestoreBackupArchive } = require('./firestoreBackup');
const { restoreFirestoreFromArchive } = require('./firestoreRestore');
const config = require('../../config');
const logger = require('../../config/logger');
const { AppError } = require('../../utils/AppError');
const { getAppSettings, updateAppSettings } = require('../appSettings');

const execFileAsync = promisify(execFile);
const RETENTION_COUNT = 12;

const defaultBackupDir = () =>
  process.env.TRADECRM_DEFAULT_BACKUP_DIR || path.join(os.homedir(), 'Documents', 'CoalTradingERP-Backups');

const parsePostgresUrl = (url) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database: parsed.pathname.replace(/^\//, ''),
    user: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
  };
};

const getSettings = async () => {
  const appSettings = await getAppSettings();
  return {
    backupDir: appSettings.backupDir || defaultBackupDir(),
    lastBackupAt: appSettings.lastBackupAt || null,
    databasePath: config.databasePath,
    uploadDir: config.uploadDir,
    retentionCount: RETENTION_COUNT,
  };
};

const updateSettings = async ({ backupDir }) => {
  if (!backupDir || typeof backupDir !== 'string') return getSettings();
  fs.mkdirSync(backupDir, { recursive: true });
  await updateAppSettings({ backupDir });
  return getSettings();
};

const zipBackup = ({ zipPath, files = [] }) => new Promise((resolve, reject) => {
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);

  files.forEach(({ sourcePath, archivePath }) => {
    if (fs.existsSync(sourcePath)) {
      if (fs.statSync(sourcePath).isDirectory()) {
        archive.directory(sourcePath, archivePath);
      } else {
        archive.file(sourcePath, { name: archivePath });
      }
    }
  });

  if (fs.existsSync(config.uploadDir)) {
    archive.directory(config.uploadDir, 'uploads');
  }

  archive.finalize();
});

const pruneOldBackups = async (backupDir) => {
  const records = await prisma.backupRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const keep = records.slice(0, RETENTION_COUNT);
  const remove = records.slice(RETENTION_COUNT);

  for (const entry of remove) {
    try {
      if (entry.filePath && fs.existsSync(entry.filePath)) fs.unlinkSync(entry.filePath);
      await prisma.backupRecord.delete({ where: { id: entry.id } });
    } catch (err) {
      logger.warn('Failed to prune old backup', { filePath: entry.filePath, error: err.message });
    }
  }

  return keep;
};

const createDatabaseSnapshot = async (targetPath) => {
  if (isFirestore()) {
    await createFirestoreBackupArchive(targetPath);
    return;
  }

  if (isPostgres()) {
    const pg = parsePostgresUrl(config.databaseUrl);
    const args = [
      '-h', pg.host,
      '-p', pg.port,
      '-U', pg.user,
      '-d', pg.database,
      '-F', 'c',
      '-f', targetPath,
    ];
    await execFileAsync('pg_dump', args, {
      env: { ...process.env, PGPASSWORD: pg.password },
    });
    return;
  }

  if (isSqlite()) {
    const escapedTempDb = targetPath.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedTempDb}'`);
    return;
  }

  throw new AppError('Unsupported database type for backup', 500);
};

const restoreDatabaseSnapshot = async (snapshotPath) => {
  if (isFirestore()) {
    await restoreFirestoreFromArchive(snapshotPath, config.uploadDir);
    return;
  }

  if (isPostgres()) {
    const pg = parsePostgresUrl(config.databaseUrl);
    await disconnectDatabase();
    const args = [
      '-h', pg.host,
      '-p', pg.port,
      '-U', pg.user,
      '-d', pg.database,
      '--clean',
      '--if-exists',
      snapshotPath,
    ];
    await execFileAsync('pg_restore', args, {
      env: { ...process.env, PGPASSWORD: pg.password },
    });
    await connectDatabase();
    return;
  }

  if (isSqlite()) {
    await disconnectDatabase();
    fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
    fs.copyFileSync(snapshotPath, config.databasePath);
    await connectDatabase();
    return;
  }

  throw new AppError('Unsupported database type for restore', 500);
};

const runBackup = async (createdById = null) => {
  const settings = await getSettings();
  fs.mkdirSync(settings.backupDir, { recursive: true });

  const now = new Date();
  const stamp = now.toISOString().slice(0, 7);
  const filename = `TradeCRM-Backup-${stamp}.zip`;
  const zipPath = path.join(settings.backupDir, filename);
  const dbExt = isFirestore() ? 'zip' : isPostgres() ? 'dump' : 'db';
  const tempDb = path.join(settings.backupDir, `.tradecrm-${stamp}-${Date.now()}.${dbExt}`);

  if (fs.existsSync(tempDb)) fs.unlinkSync(tempDb);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  if (isFirestore()) {
    await createDatabaseSnapshot(zipPath);
  } else {
    await createDatabaseSnapshot(tempDb);
    await zipBackup({
      zipPath,
      files: [{ sourcePath: tempDb, archivePath: isPostgres() ? 'tradecrm.dump' : 'tradecrm.db' }],
    });
    fs.unlinkSync(tempDb);
  }

  const stats = fs.statSync(zipPath);
  const record = await prisma.backupRecord.create({
    data: {
      fileName: filename,
      filePath: zipPath,
      sizeBytes: stats.size,
      includes: JSON.stringify(['database', 'uploads']),
      createdById,
    },
  });

  await pruneOldBackups(settings.backupDir);
  await updateAppSettings({ lastBackupAt: now.toISOString() });

  return {
    ...settings,
    lastBackupAt: now.toISOString(),
    history: await prisma.backupRecord.findMany({ orderBy: { createdAt: 'desc' }, take: RETENTION_COUNT }),
    latest: record,
  };
};

const hasBackupForCurrentMonth = async () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const count = await prisma.backupRecord.count({
    where: { createdAt: { gte: new Date(`${currentMonth}-01T00:00:00.000Z`) } },
  });
  return count > 0;
};

const ensureMonthlyBackup = async () => {
  const settings = await getSettings();
  if (await hasBackupForCurrentMonth()) return settings;
  try {
    return await runBackup();
  } catch (err) {
    logger.error('Monthly backup catch-up failed', { error: err.message });
    return settings;
  }
};

const getHistory = async () => {
  const records = await prisma.backupRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: RETENTION_COUNT,
  });
  return records.map((record) => ({
    ...record,
    filename: record.fileName,
  }));
};

const restoreFromBackup = async (backupFilePath) => {
  if (!backupFilePath || typeof backupFilePath !== 'string') {
    throw new AppError('Backup file path is required', 400);
  }
  if (!fs.existsSync(backupFilePath)) {
    throw new AppError('Backup file not found', 404);
  }

  const settings = await getSettings();
  fs.mkdirSync(settings.backupDir, { recursive: true });

  const preRestoreName = `TradeCRM-PreRestore-${Date.now()}.zip`;
  const preRestorePath = path.join(settings.backupDir, preRestoreName);
  await runBackup();

  const tempDir = path.join(os.tmpdir(), `tradecrm-restore-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    await extract(backupFilePath, { dir: tempDir });
    const pgDump = path.join(tempDir, 'tradecrm.dump');
    const sqliteDb = path.join(tempDir, 'tradecrm.db');
    const firestoreManifest = path.join(tempDir, 'firestore', 'manifest.json');
    const isFirestoreZip = fs.existsSync(firestoreManifest)
      || fs.readdirSync(tempDir).some((f) => f.endsWith('.json') && f !== 'manifest.json');

    if (isFirestoreZip && isFirestore()) {
      await restoreFirestoreFromArchive(backupFilePath, config.uploadDir);
    } else {
      const dbSource = fs.existsSync(pgDump) ? pgDump : sqliteDb;
      if (!fs.existsSync(dbSource)) {
        throw new AppError('Invalid backup: missing database snapshot', 400);
      }
      await restoreDatabaseSnapshot(dbSource);
    }

    const uploadsSource = path.join(tempDir, 'uploads');
    if (fs.existsSync(uploadsSource)) {
      fs.rmSync(config.uploadDir, { recursive: true, force: true });
      fs.mkdirSync(config.uploadDir, { recursive: true });
      fs.cpSync(uploadsSource, config.uploadDir, { recursive: true });
    }

    const entry = {
      filename: path.basename(backupFilePath),
      filePath: backupFilePath,
      restoredAt: new Date().toISOString(),
      preRestoreBackup: preRestorePath,
    };

    logger.info('Database restored from backup', entry);
    return entry;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  runBackup,
  ensureMonthlyBackup,
  getHistory,
  restoreFromBackup,
};
