const fs = require('fs');
const config = require('../config');
const prisma = require('../config/database');
const { DEFAULT_ROLE_MODULES, CONFIGURABLE_ROLES, MODULE_KEYS } = require('../config/roles');

const VALID_MODULE_KEYS = new Set(MODULE_KEYS);

const LEGACY_APP_NAME = 'Coal Trading ERP';
const DEFAULT_APP_NAME = 'VK Trading ERP';

const DEFAULTS = {
  companyName: '',
  appName: DEFAULT_APP_NAME,
  companyLogo: '',
  setupCompleted: false,
  crmEnabled: false,
  autoBackupEnabled: true,
  fifoCostBasis: 'EX_GST',
  roleModules: null,
  backupDir: null,
  lastBackupAt: null,
  customDatabasePath: null,
};

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const normalizeRoleModules = (roleModules) => {
  if (!roleModules || typeof roleModules !== 'object') return null;
  const normalized = {};
  Object.entries(roleModules).forEach(([role, modules]) => {
    if (!CONFIGURABLE_ROLES.includes(role) || !Array.isArray(modules)) return;
    const filtered = modules.filter((m) => VALID_MODULE_KEYS.has(m));
    if (!filtered.includes('dashboard')) filtered.unshift('dashboard');
    normalized[role] = filtered;
  });
  return Object.keys(normalized).length ? normalized : null;
};

const resolveAppName = (stored) => {
  const trimmed = typeof stored === 'string' ? stored.trim() : '';
  if (!trimmed || trimmed === LEGACY_APP_NAME) return DEFAULT_APP_NAME;
  return trimmed;
};

const resolveFifoCostBasis = (stored) => (
  stored === 'INC_GST' ? 'INC_GST' : 'EX_GST'
);

const mapRowToSettings = (row) => ({
  companyName: row?.companyName ?? DEFAULTS.companyName,
  appName: resolveAppName(row?.appName),
  companyLogo: row?.companyLogo ?? DEFAULTS.companyLogo,
  setupCompleted: row?.setupCompleted ?? DEFAULTS.setupCompleted,
  crmEnabled: row?.crmEnabled ?? DEFAULTS.crmEnabled,
  autoBackupEnabled: row?.autoBackupEnabled ?? DEFAULTS.autoBackupEnabled,
  fifoCostBasis: resolveFifoCostBasis(row?.fifoCostBasis ?? DEFAULTS.fifoCostBasis),
  roleModules: normalizeRoleModules(row?.roleModules),
  backupDir: row?.backupDir ?? DEFAULTS.backupDir,
  lastBackupAt: row?.lastBackupAt ?? DEFAULTS.lastBackupAt,
  customDatabasePath: row?.customDatabasePath ?? DEFAULTS.customDatabasePath,
  defaultRoleModules: DEFAULT_ROLE_MODULES,
  databasePath: config.databasePath,
  uploadDir: row?.uploadDir ?? config.uploadDir,
});

const ensureSettingsRow = async (client = prisma) => {
  let row = await client.appSetting.findUnique({ where: { id: 'global' } });
  if (!row) {
    row = await client.appSetting.create({ data: { id: 'global' } });
  }
  return row;
};

const migrateSettingsFromFile = async (client = prisma) => {
  const fileSettings = readJson(config.settingsPath, null);
  if (!fileSettings || typeof fileSettings !== 'object') return null;

  const row = await ensureSettingsRow(client);
  const merged = {
    companyName: fileSettings.companyName ?? row.companyName,
    appName: resolveAppName(fileSettings.appName ?? row.appName),
    companyLogo: fileSettings.companyLogo ?? row.companyLogo,
    setupCompleted: fileSettings.setupCompleted ?? row.setupCompleted,
    crmEnabled: fileSettings.crmEnabled ?? row.crmEnabled,
    autoBackupEnabled: fileSettings.autoBackupEnabled ?? row.autoBackupEnabled,
    fifoCostBasis: resolveFifoCostBasis(fileSettings.fifoCostBasis ?? row.fifoCostBasis),
    roleModules: normalizeRoleModules(fileSettings.roleModules ?? row.roleModules),
    backupDir: fileSettings.backupDir ?? row.backupDir,
    lastBackupAt: fileSettings.lastBackupAt ? new Date(fileSettings.lastBackupAt) : row.lastBackupAt,
    customDatabasePath: fileSettings.customDatabasePath ?? row.customDatabasePath,
  };

  const updated = await client.appSetting.update({
    where: { id: 'global' },
    data: merged,
  });

  try {
    fs.renameSync(config.settingsPath, `${config.settingsPath}.migrated`);
  } catch {
    // ignore if file cannot be renamed
  }

  return updated;
};

const getAppSettings = async () => {
  const row = await ensureSettingsRow();
  const settings = mapRowToSettings(row);

  const resolvedAppName = settings.appName;
  const storedAppName = typeof row.appName === 'string' ? row.appName.trim() : '';
  if (storedAppName !== resolvedAppName) {
    await prisma.appSetting.update({
      where: { id: 'global' },
      data: { appName: resolvedAppName },
    });
    settings.appName = resolvedAppName;
  }

  return settings;
};

const getPublicBranding = async () => {
  const settings = await getAppSettings();
  return {
    appName: settings.appName,
    companyName: settings.companyName,
    companyLogo: settings.companyLogo,
  };
};

const updateAppSettings = async (updates) => {
  await ensureSettingsRow();
  const data = { ...updates };

  if (updates.roleModules !== undefined) {
    data.roleModules = normalizeRoleModules(updates.roleModules);
  }
  if (updates.lastBackupAt !== undefined && updates.lastBackupAt) {
    data.lastBackupAt = new Date(updates.lastBackupAt);
  }
  if (updates.appName !== undefined) {
    data.appName = resolveAppName(updates.appName);
  }
  if (updates.fifoCostBasis !== undefined) {
    data.fifoCostBasis = resolveFifoCostBasis(updates.fifoCostBasis);
  }

  await prisma.appSetting.update({
    where: { id: 'global' },
    data,
  });

  return getAppSettings();
};

module.exports = {
  getAppSettings,
  getPublicBranding,
  updateAppSettings,
  migrateSettingsFromFile,
  ensureSettingsRow,
  DEFAULTS,
  DEFAULT_APP_NAME,
  LEGACY_APP_NAME,
};
