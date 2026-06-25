import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import store from './store';
import { getTheme } from './theme/theme';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AppRoute from './components/AppRoute';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import SetupWizardPage from './pages/setup/SetupWizardPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import { selectCurrentUser } from './store/slices/authSlice';
import { useGetSetupStatusQuery } from './store/api/services';
import {
  DashboardPage, MasterDataPage, PurchasesPage, PurchaseFormPage,
  SalesPage, SaleFormPage, InventoryPage, BatchManagementPage,
  PaymentsPage, ExpensesPage, AssetsPage, InvestmentsPage,
  DocumentsPage, ReportsPage, AuditPage, NotificationsPage,
  UsersPage, HelpCenterPage, HelpTopicPage, ProfitLossPage,
  PLStatementPage, AgingPage, DayBookPage, GstSummaryPage,
  LeadsPage, ActivitiesPage, SettingsPage, AccountProfilePage,
} from './routes/lazyPages';

function RootRedirect() {
  const user = useSelector(selectCurrentUser);
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function SetupGuard({ children }) {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isError } = useGetSetupStatusQuery(undefined, {
    skip: !user,
  });
  if (!user) return children;
  if (isLoading && !data) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={2}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError || !data?.data?.setupCompleted) return <Navigate to="/setup" replace />;
  return children;
}

function ThemedApp() {
  const mode = useSelector(s => s.theme.mode);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/setup" element={user ? <SetupWizardPage /> : <Navigate to="/login" />} />
          <Route element={<ProtectedRoute><SetupGuard><AppLayout /></SetupGuard></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<AppRoute module="dashboard"><DashboardPage /></AppRoute>} />
            <Route path="masters/:type" element={<AppRoute module="masters"><MasterDataPage /></AppRoute>} />
            <Route path="purchases" element={<AppRoute module="purchases"><PurchasesPage /></AppRoute>} />
            <Route path="purchases/:id" element={<AppRoute module="purchases"><PurchaseFormPage /></AppRoute>} />
            <Route path="sales" element={<AppRoute module="sales"><SalesPage /></AppRoute>} />
            <Route path="sales/:id" element={<AppRoute module="sales"><SaleFormPage /></AppRoute>} />
            <Route path="inventory" element={<AppRoute module="inventory"><InventoryPage /></AppRoute>} />
            <Route path="batches" element={<AppRoute module="batches"><BatchManagementPage /></AppRoute>} />
            <Route path="payments" element={<AppRoute module="payments"><PaymentsPage /></AppRoute>} />
            <Route path="expenses" element={<AppRoute module="expenses"><ExpensesPage /></AppRoute>} />
            <Route path="assets" element={<AppRoute module="assets"><AssetsPage /></AppRoute>} />
            <Route path="investments" element={<AppRoute module="investments"><InvestmentsPage /></AppRoute>} />
            <Route path="documents" element={<AppRoute module="documents"><DocumentsPage /></AppRoute>} />
            <Route path="reports" element={<AppRoute module="reports"><ReportsPage /></AppRoute>} />
            <Route path="profit-loss" element={<AppRoute module="profit-loss"><ProfitLossPage /></AppRoute>} />
            <Route path="profitability" element={<Navigate to="/profit-loss" replace />} />
            <Route path="accounting/pl-statement" element={<AppRoute module="reports"><PLStatementPage /></AppRoute>} />
            <Route path="accounting/aging" element={<AppRoute module="reports"><AgingPage /></AppRoute>} />
            <Route path="accounting/day-book" element={<AppRoute module="reports"><DayBookPage /></AppRoute>} />
            <Route path="accounting/gst-summary" element={<AppRoute module="reports"><GstSummaryPage /></AppRoute>} />
            <Route path="crm/leads" element={<AppRoute module="crm"><LeadsPage /></AppRoute>} />
            <Route path="crm/activities" element={<AppRoute module="crm"><ActivitiesPage /></AppRoute>} />
            <Route path="audit" element={<AppRoute module="audit"><AuditPage /></AppRoute>} />
            <Route path="notifications" element={<AppRoute module="notifications"><NotificationsPage /></AppRoute>} />
            <Route path="users" element={<AppRoute module="users"><UsersPage /></AppRoute>} />
            <Route path="help" element={<HelpCenterPage />} />
            <Route path="help/:topicId" element={<HelpTopicPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="profile" element={<AccountProfilePage />} />
            <Route path="settings" element={<AppRoute module="settings"><SettingsPage /></AppRoute>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <HashRouter>
        <ThemedApp />
      </HashRouter>
    </Provider>
  );
}
