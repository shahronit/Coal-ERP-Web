import { Grid } from '@mui/material';
import ListToolbar from '../../../components/ListToolbar';
import SectionCard from '../../../components/SectionCard';
import ReportTypeCard from './ReportTypeCard';
import { useTranslation } from 'react-i18next';

export default function StandardReportsTab({
  standardFilters,
  onFiltersChange,
  onApply,
  onReset,
  suppliers,
  customers,
  standardReports,
  onDownload,
}) {
  const { t } = useTranslation('pages');

  return (
    <>
      <SectionCard title={t('reports.filtersTitle')} sx={{ mb: 3 }}>
        <ListToolbar
          filters={standardFilters}
          onChange={onFiltersChange}
          onApply={onApply}
          onReset={onReset}
          selects={[
            {
              key: 'supplierId',
              label: 'Supplier',
              options: suppliers.map((s) => ({ value: s.id, label: s.name })),
            },
            {
              key: 'customerId',
              label: 'Customer',
              options: customers.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'DRAFT', label: 'Draft' },
                { value: 'CONFIRMED', label: 'Confirmed' },
              ],
            },
          ]}
        />
      </SectionCard>

      <Grid container spacing={2}>
        {standardReports.map((report, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={report.id}>
            <ReportTypeCard
              reportId={report.id}
              title={report.title}
              description={report.description}
              filters={report.filters || []}
              index={index}
              onDownload={(format) => onDownload(report.id, format)}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
