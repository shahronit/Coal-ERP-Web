import { useState, useEffect, useTransition, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Drawer, useMediaQuery, useTheme, alpha,
} from '@mui/material';
import { selectCurrentUser } from '../store/slices/authSlice';
import { buildCanAccess } from '../utils/roles';
import SidebarBrandLogo from './SidebarBrandLogo';
import SidebarNavigation from './SidebarNavigation';
import { useUnreadCountQuery, useGetAppSettingsQuery } from '../store/api/services';
import PageLayout from './PageLayout';
import PageContextBar from './PageContextBar';
import { PageMetaProvider } from '../context/PageMetaContext';
import SidebarUserPanel from './SidebarUserPanel';
import FloatingHelpButton from './FloatingHelpButton';
import PageTransition from './PageTransition';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { meshBackground } from '../theme/colors';
import { layout, blur } from '../theme/tokens';
import { prefetchRoute } from '../routes/lazyPages';

const OnboardingTour = lazy(() => import('./OnboardingTour'));

const DRAWER_WIDTH = layout.drawerWidth;
const DRAWER_COLLAPSED = layout.drawerCollapsed;

const HELP_TOPICS_BY_PATH = [
  ['/dashboard', 'dashboard'],
  ['/masters', 'master-data'],
  ['/purchases', 'purchases'],
  ['/sales', 'sales'],
  ['/inventory', 'inventory'],
  ['/payments', 'payments'],
  ['/documents', 'documents'],
  ['/reports', 'reports'],
  ['/profitability', 'profit-loss'],
  ['/accounting/pl-statement', 'pl-statement'],
  ['/accounting/aging', 'aging'],
  ['/accounting/day-book', 'day-book'],
  ['/accounting/gst-summary', 'gst-summary'],
  ['/crm/leads', 'leads-pipeline'],
  ['/crm/activities', 'activities'],
];

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('tradecrm_sidebar_collapsed') === '1');
  const [openGroups, setOpenGroups] = useState({ home: true, operations: true, finance: true, masters: false, crm: false, system: true });
  const [pendingPath, setPendingPath] = useState(null);
  const [, startNavTransition] = useTransition();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const { data: unreadData } = useUnreadCountQuery(undefined, { pollingInterval: 120000 });
  const { data: appSettings } = useGetAppSettingsQuery(undefined, { pollingInterval: 60000 });
  const isLight = theme.palette.mode === 'light';

  const settings = appSettings?.data || {};
  useDocumentTitle(settings.appName);
  const canAccessFn = useMemo(
    () => buildCanAccess(settings.roleModules, settings.crmEnabled !== false),
    [settings.roleModules, settings.crmEnabled]
  );

  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const canShow = useCallback((item, role) => {
    if (item.always) return true;
    if (item.roles && !item.roles.includes(role)) return false;
    return canAccessFn(role, item.module);
  }, [canAccessFn]);

  const canShowGroup = useCallback((group) => {
    if (group.settingFlag && !settings[group.settingFlag]) return false;
    return group.items.some((item) => canShow(item, user?.role));
  }, [canShow, settings, user?.role]);

  const helpTopic = HELP_TOPICS_BY_PATH.find(([path]) => location.pathname.startsWith(path))?.[1];

  useEffect(() => {
    prefetchRoute('/dashboard');
  }, []);

  useEffect(() => {
    if (pendingPath && location.pathname.startsWith(pendingPath)) {
      setPendingPath(null);
    }
  }, [location.pathname, pendingPath]);

  const handleNavClick = useCallback((path) => {
    if (location.pathname.startsWith(path)) {
      if (isMobile) setMobileOpen(false);
      return;
    }
    prefetchRoute(path);
    setPendingPath(path);
    startNavTransition(() => {
      navigate(path);
      if (isMobile) setMobileOpen(false);
    });
  }, [isMobile, location.pathname, navigate, startNavTransition]);

  const handleToggleGroup = useCallback((key) => {
    setOpenGroups((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tradecrm_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: theme.transitions.create('width', { duration: theme.transitions.duration.standard }),
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: isLight ? alpha(theme.palette.primary.main, 0.08) : 'rgba(255,255,255,0.06)',
            background: isLight ? alpha('#FFFFFF', 0.78) : alpha('#121829', 0.88),
            backdropFilter: `blur(${blur.xl}) saturate(180%)`,
            WebkitBackdropFilter: `blur(${blur.xl}) saturate(180%)`,
            transition: theme.transitions.create('width', { duration: theme.transitions.duration.standard }),
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SidebarBrandLogo
            collapsed={collapsed && !isMobile}
            appName={settings.appName}
            companyName={settings.companyName}
            companyLogo={settings.companyLogo}
          />

          <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.25, pb: 1.25 }} data-tour="main-navigation">
            <SidebarNavigation
              collapsed={collapsed && !isMobile}
              isMobile={isMobile}
              isLight={isLight}
              pathname={location.pathname}
              pendingPath={pendingPath}
              openGroups={openGroups}
              onToggleGroup={handleToggleGroup}
              onNavClick={handleNavClick}
              userRole={user?.role}
              canShow={canShow}
              canShowGroup={canShowGroup}
            />
          </Box>

          <SidebarUserPanel
            collapsed={collapsed && !isMobile}
            onToggleCollapse={isMobile ? undefined : toggleCollapse}
          />
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: meshBackground(theme.palette.mode),
        }}
      >
        <Box sx={{ flex: 1, p: { xs: 2, md: layout.pageGap }, maxWidth: layout.maxContentWidth, width: '100%', mx: 'auto' }}>
          <PageMetaProvider>
            <PageContextBar
              showMenu={isMobile}
              onMenuClick={() => setMobileOpen(true)}
              unreadCount={unreadData?.data?.count || 0}
            />
            <PageLayout>
              <PageTransition pendingPath={pendingPath} />
            </PageLayout>
          </PageMetaProvider>
          <FloatingHelpButton topicId={helpTopic} />
          {location.pathname.startsWith('/dashboard') && (
            <Suspense fallback={null}>
              <OnboardingTour />
            </Suspense>
          )}
        </Box>
      </Box>
    </Box>
  );
}
