import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LABELS = {
  dashboard: 'dashboard',
  masters: 'masterData',
  purchases: 'purchases',
  sales: 'sales',
  inventory: 'inventory',
  payments: 'payments',
  investments: 'investments',
  expenses: 'expenses',
  assets: 'assets',
  documents: 'documents',
  reports: 'reports',
  'profit-loss': 'profitLoss',
  profitability: 'profitLoss',
  accounting: 'plStatement',
  crm: 'leads',
  'pl-statement': 'plStatement',
  aging: 'aging',
  'day-book': 'dayBook',
  'gst-summary': 'gstSummary',
  'tax-configurations': 'taxConfigurations',
  'coal-qualities': 'coalQualities',
  leads: 'leads',
  activities: 'activities',
  audit: 'audit',
  notifications: 'notifications',
  users: 'users',
  help: 'help',
};

export default function AppBreadcrumbs({ sx = {} }) {
  const { t } = useTranslation('nav');
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  return (
    <Breadcrumbs sx={{ mb: 2, ...sx }}>
      <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">{t('home')}</Link>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        const label = LABELS[part] ? t(`items.${LABELS[part]}.label`) : part.replace(/-/g, ' ');
        return isLast ? (
          <Typography key={path} color="text.primary" textTransform="capitalize">{label}</Typography>
        ) : (
          <Link key={path} component={RouterLink} to={path} underline="hover" color="inherit" textTransform="capitalize">
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
