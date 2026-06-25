export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY'];

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  FINANCE: 60,
  OPERATIONS: 40,
  READ_ONLY: 20,
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
  READ_ONLY: 'Read Only',
};

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'masters', label: 'Master Data' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'sales', label: 'Sales' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'batches', label: 'Batches' },
  { key: 'payments', label: 'Payments' },
  { key: 'profit-loss', label: 'Profit & Loss' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'investments', label: 'Investments' },
  { key: 'assets', label: 'Assets' },
  { key: 'reports', label: 'Reports' },
  { key: 'documents', label: 'Documents' },
  { key: 'crm', label: 'CRM' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'notifications', label: 'Notifications' },
];

export const DEFAULT_ROLE_MODULES = {
  FINANCE: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'payments', 'expenses', 'investments', 'assets', 'reports', 'documents', 'audit', 'notifications', 'batches', 'profit-loss', 'crm'],
  OPERATIONS: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'documents', 'notifications', 'batches', 'profit-loss', 'crm'],
  READ_ONLY: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'payments', 'expenses', 'investments', 'assets', 'reports', 'documents', 'audit', 'notifications', 'batches', 'profit-loss', 'crm'],
};

export const CONFIGURABLE_ROLES = ['FINANCE', 'OPERATIONS', 'READ_ONLY'];

export const canAssignRole = (assignerRole, targetRole) => {
  if (!ROLES.includes(targetRole)) return false;
  if (assignerRole === 'SUPER_ADMIN') return true;
  if (assignerRole === 'ADMIN') return targetRole !== 'SUPER_ADMIN';
  return false;
};

export const getAssignableRoles = (assignerRole) => {
  if (assignerRole === 'SUPER_ADMIN') return [...ROLES];
  if (assignerRole === 'ADMIN') return ROLES.filter((role) => role !== 'SUPER_ADMIN');
  return [];
};

export const getEffectiveModules = (role, roleModulesOverride = null) => {
  if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return ['all'];
  if (roleModulesOverride?.[role]) return roleModulesOverride[role];
  return DEFAULT_ROLE_MODULES[role] || [];
};

export const buildCanAccess = (roleModulesOverride = null, crmEnabled = true) => (role, module) => {
  if (!role) return false;
  if (module === 'help') return true;
  if (module === 'users' || module === 'settings') return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  if (module === 'crm' && !crmEnabled) return false;
  if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return true;
  const modules = getEffectiveModules(role, roleModulesOverride);
  return modules.includes('all') || modules.includes(module);
};

/** @deprecated use buildCanAccess or useModuleAccess hook */
export const canAccess = buildCanAccess(null, true);
