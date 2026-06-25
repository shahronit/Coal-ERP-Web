import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentIcon from '@mui/icons-material/Payment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import HelpIcon from '@mui/icons-material/Help';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LayersIcon from '@mui/icons-material/Layers';

export const NAV_GROUPS = [
  {
    key: 'home',
    items: [
      { key: 'dashboard', path: '/dashboard', icon: <DashboardIcon />, module: 'dashboard' },
    ],
  },
  {
    key: 'operations',
    items: [
      { key: 'purchases', path: '/purchases', icon: <ShoppingCartIcon />, module: 'purchases' },
      { key: 'sales', path: '/sales', icon: <PointOfSaleIcon />, module: 'sales' },
      { key: 'inventory', path: '/inventory', icon: <InventoryIcon />, module: 'inventory' },
      { key: 'gstRates', path: '/masters/tax-configurations', icon: <ReceiptIcon />, module: 'masters' },
      { key: 'batches', path: '/batches', icon: <LayersIcon />, module: 'batches' },
      { key: 'payments', path: '/payments', icon: <PaymentIcon />, module: 'payments' },
    ],
  },
  {
    key: 'finance',
    items: [
      { key: 'profitLoss', path: '/profit-loss', icon: <LeaderboardIcon />, module: 'profit-loss' },
      { key: 'plStatement', path: '/accounting/pl-statement', icon: <AccountBalanceIcon />, module: 'reports' },
      { key: 'aging', path: '/accounting/aging', icon: <PaymentIcon />, module: 'reports' },
      { key: 'dayBook', path: '/accounting/day-book', icon: <ReceiptIcon />, module: 'reports' },
      { key: 'gstSummary', path: '/accounting/gst-summary', icon: <AssessmentIcon />, module: 'reports' },
      { key: 'investments', path: '/investments', icon: <TrendingUpIcon />, module: 'investments' },
      { key: 'expenses', path: '/expenses', icon: <ReceiptIcon />, module: 'expenses' },
      { key: 'assets', path: '/assets', icon: <BusinessIcon />, module: 'assets' },
      { key: 'reports', path: '/reports', icon: <AssessmentIcon />, module: 'reports' },
    ],
  },
  {
    key: 'masters',
    items: [
      { key: 'partners', path: '/masters/partners', icon: <PeopleIcon />, module: 'masters' },
      { key: 'suppliers', path: '/masters/suppliers', icon: <BusinessIcon />, module: 'masters' },
      { key: 'customers', path: '/masters/customers', icon: <PeopleIcon />, module: 'masters' },
      { key: 'coalQualities', path: '/masters/coal-qualities', icon: <CategoryIcon />, module: 'masters' },
      { key: 'purchaseBatches', path: '/masters/purchase-batches', icon: <LayersIcon />, module: 'masters' },
      { key: 'salesBatches', path: '/masters/sales-batches', icon: <LayersIcon />, module: 'masters' },
      { key: 'locations', path: '/masters/locations', icon: <SettingsIcon />, module: 'masters' },
      { key: 'expenseTypes', path: '/masters/expense-types', icon: <ReceiptIcon />, module: 'masters' },
      { key: 'incomeTypes', path: '/masters/income-types', icon: <ReceiptIcon />, module: 'masters' },
      { key: 'assetTypes', path: '/masters/asset-types', icon: <BusinessIcon />, module: 'masters' },
      { key: 'taxConfigurations', path: '/masters/tax-configurations', icon: <ReceiptIcon />, module: 'masters' },
    ],
  },
  {
    key: 'crm',
    settingFlag: 'crmEnabled',
    items: [
      { key: 'leads', path: '/crm/leads', icon: <AssignmentIcon />, module: 'crm' },
      { key: 'activities', path: '/crm/activities', icon: <EventNoteIcon />, module: 'crm' },
    ],
  },
  {
    key: 'system',
    items: [
      { key: 'documents', path: '/documents', icon: <DescriptionIcon />, module: 'documents' },
      { key: 'notifications', path: '/notifications', icon: <NotificationsIcon />, module: 'notifications' },
      { key: 'audit', path: '/audit', icon: <HistoryIcon />, module: 'audit' },
      { key: 'settings', path: '/settings', icon: <SettingsIcon />, module: 'settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { key: 'users', path: '/users', icon: <PeopleIcon />, module: 'users', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { key: 'help', path: '/help', icon: <HelpIcon />, module: 'help', always: true },
    ],
  },
];
