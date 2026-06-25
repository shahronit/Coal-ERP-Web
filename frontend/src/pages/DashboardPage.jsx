import { Grid, Typography, Card, CardContent, Stack } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuickActionCard from '../components/QuickActionCard';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import SectionCard from '../components/SectionCard';
import {
  useGetSummaryQuery, useGetTrendsQuery, useGetTopCustomersQuery, useGetTopSuppliersQuery, useGetQualityStockQuery,
} from '../store/api/services';
import { formatCurrency } from '../utils/constants';
import { BAR_RADIUS, useChartStyles, CHART_SEMANTIC } from '../utils/chartTheme';
import { usePermissions } from '../hooks/usePermissions';
import { layout } from '../theme/tokens';

export default function DashboardPage() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const chart = useChartStyles();
  const { canReadModule } = usePermissions();

  const access = {
    purchases: canReadModule('purchases'),
    sales: canReadModule('sales'),
    inventory: canReadModule('inventory'),
    payments: canReadModule('payments'),
    investments: canReadModule('investments'),
    reports: canReadModule('reports'),
    profitLoss: canReadModule('profit-loss'),
    masters: canReadModule('masters'),
  };

  const showTrends = access.sales || access.purchases || access.profitLoss;
  const showAnyKpi = access.inventory || access.sales || access.purchases || access.profitLoss || access.payments || access.investments;

  const { data: summary, isLoading: kpiLoading } = useGetSummaryQuery(undefined, { skip: !showAnyKpi });
  const { data: trends, isLoading: trendsLoading } = useGetTrendsQuery(undefined, { skip: !showTrends });
  const { data: topCustomers } = useGetTopCustomersQuery(undefined, { skip: !access.sales });
  const { data: topSuppliers } = useGetTopSuppliersQuery(undefined, { skip: !access.purchases });
  const { data: qualityStock } = useGetQualityStockQuery(undefined, { skip: !access.inventory });

  const k = summary?.data || {};

  const quickActions = [
    access.purchases && {
      title: t('dashboard.quickPurchase'),
      body: t('dashboard.quickPurchaseBody'),
      icon: <ShoppingCartIcon />,
      onClick: () => navigate('/purchases'),
      className: 'stagger-1',
    },
    access.profitLoss && {
      title: 'Profit & Loss',
      body: 'Review per-sale and batch margins',
      icon: <TrendingUpIcon />,
      color: 'success.main',
      onClick: () => navigate('/profit-loss'),
      className: 'stagger-2',
    },
    access.reports && {
      title: 'Accounting',
      body: 'P&L, aging, day book and GST',
      icon: <AccountBalanceIcon />,
      color: 'warning.main',
      onClick: () => navigate('/accounting/pl-statement'),
      className: 'stagger-3',
    },
    access.reports && {
      title: t('dashboard.quickReports'),
      body: t('dashboard.quickReportsBody'),
      icon: <ReceiptIcon />,
      color: 'success.main',
      onClick: () => navigate('/reports'),
      className: 'stagger-4',
    },
  ].filter(Boolean);

  const kpiCards = [
    access.inventory && {
      title: 'Current Stock (MT)',
      value: `${(k.currentStockMT || 0).toFixed(2)} MT`,
      icon: <InventoryIcon />,
      color: 'info.main',
      className: 'stagger-1',
    },
    access.sales && {
      title: "Today's Sales",
      value: formatCurrency(k.todaySales),
      icon: <PointOfSaleIcon />,
      color: 'success.main',
      className: 'stagger-2',
    },
    access.purchases && {
      title: "Today's Purchases",
      value: formatCurrency(k.todayPurchases),
      icon: <ShoppingCartIcon />,
      color: 'primary.main',
      className: 'stagger-3',
    },
    access.profitLoss && {
      title: 'Net Profit',
      value: formatCurrency(k.netProfit),
      icon: <TrendingUpIcon />,
      color: 'success.dark',
      className: 'stagger-4',
    },
    access.payments && {
      title: 'Receivables',
      value: formatCurrency(k.outstandingReceivables),
      icon: <PaymentIcon />,
      color: 'warning.main',
      className: 'stagger-5',
    },
    access.payments && {
      title: 'Payables',
      value: formatCurrency(k.outstandingPayables),
      icon: <PaymentIcon />,
      color: 'error.main',
      className: 'stagger-6',
    },
    access.investments && {
      title: 'Investments',
      value: formatCurrency(k.partnerInvestments),
      icon: <AccountBalanceIcon />,
      color: 'secondary.main',
      className: 'stagger-7',
    },
  ].filter(Boolean);

  /*
  const heroActions = [
    access.profitLoss && (
      <Button key="pl" variant="contained" color="secondary" onClick={() => navigate('/profit-loss')}>
        Profit & Loss
      </Button>
    ),
    access.masters && (
      <Button
        key="masters"
        variant="outlined"
        sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
        onClick={() => navigate('/masters/coal-qualities')}
      >
        Setup Masters
      </Button>
    ),
  ].filter(Boolean);
  */

  return (
    <Stack spacing={layout.pageGap} data-tour="dashboard-summary">
      {/*
      <Card
        className="animate-in hero-glow"
        sx={{
          background: brandGradient(theme.palette.mode),
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: brandGradientGlow(theme.palette.mode),
        }}
        data-tour="dashboard-summary"
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.2), transparent 42%), radial-gradient(circle at 10% 80%, rgba(6,182,212,0.15), transparent 40%)',
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ py: 3, position: 'relative' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h4" fontWeight={900}>{t('dashboard.welcome', { name: user?.name || 'User' })}</Typography>
              <Typography sx={{ opacity: 0.85, maxWidth: 560 }}>
                Your coal trading command center — stock, purchases, sales, profit and outstanding balances at a glance.
              </Typography>
            </Stack>
            {heroActions.length > 0 && (
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {heroActions}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
      */}

      {quickActions.length > 0 && (
        <Grid container spacing={layout.pageGap} data-tour="quick-actions">
          {quickActions.map((item) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.title}>
              <QuickActionCard {...item} />
            </Grid>
          ))}
        </Grid>
      )}

      {kpiCards.length > 0 && (
        <Grid container spacing={layout.pageGap}>
          {kpiCards.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.title}>
              <StatCard {...item} loading={kpiLoading} />
            </Grid>
          ))}
        </Grid>
      )}

      {(showTrends || access.inventory || access.sales || access.purchases) && (
        <Grid container spacing={3} className="animate-in stagger-3">
          {showTrends && (
            <Grid size={{ xs: 12, md: 8 }}>
              <ChartCard title="Sales, Purchases & Profit Trend" subtitle="Last 12 months" loading={trendsLoading}>
                <ResponsiveContainer width="100%" height={330}>
                  <AreaChart data={trends?.data || []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_SEMANTIC.success} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_SEMANTIC.success} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPurch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_SEMANTIC.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_SEMANTIC.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_SEMANTIC.secondary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_SEMANTIC.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chart.grid} />
                    <XAxis dataKey="label" {...chart.axis} />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} {...chart.axis} />
                    <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                    <Legend {...chart.legend} />
                    {access.sales && <Area type="monotone" dataKey="sales" stroke={CHART_SEMANTIC.success} strokeWidth={2} fill="url(#gSales)" name="Sales" />}
                    {access.purchases && <Area type="monotone" dataKey="purchases" stroke={CHART_SEMANTIC.primary} strokeWidth={2} fill="url(#gPurch)" name="Purchases" />}
                    {access.profitLoss && <Area type="monotone" dataKey="profit" stroke={CHART_SEMANTIC.secondary} strokeWidth={2} fill="url(#gProfit)" name="Profit" />}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          )}
          {access.inventory && (
            <Grid size={{ xs: 12, md: showTrends ? 4 : 12 }}>
              <ChartCard title="Quality-wise Stock" subtitle="Available MT by coal quality">
                <ResponsiveContainer width="100%" height={330}>
                  <PieChart>
                    <Pie data={qualityStock?.data || []} dataKey="weightMT" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="none">
                      {(qualityStock?.data || []).map((_, index) => <Cell key={index} fill={chart.palette[index % chart.palette.length]} />)}
                    </Pie>
                    <Tooltip {...chart.tooltip} />
                    <Legend {...chart.legend} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          )}
          {showTrends && (
            <Grid size={{ xs: 12, md: 4 }}>
              <ChartCard title="Revenue vs Cost" subtitle="Monthly analytics">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trends?.data || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...chart.grid} />
                    <XAxis dataKey="label" {...chart.axis} />
                    <YAxis hide />
                    <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                    <Legend {...chart.legend} />
                    {access.sales && <Bar dataKey="sales" fill={CHART_SEMANTIC.primary} radius={BAR_RADIUS} maxBarSize={28} name="Revenue" />}
                    {access.purchases && <Bar dataKey="cost" fill={CHART_SEMANTIC.secondary} radius={BAR_RADIUS} maxBarSize={28} name="Cost" />}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          )}
          {access.sales && (
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionCard title={t('dashboard.topCustomers')}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(topCustomers?.data || []).slice(0, 5)} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={84} {...chart.axis} tick={{ fill: chart.axis.tick.fill, fontSize: 11 }} />
                    <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total" fill={CHART_SEMANTIC.primary} radius={[0, 6, 6, 0]} maxBarSize={22} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </Grid>
          )}
          {access.inventory && (
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionCard title="Top Coal Quality Value">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(qualityStock?.data || []).slice(0, 5)} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={92} {...chart.axis} tick={{ fill: chart.axis.tick.fill, fontSize: 11 }} />
                    <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="value" fill={CHART_SEMANTIC.success} radius={[0, 6, 6, 0]} maxBarSize={22} name="Value" />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </Grid>
          )}
          {access.purchases && (
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionCard title={t('dashboard.topSuppliers')}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(topSuppliers?.data || []).slice(0, 5)} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={84} {...chart.axis} tick={{ fill: chart.axis.tick.fill, fontSize: 11 }} />
                    <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total" fill={CHART_SEMANTIC.info} radius={[0, 6, 6, 0]} maxBarSize={22} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </Grid>
          )}
        </Grid>
      )}

      {quickActions.length === 0 && kpiCards.length === 0 && !showTrends && !access.inventory && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No dashboard widgets are available for your role. Contact an administrator if you need access to modules.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
