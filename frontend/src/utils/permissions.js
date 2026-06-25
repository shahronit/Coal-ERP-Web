/** Mirrors backend/src/config/permissions.js */

export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  MASTERS_READ: 'masters:read',
  MASTERS_WRITE: 'masters:write',
  MASTERS_DELETE: 'masters:delete',
  PURCHASES_READ: 'purchases:read',
  PURCHASES_WRITE: 'purchases:write',
  PURCHASES_DELETE: 'purchases:delete',
  SALES_READ: 'sales:read',
  SALES_WRITE: 'sales:write',
  SALES_DELETE: 'sales:delete',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_WRITE: 'payments:write',
  EXPENSES_READ: 'expenses:read',
  EXPENSES_WRITE: 'expenses:write',
  INVESTMENTS_READ: 'investments:read',
  INVESTMENTS_WRITE: 'investments:write',
  ASSETS_READ: 'assets:read',
  ASSETS_WRITE: 'assets:write',
  REPORTS_READ: 'reports:read',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_WRITE: 'documents:write',
  AUDIT_READ: 'audit:read',
  NOTIFICATIONS_READ: 'notifications:read',
  DASHBOARD_READ: 'dashboard:read',
  CRM_READ: 'crm:read',
  CRM_WRITE: 'crm:write',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  BATCHES_READ: 'batches:read',
  BATCHES_WRITE: 'batches:write',
  PROFIT_LOSS_READ: 'profit-loss:read',
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.USERS_DELETE),
  FINANCE: [
    PERMISSIONS.MASTERS_READ,
    PERMISSIONS.MASTERS_WRITE,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_WRITE,
    PERMISSIONS.PURCHASES_DELETE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.SALES_DELETE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_WRITE,
    PERMISSIONS.EXPENSES_READ,
    PERMISSIONS.EXPENSES_WRITE,
    PERMISSIONS.INVESTMENTS_READ,
    PERMISSIONS.INVESTMENTS_WRITE,
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.ASSETS_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BATCHES_READ,
    PERMISSIONS.PROFIT_LOSS_READ,
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_WRITE,
  ],
  OPERATIONS: [
    PERMISSIONS.MASTERS_READ,
    PERMISSIONS.MASTERS_WRITE,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_WRITE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BATCHES_READ,
    PERMISSIONS.PROFIT_LOSS_READ,
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_WRITE,
  ],
  READ_ONLY: [
    PERMISSIONS.MASTERS_READ,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.EXPENSES_READ,
    PERMISSIONS.INVESTMENTS_READ,
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.BATCHES_READ,
    PERMISSIONS.PROFIT_LOSS_READ,
    PERMISSIONS.CRM_READ,
  ],
};

/** Module key → permission keys for read / write / delete */
export const MODULE_CRUD = {
  dashboard: { read: 'DASHBOARD_READ' },
  masters: { read: 'MASTERS_READ', write: 'MASTERS_WRITE', delete: 'MASTERS_DELETE' },
  purchases: { read: 'PURCHASES_READ', write: 'PURCHASES_WRITE', delete: 'PURCHASES_DELETE' },
  sales: { read: 'SALES_READ', write: 'SALES_WRITE', delete: 'SALES_DELETE' },
  inventory: { read: 'INVENTORY_READ', write: 'INVENTORY_WRITE' },
  batches: { read: 'BATCHES_READ', write: 'BATCHES_WRITE' },
  payments: { read: 'PAYMENTS_READ', write: 'PAYMENTS_WRITE' },
  'profit-loss': { read: 'PROFIT_LOSS_READ' },
  expenses: { read: 'EXPENSES_READ', write: 'EXPENSES_WRITE' },
  investments: { read: 'INVESTMENTS_READ', write: 'INVESTMENTS_WRITE' },
  assets: { read: 'ASSETS_READ', write: 'ASSETS_WRITE' },
  reports: { read: 'REPORTS_READ' },
  documents: { read: 'DOCUMENTS_READ', write: 'DOCUMENTS_WRITE' },
  crm: { read: 'CRM_READ', write: 'CRM_WRITE' },
  audit: { read: 'AUDIT_READ' },
  notifications: { read: 'NOTIFICATIONS_READ' },
  users: { read: 'USERS_READ', write: 'USERS_WRITE', delete: 'USERS_DELETE' },
  settings: { read: 'SETTINGS_READ', write: 'SETTINGS_WRITE' },
  help: { read: null },
};

export const hasPermission = (role, permissionKey) => {
  if (!role || !permissionKey) return false;
  const perm = PERMISSIONS[permissionKey];
  if (!perm) return false;
  return (ROLE_PERMISSIONS[role] || []).includes(perm);
};

export const canReadModule = (role, module) => {
  if (!role || !module) return false;
  if (module === 'help') return true;
  if (['users', 'settings'].includes(module)) {
    return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  }
  const key = MODULE_CRUD[module]?.read;
  if (!key) return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  return hasPermission(role, key);
};

export const canWriteModule = (role, module) => {
  if (!role || !module) return false;
  if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return true;
  const key = MODULE_CRUD[module]?.write;
  return key ? hasPermission(role, key) : false;
};

export const canDeleteModule = (role, module) => {
  if (!role || !module) return false;
  if (module === 'users') return role === 'SUPER_ADMIN';
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'ADMIN') return module !== 'users';
  const key = MODULE_CRUD[module]?.delete;
  return key ? hasPermission(role, key) : false;
};

export const getCrudAccess = (role, module) => ({
  canRead: canReadModule(role, module),
  canCreate: canWriteModule(role, module),
  canUpdate: canWriteModule(role, module),
  canDelete: canDeleteModule(role, module),
});

/** Global search result type → module key for permission filtering */
export const SEARCH_TYPE_MODULE = {
  purchase: 'purchases',
  sale: 'sales',
  customer: 'masters',
  supplier: 'masters',
  partner: 'masters',
  purchaseBatch: 'batches',
  salesBatch: 'batches',
  payment: 'payments',
};

export const canAccessSearchResult = (role, resultType) => {
  const module = SEARCH_TYPE_MODULE[resultType];
  return module ? canReadModule(role, module) : false;
};
