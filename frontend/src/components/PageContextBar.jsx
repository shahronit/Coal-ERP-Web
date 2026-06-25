import { Box, Button, IconButton, Stack, Typography, alpha, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppBreadcrumbs from './AppBreadcrumbs';
import GlobalSearch from './GlobalSearch';
import HeaderNotificationButton from './header/HeaderNotificationButton';
import HeaderUserMenu from './header/HeaderUserMenu';
import { floatingGlassShell, headerShellPaddingY } from './header/headerGlass';
import { glassSurface } from '../theme/colors';
import { usePageMetaRegistry } from '../context/PageMetaContext';
import { space } from '../theme/tokens';

const PAGE_TITLES = {
  dashboard: 'items.dashboard.label',
  purchases: 'items.purchases.label',
  sales: 'items.sales.label',
  inventory: 'items.inventory.label',
  batches: 'items.batches.label',
  payments: 'items.payments.label',
  'profit-loss': 'items.profitLoss.label',
  investments: 'items.investments.label',
  expenses: 'items.expenses.label',
  assets: 'items.assets.label',
  documents: 'items.documents.label',
  reports: 'items.reports.label',
  audit: 'items.audit.label',
  notifications: 'items.notifications.label',
  users: 'items.users.label',
  settings: 'items.settings.label',
  help: 'items.help.label',
  profile: 'items.profile.label',
  masters: 'items.masterData.label',
  crm: 'items.leads.label',
  accounting: 'items.plStatement.label',
};

export default function PageContextBar({ onMenuClick, showMenu = false, unreadCount = 0 }) {
  const theme = useTheme();
  const location = useLocation();
  const { t } = useTranslation('nav');
  const { meta } = usePageMetaRegistry() || {};
  const segment = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const titleKey = PAGE_TITLES[segment];
  const glass = glassSurface(theme.palette.mode);
  const isLight = theme.palette.mode === 'light';
  const searchShell = floatingGlassShell(theme.palette.mode);

  const navLabel = titleKey ? t(titleKey) : '';
  const navSubtitleKey = titleKey ? titleKey.replace('.label', '.subtitle') : '';
  const fallbackSubtitle = navSubtitleKey ? t(navSubtitleKey) : '';

  const pageTitle = meta?.title || navLabel;
  const pageSubtitle = meta?.subtitle ?? (meta ? '' : fallbackSubtitle);
  const mergedHeading = pageSubtitle ? `${pageTitle} - ${pageSubtitle}` : pageTitle;

  const action = meta?.action ?? (
    meta?.actionLabel && meta?.onAction ? (
      <Button
        variant="contained"
        startIcon={meta.actionIcon}
        onClick={meta.onAction}
        sx={{ flexShrink: 0 }}
      >
        {meta.actionLabel}
      </Button>
    ) : null
  );

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack
        direction="row"
        alignItems="stretch"
        spacing={1.25}
        sx={{ mb: 1.25 }}
        useFlexGap
      >
        {showMenu && (
          <IconButton
            onClick={onMenuClick}
            sx={{
              ...searchShell,
              alignSelf: 'stretch',
              aspectRatio: '1',
              width: 'auto',
              flexShrink: 0,
              borderRadius: 3,
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box
          data-tour="global-search"
          sx={{
            ...searchShell,
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'stretch',
            px: { xs: 0.75, md: 1 },
            py: headerShellPaddingY,
            bgcolor: isLight ? alpha('#fff', 0.72) : alpha('#fff', 0.06),
          }}
        >
          <GlobalSearch variant="header" fullWidth />
        </Box>

        <HeaderNotificationButton unreadCount={unreadCount} />
        <HeaderUserMenu />
      </Stack>

      <Box
        className="glass-panel animate-in"
        sx={{
          p: { xs: 1.75, md: 2.25 },
          borderRadius: 3.5,
          width: '100%',
          ...glass,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            width: '100%',
            columnGap: space.md,
            rowGap: 1,
            alignItems: 'center',
            gridTemplateColumns: action
              ? { xs: '1fr', sm: 'minmax(0, 1fr) auto' }
              : 'minmax(0, 1fr)',
            gridTemplateAreas: action
              ? {
                  xs: '"title" "action" "crumbs"',
                  sm: '"title action" "crumbs crumbs"',
                }
              : '"title" "crumbs"',
          }}
        >
          {mergedHeading && (
            <Typography
              component="h1"
              variant="subtitle1"
              fontWeight={700}
              lineHeight={1.45}
              sx={{
                gridArea: 'title',
                minWidth: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {mergedHeading}
            </Typography>
          )}
          {action && (
            <Box
              sx={{
                gridArea: 'action',
                justifySelf: { xs: 'stretch', sm: 'end' },
                alignSelf: 'center',
                width: { xs: '100%', sm: 'auto' },
                '& .MuiButton-root': {
                  width: { xs: '100%', sm: 'auto' },
                  whiteSpace: 'nowrap',
                },
              }}
            >
              {action}
            </Box>
          )}
          <Box sx={{ gridArea: 'crumbs', minWidth: 0 }}>
            <AppBreadcrumbs sx={{ mt: 0, mb: 0 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
