import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../../components/ChartCard';
import SectionCard from '../../components/SectionCard';
import PageHeader from '../../components/PageHeader';
import PageLayout from '../../components/PageLayout';
import { useGetAgingQuery } from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { useChartStyles, BAR_RADIUS } from '../../utils/chartTheme';
import { space } from '../../theme/tokens';

export default function AgingPage() {
  const chart = useChartStyles();
  const { data, isLoading } = useGetAgingQuery();
  const aging = data?.data || { buckets: { receivables: {}, payables: {} }, detail: { receivables: [], payables: [] } };
  const chartRows = ['0-30', '31-60', '61-90', '90+'].map((bucket) => ({
    bucket,
    receivables: aging.buckets.receivables[bucket] || 0,
    payables: aging.buckets.payables[bucket] || 0,
  }));

  return (
    <PageLayout>
      <PageHeader
        title="Receivables & Payables Aging"
        subtitle="Bucket outstanding customer and supplier balances by due date."
      />
      <Grid container spacing={space.md}>
        <Grid size={12}>
          <ChartCard title="Aging Buckets" loading={isLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...chart.grid} />
                <XAxis dataKey="bucket" {...chart.axis} />
                <YAxis tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} {...chart.axis} />
                <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                <Legend {...chart.legend} />
                <Bar dataKey="receivables" fill="#16a34a" radius={BAR_RADIUS} maxBarSize={48} name="Receivables" />
                <Bar dataKey="payables" fill="#f59e0b" radius={BAR_RADIUS} maxBarSize={48} name="Payables" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        {['receivables', 'payables'].map((type) => (
          <Grid size={{ xs: 12, md: 6 }} key={type}>
            <SectionCard title={type === 'receivables' ? 'Receivables' : 'Payables'} noDivider>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Party</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell>Bucket</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(aging.detail[type] || []).map((row) => (
                    <TableRow key={`${type}-${row.id}`} hover>
                      <TableCell>{row.party}</TableCell>
                      <TableCell>{formatDate(row.dueDate)}</TableCell>
                      <TableCell>{row.bucket}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </Grid>
        ))}
      </Grid>
    </PageLayout>
  );
}
