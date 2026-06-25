const ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY'];

const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  FINANCE: 60,
  OPERATIONS: 40,
  READ_ONLY: 20,
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
  READ_ONLY: 'Read Only',
};

const MODULES = [
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

const DEFAULT_ROLE_MODULES = {
  FINANCE: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'payments', 'expenses', 'investments', 'assets', 'reports', 'documents', 'audit', 'notifications', 'batches', 'profit-loss', 'crm'],
  OPERATIONS: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'documents', 'notifications', 'batches', 'profit-loss', 'crm'],
  READ_ONLY: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'payments', 'expenses', 'investments', 'assets', 'reports', 'documents', 'audit', 'notifications', 'batches', 'profit-loss', 'crm'],
};

const CONFIGURABLE_ROLES = ['FINANCE', 'OPERATIONS', 'READ_ONLY'];

const canAssignRole = (assignerRole, targetRole) => {
  if (!ROLES.includes(targetRole)) return false;
  if (assignerRole === 'SUPER_ADMIN') return true;
  if (assignerRole === 'ADMIN') return targetRole !== 'SUPER_ADMIN';
  return false;
};

const getAssignableRoles = (assignerRole) => {
  if (assignerRole === 'SUPER_ADMIN') return [...ROLES];
  if (assignerRole === 'ADMIN') return ROLES.filter((role) => role !== 'SUPER_ADMIN');
  return [];
};

const getEffectiveModules = (role, roleModulesOverride = {}) => {
  if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return ['all'];
  if (roleModulesOverride[role]) return roleModulesOverride[role];
  return DEFAULT_ROLE_MODULES[role] || [];
};

const hasModuleAccess = (role, module, roleModulesOverride = {}) => {
  if (!role) return false;
  if (module === 'help') return true;
  if (module === 'users' || module === 'settings') return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  const modules = getEffectiveModules(role, roleModulesOverride);
  return modules.includes('all') || modules.includes(module);
};

const MODULE_KEYS = MODULES.map((m) => m.key);

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_LABELS,
  MODULES,
  MODULE_KEYS,
  DEFAULT_ROLE_MODULES,
  CONFIGURABLE_ROLES,
  canAssignRole,
  getAssignableRoles,
  getEffectiveModules,
  hasModuleAccess,
};
