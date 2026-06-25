import { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FilterBar from '../../components/FilterBar';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';
import PageHeader from '../../components/PageHeader';
import PageLayout from '../../components/PageLayout';
import { useGetGstSummaryQuery } from '../../store/api/services';
import { formatCurrency } from '../../utils/constants';
import { space } from '../../theme/tokens';

export default function GstSummaryPage() {
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data } = useGetGstSummaryQuery(query);
  const gst = data?.data || {};

  return (
    <PageLayout>
      <PageHeader
        title="GST Summary"
        subtitle="Compare output GST from sales with input GST from purchases."
      />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={() => setQuery(filters)}
        onReset={() => { setFilters({}); setQuery({}); }}
      />
      <Grid container spacing={space.md}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Output GST" value={formatCurrency(gst.outputGst)} icon={<AccountBalanceIcon />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Input GST" value={formatCurrency(gst.inputGst)} icon={<AccountBalanceIcon />} color="info.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="GST Payable"
            value={formatCurrency(gst.payable)}
            icon={<AccountBalanceIcon />}
            color={(gst.payable || 0) >= 0 ? 'warning.main' : 'success.main'}
          />
        </Grid>
      </Grid>
      <SectionCard title="Interpretation">
        <Typography variant="body2" color="text.secondary">
          Positive payable means output GST is higher than input credit. Negative payable means input credit exceeds output GST for the selected period.
        </Typography>
      </SectionCard>
    </PageLayout>
  );
}
