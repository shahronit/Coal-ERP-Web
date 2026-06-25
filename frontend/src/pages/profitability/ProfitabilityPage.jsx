import { useState } from 'react';
import { Box, Grid, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import FilterBar from '../../components/FilterBar';
import ChartCard from '../../components/ChartCard';
import SectionCard from '../../components/SectionCard';
import {
  useGetProfitTransactionsQuery,
  useGetProfitBatchesQuery,
  useGetProfitByProductQuery,
  useGetProfitByCustomerQuery,
} from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { BAR_RADIUS, useChartStyles } from '../../utils/chartTheme';

const money = (value) => formatCurrency(value);

function SimpleTable({ rows = [], columns = [] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>{columns.map(col => <TableCell key={col.key}>{col.label}</TableCell>)}</TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={row.id || row.saleId || index}>
            {columns.map(col => <TableCell key={col.key}>{col.render ? col.render(row) : row[col.key]}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ProfitabilityPage() {
  const chart = useChartStyles();
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const tx = useGetProfitTransactionsQuery(query);
  const batches = useGetProfitBatchesQuery(query);
  const byProduct = useGetProfitByProductQuery(query);
  const byCustomer = useGetProfitByCustomerQuery(query);

  const views = [
    {
      label: 'Transactions',
      rows: tx.data?.data || [],
      loading: tx.isLoading,
      columns: [
        { key: 'saleNumber', label: 'Sale' },
        { key: 'saleDate', label: 'Date', render: r => formatDate(r.saleDate) },
        { key: 'customer', label: 'Customer', render: r => r.customer?.name },
        { key: 'revenue', label: 'Revenue', render: r => money(r.revenue) },
        { key: 'cost', label: 'Cost', render: r => money(r.cost) },
        { key: 'profit', label: 'Profit', render: r => money(r.profit) },
        { key: 'marginPercent', label: 'Margin %', render: r => `${r.marginPercent}%` },
      ],
    },
    {
      label: 'FIFO Batches',
      rows: batches.data?.data || [],
      loading: batches.isLoading,
      columns: [
        { key: 'purchaseNumber', label: 'Purchase' },
        { key: 'product', label: 'Product', render: r => r.product?.name },
        { key: 'soldMeasure', label: 'Sold', render: r => r.soldMeasure },
        { key: 'remainingMeasure', label: 'Remaining', render: r => r.remainingMeasure },
        { key: 'realizedRevenue', label: 'Revenue', render: r => money(r.realizedRevenue) },
        { key: 'realizedProfit', label: 'Profit', render: r => money(r.realizedProfit) },
        { key: 'soldPercent', label: 'Sold %', render: r => `${r.soldPercent}%` },
      ],
    },
    {
      label: 'By Product',
      rows: byProduct.data?.data || [],
      loading: byProduct.isLoading,
      columns: [
        { key: 'product', label: 'Product', render: r => r.product?.name },
        { key: 'revenue', label: 'Revenue', render: r => money(r.revenue) },
        { key: 'cost', label: 'Cost', render: r => money(r.cost) },
        { key: 'profit', label: 'Profit', render: r => money(r.profit) },
        { key: 'marginPercent', label: 'Margin %', render: r => `${r.marginPercent}%` },
      ],
    },
    {
      label: 'By Customer',
      rows: byCustomer.data?.data || [],
      loading: byCustomer.isLoading,
      columns: [
        { key: 'customer', label: 'Customer', render: r => r.customer?.name },
        { key: 'sales', label: 'Sales' },
        { key: 'revenue', label: 'Revenue', render: r => money(r.revenue) },
        { key: 'profit', label: 'Profit', render: r => money(r.profit) },
        { key: 'marginPercent', label: 'Margin %', render: r => `${r.marginPercent}%` },
      ],
    },
  ];
  const current = views[tab];

  return (
    <Box>
      <Typography variant="h4" mb={1}>Profit & Loss Analytics</Typography>
      <Typography color="text.secondary" mb={3}>Track profit per sale, per FIFO purchase batch, product, and customer.</Typography>
      <FilterBar filters={filters} onChange={setFilters} onApply={() => setQuery(filters)} onReset={() => { setFilters({}); setQuery({}); }} />
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        {views.map(view => <Tab key={view.label} label={view.label} />)}
      </Tabs>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard title={`${current.label} Profit`} loading={current.loading}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={current.rows.slice(0, 8)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...chart.grid} />
                <XAxis dataKey={tab === 0 ? 'saleNumber' : tab === 1 ? 'purchaseNumber' : 'marginPercent'} {...chart.axis} tick={{ fill: chart.axis.tick.fill, fontSize: 11 }} />
                <YAxis tickFormatter={v => `₹${Math.round(v / 1000)}k`} {...chart.axis} />
                <Tooltip {...chart.tooltip} formatter={v => money(v)} />
                <Bar dataKey={tab === 1 ? 'realizedProfit' : 'profit'} fill="#16a34a" radius={BAR_RADIUS} maxBarSize={40} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard title={current.label} subtitle="Margin analytics from confirmed sales and FIFO allocations">
            <SimpleTable rows={current.rows} columns={current.columns} />
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
