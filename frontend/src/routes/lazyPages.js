import { lazy } from 'react';

/** Route path → dynamic import (for prefetch) */
export const routeLoaders = {
  '/dashboard': () => import('../pages/DashboardPage'),
  '/masters': () => import('../pages/masters/MasterDataPage'),
  '/purchases': () => import('../pages/purchases/PurchasesPage'),
  '/sales': () => import('../pages/sales/SalesPage'),
  '/inventory': () => import('../pages/inventory/InventoryPage'),
  '/batches': () => import('../pages/batches/BatchManagementPage'),
  '/payments': () => import('../pages/payments/PaymentsPage'),
  '/expenses': () => import('../pages/expenses/ExpensesPage'),
  '/assets': () => import('../pages/assets/AssetsPage'),
  '/investments': () => import('../pages/investments/InvestmentsPage'),
  '/documents': () => import('../pages/documents/DocumentsPage'),
  '/reports': () => import('../pages/reports/ReportsPage'),
  '/profit-loss': () => import('../pages/profit-loss/ProfitLossPage'),
  '/accounting/pl-statement': () => import('../pages/accounting/PLStatementPage'),
  '/accounting/aging': () => import('../pages/accounting/AgingPage'),
  '/accounting/day-book': () => import('../pages/accounting/DayBookPage'),
  '/accounting/gst-summary': () => import('../pages/accounting/GstSummaryPage'),
  '/crm/leads': () => import('../pages/crm/LeadsPage'),
  '/crm/activities': () => import('../pages/crm/ActivitiesPage'),
  '/audit': () => import('../pages/audit/AuditPage'),
  '/notifications': () => import('../pages/notifications/NotificationsPage'),
  '/users': () => import('../pages/users/UsersPage'),
  '/help': () => import('../pages/help/HelpCenterPage'),
  '/settings': () => import('../pages/settings/SettingsPage'),
  '/profile': () => import('../pages/account/AccountProfilePage'),
};

const prefetched = new Set();

export function resolveRouteLoader(path) {
  if (routeLoaders[path]) return { key: path, loader: routeLoaders[path] };
  const key = Object.keys(routeLoaders)
    .filter((k) => path.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return key ? { key, loader: routeLoaders[key] } : null;
}

/** Warm JS chunk before navigation (sidebar hover / click). */
export function prefetchRoute(path) {
  const resolved = resolveRouteLoader(path);
  if (!resolved || prefetched.has(resolved.key)) return;
  prefetched.add(resolved.key);
  resolved.loader().catch(() => prefetched.delete(resolved.key));
}

export const DashboardPage = lazy(routeLoaders['/dashboard']);
export const MasterDataPage = lazy(routeLoaders['/masters']);
export const PurchasesPage = lazy(routeLoaders['/purchases']);
export const PurchaseFormPage = lazy(() => import('../pages/purchases/PurchaseFormPage'));
export const SalesPage = lazy(routeLoaders['/sales']);
export const SaleFormPage = lazy(() => import('../pages/sales/SaleFormPage'));
export const InventoryPage = lazy(routeLoaders['/inventory']);
export const BatchManagementPage = lazy(routeLoaders['/batches']);
export const PaymentsPage = lazy(routeLoaders['/payments']);
export const ExpensesPage = lazy(routeLoaders['/expenses']);
export const AssetsPage = lazy(routeLoaders['/assets']);
export const InvestmentsPage = lazy(routeLoaders['/investments']);
export const DocumentsPage = lazy(routeLoaders['/documents']);
export const ReportsPage = lazy(routeLoaders['/reports']);
export const AuditPage = lazy(routeLoaders['/audit']);
export const NotificationsPage = lazy(routeLoaders['/notifications']);
export const UsersPage = lazy(routeLoaders['/users']);
export const HelpCenterPage = lazy(routeLoaders['/help']);
export const HelpTopicPage = lazy(() => import('../pages/help/HelpTopicPage'));
export const ProfitLossPage = lazy(routeLoaders['/profit-loss']);
export const PLStatementPage = lazy(routeLoaders['/accounting/pl-statement']);
export const AgingPage = lazy(routeLoaders['/accounting/aging']);
export const DayBookPage = lazy(routeLoaders['/accounting/day-book']);
export const GstSummaryPage = lazy(routeLoaders['/accounting/gst-summary']);
export const LeadsPage = lazy(routeLoaders['/crm/leads']);
export const ActivitiesPage = lazy(routeLoaders['/crm/activities']);
export const SettingsPage = lazy(routeLoaders['/settings']);
export const AccountProfilePage = lazy(routeLoaders['/profile']);
