import { useState, useEffect } from 'react';
import {
  TextField, Grid, MenuItem, Tabs, Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import DateField from '../../components/DateField';
import FormDialog from '../../components/FormDialog';
import KpiCard from '../../components/KpiCard';
import {
  useListPaymentsQuery, useGetOutstandingQuery, useCreatePaymentMutation,
  useListPurchasesQuery, useListSalesQuery,
} from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { paymentRules } from '../../utils/crmFinanceValidation';
import { formatApiError } from '../../utils/formatApiError';

export default function PaymentsPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { canCreate } = useCrudAccess('payments');
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const paymentType = tab === 0 ? 'RECEIVED' : 'PAID';
  const [form, setForm] = useState({
    paymentType: 'RECEIVED',
    paymentMode: 'CASH',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    entityType: 'SALE',
    entityId: '',
    referenceNo: '',
    paidByName: '',
  });
  const [errors, setErrors] = useState({});
  const { data, isLoading } = useListPaymentsQuery({ page: page + 1, limit: 10, paymentType, ...query });
  const { data: outstanding } = useGetOutstandingQuery();
  const { data: salesData } = useListSalesQuery({ limit: 100, status: 'CONFIRMED' });
  const { data: purchasesData } = useListPurchasesQuery({ limit: 100, status: 'CONFIRMED' });
  const [createPayment] = useCreatePaymentMutation();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setForm((f) => ({
      ...f,
      paymentType,
      entityType: paymentType === 'RECEIVED' ? 'SALE' : 'PURCHASE',
      entityId: '',
    }));
    setPage(0);
  }, [paymentType]);

  const columns = [
    { field: 'paymentDate', headerName: t('fields.date'), render: r => formatDate(r.paymentDate) },
    { field: 'paymentType', headerName: t('fields.type') },
    { field: 'paymentMode', headerName: t('fields.mode'), render: r => r.paymentMode?.replace('_', ' ') },
    { field: 'amount', headerName: t('fields.amount'), render: r => formatCurrency(r.amount) },
    { field: 'paidByName', headerName: 'Paid By' },
    { field: 'referenceNo', headerName: t('fields.reference') },
    { field: 'entityType', headerName: t('fields.entity') },
  ];

  const entityOptions = form.paymentType === 'RECEIVED'
    ? (salesData?.data || []).map((s) => ({ value: s.id, label: `${s.saleNumber} — ${s.customer?.name || ''}` }))
    : (purchasesData?.data || []).map((p) => ({ value: p.id, label: `${p.purchaseNumber} — ${p.supplier?.name || ''}` }));

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const handleSave = async () => {
    const nextErrors = validateFields(paymentRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await createPayment({ ...form, entityId: form.entityId || null }).unwrap();
      enqueueSnackbar(t('messages.paymentRecorded'), { variant: 'success' });
      setDialog(false);
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, t('messages.failed')), { variant: 'error' });
    }
  };

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title={t('payments.title', { ns: 'pages' })}
        subtitle={t('payments.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('payments.record', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? () => { setErrors({}); setDialog(true); } : undefined}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}><KpiCard title={t('payments.receivable', { ns: 'pages' })} value={formatCurrency(outstanding?.data?.receivable)} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><KpiCard title={t('payments.payable', { ns: 'pages' })} value={formatCurrency(outstanding?.data?.payable)} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><KpiCard title={t('payments.netOutstanding', { ns: 'pages' })} value={formatCurrency(outstanding?.data?.net)} /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={t('status.received')} />
        <Tab label={t('status.paid')} />
      </Tabs>

      <ListToolbar filters={filters} onChange={setFilters} onApply={applyFilters} onReset={resetFilters} showDates />
      <DataTable columns={columns} rows={data?.data || []} loading={isLoading} page={page} limit={10} total={data?.meta?.total || 0} onPageChange={setPage} actions={false} helpTopic="payments" />

      <FormDialog open={dialog} onClose={() => setDialog(false)} title={t('payments.record', { ns: 'pages' })} onValidSubmit={handleSave}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={6}>
            <TextField select fullWidth label={t('fields.type')} value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value, entityType: e.target.value === 'RECEIVED' ? 'SALE' : 'PURCHASE', entityId: '' })} required error={Boolean(errors.paymentType)} helperText={errors.paymentType}>
              {['RECEIVED', 'PAID'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField select fullWidth label={t('fields.mode')} value={form.paymentMode} onChange={setField('paymentMode')} required error={Boolean(errors.paymentMode)} helperText={errors.paymentMode}>
              {['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'].map(v => <MenuItem key={v} value={v}>{v.replace('_', ' ')}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField select fullWidth label={form.paymentType === 'RECEIVED' ? 'Sale' : 'Purchase'} value={form.entityId} onChange={setField('entityId')}>
              <MenuItem value="">None</MenuItem>
              {entityOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField fullWidth label={t('fields.amount')} type="number" required value={form.amount} onChange={setField('amount')} error={Boolean(errors.amount)} helperText={errors.amount} />
          </Grid>
          <Grid size={6}>
            <DateField fullWidth label={t('fields.date')} required value={form.paymentDate} onChange={setField('paymentDate')} error={Boolean(errors.paymentDate)} helperText={errors.paymentDate} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label="Who made the payment" value={form.paidByName || ''} onChange={setField('paidByName')} placeholder="Name of the person" />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label={t('fields.referenceNo')} value={form.referenceNo || ''} onChange={setField('referenceNo')} />
          </Grid>
        </Grid>
      </FormDialog>
    </ListPageLayout>
  );
}
