import { useState } from 'react';
import { Typography, Button, Grid, Card, CardContent, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import MasterSelect from '../../components/MasterSelect';
import DateField from '../../components/DateField';
import { MASTER_LIST_HOOKS } from '../../utils/masterHooks';
import {
  useListInvestmentsQuery, useGetROIQuery, useCreateInvestmentMutation,
  useListPartnersQuery,
} from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import KpiCard from '../../components/KpiCard';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../../components/ChartCard';
import { useCrudAccess } from '../../hooks/usePermissions';
import FormDialog from '../../components/FormDialog';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { investmentRules } from '../../utils/crmFinanceValidation';
import { formatApiError } from '../../utils/formatApiError';
import { useSnackbar } from 'notistack';

export default function InvestmentsPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { canCreate } = useCrudAccess('investments');
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const [form, setForm] = useState({ partnerId: '', amount: '', investmentDate: new Date().toISOString().split('T')[0] });
  const [errors, setErrors] = useState({});
  const { enqueueSnackbar } = useSnackbar();
  const { data: partnersData } = useListPartnersQuery({ limit: 200 });
  const { data, isLoading } = useListInvestmentsQuery({ page: page + 1, limit: 10, ...query });
  const { data: roi } = useGetROIQuery();
  const [create] = useCreateInvestmentMutation();

  const columns = [
    { field: 'partner', headerName: t('fields.partner'), render: r => r.partner?.name },
    { field: 'investmentDate', headerName: t('fields.date'), render: r => formatDate(r.investmentDate) },
    { field: 'amount', headerName: t('fields.amount'), render: r => formatCurrency(r.amount) },
    { field: 'expectedROI', headerName: 'Expected ROI %' },
  ];

  const totalInvested = (roi?.data || []).reduce((s, r) => s + r.invested, 0);
  const totalReturns = (roi?.data || []).reduce((s, r) => s + r.returns, 0);

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const handleSave = async () => {
    const nextErrors = validateFields(investmentRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await create(form).unwrap();
      setDialog(false);
      setErrors({});
      enqueueSnackbar(t('messages.created', { defaultValue: 'Created' }), { variant: 'success' });
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, t('messages.failed', { defaultValue: 'Failed' })), { variant: 'error' });
    }
  };

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title={t('investments.title', { ns: 'pages' })}
        subtitle={t('investments.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('investments.new', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? () => { setErrors({}); setDialog(true); } : undefined}
      />

      <Grid container spacing={2}>
        <Grid size={4}><KpiCard title={t('investments.totalInvested', { ns: 'pages' })} value={formatCurrency(totalInvested)} /></Grid>
        <Grid size={4}><KpiCard title={t('investments.totalReturns', { ns: 'pages' })} value={formatCurrency(totalReturns)} /></Grid>
        <Grid size={4}><KpiCard title={t('investments.avgRoi', { ns: 'pages' })} value={`${((totalReturns / totalInvested) * 100 || 0).toFixed(1)}%`} /></Grid>
      </Grid>

      <Typography variant="h6">{t('investments.roiDashboard', { ns: 'pages' })}</Typography>
      <Grid container spacing={2}>
        {(roi?.data || []).map(r => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r.id}>
            <Card><CardContent>
              <Typography fontWeight={600}>{r.partner}</Typography>
              <Typography variant="body2">{t('investments.invested', { ns: 'pages' })}: {formatCurrency(r.invested)}</Typography>
              <Typography variant="body2">{t('investments.returns', { ns: 'pages' })}: {formatCurrency(r.returns)}</Typography>
              <Typography variant="body2" color="success.main">{t('investments.roi', { ns: 'pages' })}: {r.roiPercent}%</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={12}>
          <ChartCard title="Partner ROI Comparison">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={roi?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="partner" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v, name) => name === 'roiPercent' ? `${v}%` : formatCurrency(v)} />
                <Bar dataKey="invested" fill="#2563eb" />
                <Bar dataKey="returns" fill="#16a34a" />
                <Bar dataKey="roiPercent" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Typography variant="h6">{t('investments.investmentHistory', { ns: 'pages' })}</Typography>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        selects={[{
          key: 'partnerId',
          label: 'Partner',
          options: (partnersData?.data || []).map((p) => ({ value: p.id, label: p.name })),
        }]}
      />
      <DataTable columns={columns} rows={data?.data || []} loading={isLoading} page={page} limit={10} total={data?.meta?.total || 0} onPageChange={setPage} actions={false} />

      <FormDialog open={dialog} onClose={() => setDialog(false)} title={t('investments.new', { ns: 'pages' })} onValidSubmit={handleSave}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <MasterSelect
              masterType="partners"
              label="Partner"
              value={form.partnerId}
              onChange={(v) => { setForm({ ...form, partnerId: v }); clearFieldError(setErrors, 'partnerId'); }}
              required
              error={Boolean(errors.partnerId)}
              helperText={errors.partnerId}
              useListQuery={MASTER_LIST_HOOKS.partners}
            />
          </Grid>
          <Grid size={6}>
            <TextField fullWidth label={t('fields.amount')} type="number" required value={form.amount} onChange={setField('amount')} error={Boolean(errors.amount)} helperText={errors.amount} />
          </Grid>
          <Grid size={6}>
            <DateField fullWidth label={t('fields.date')} required value={form.investmentDate} onChange={setField('investmentDate')} error={Boolean(errors.investmentDate)} helperText={errors.investmentDate} />
          </Grid>
        </Grid>
      </FormDialog>
    </ListPageLayout>
  );
}
