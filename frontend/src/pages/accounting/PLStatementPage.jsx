import { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import FilterBar from '../../components/FilterBar';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';
import PageHeader from '../../components/PageHeader';
import PageLayout from '../../components/PageLayout';
import { useGetPLStatementQuery } from '../../store/api/services';
import { formatCurrency } from '../../utils/constants';
import { space } from '../../theme/tokens';

export default function PLStatementPage() {
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data } = useGetPLStatementQuery(query);
  const pl = data?.data || {};
  const rows = [
    ['Direct Sales Revenue', pl.directSalesRevenue],
    ['Indirect Sales Revenue', pl.indirectSalesRevenue],
    ['Total Revenue', pl.revenue],
    ['COGS', -pl.cogs],
    ['Gross Profit', pl.grossProfit],
    ['Direct Expenses', -pl.directExpenses],
    ['Operating Profit', pl.operatingProfit],
    ['Indirect Expenses', -pl.indirectExpenses],
    ['Depreciation', -pl.depreciation],
    ['Net Profit', pl.netProfit],
  ];

  return (
    <PageLayout>
      <PageHeader
        title="P&L Statement"
        subtitle="Tally-style period profitability with revenue, COGS, expenses, and depreciation."
      />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={() => setQuery(filters)}
        onReset={() => { setFilters({}); setQuery({}); }}
      />
      <Grid container spacing={space.md}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Gross Profit" value={formatCurrency(pl.grossProfit)} delta={pl.grossMarginPercent} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Net Profit" value={formatCurrency(pl.netProfit)} delta={pl.netMarginPercent} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Expenses" value={formatCurrency((pl.directExpenses || 0) + (pl.indirectExpenses || 0))} color="warning.main" />
        </Grid>
      </Grid>
      <SectionCard title="Statement">
        {rows.map(([label, amount]) => (
          <Box
            key={label}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            py={1.25}
            borderBottom="1px solid"
            borderColor="divider"
            gap={space.md}
          >
            <Typography
              variant="body2"
              fontWeight={label.includes('Profit') || label.includes('Revenue') ? 800 : 600}
            >
              {label}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={label.includes('Profit') || label.includes('Revenue') ? 800 : 600}
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(amount)}
            </Typography>
          </Box>
        ))}
      </SectionCard>
    </PageLayout>
  );
}
