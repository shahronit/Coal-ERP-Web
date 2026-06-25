import { useState } from 'react';
import { TextField, Grid, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import MasterSelect from '../../components/MasterSelect';
import DateField from '../../components/DateField';
import FormDialog from '../../components/FormDialog';
import { MASTER_LIST_HOOKS } from '../../utils/masterHooks';
import {
  useListExpensesQuery, useCreateExpenseMutation, useDeleteExpenseMutation,
  useListExpenseTypesQuery,
} from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { expenseRules } from '../../utils/crmFinanceValidation';
import { formatApiError } from '../../utils/formatApiError';

export default function ExpensesPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { canCreate, canDelete } = useCrudAccess('expenses');
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const [form, setForm] = useState({ expenseTypeId: '', category: 'DIRECT', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' });
  const [errors, setErrors] = useState({});
  const { data: expenseTypesData } = useListExpenseTypesQuery({ limit: 200 });
  const { data, isLoading } = useListExpensesQuery({ page: page + 1, limit: 10, ...query });
  const [create] = useCreateExpenseMutation();
  const [remove] = useDeleteExpenseMutation();
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'expenseDate', headerName: t('fields.date'), render: r => formatDate(r.expenseDate) },
    { field: 'expenseType', headerName: t('fields.type'), render: r => r.expenseType?.name },
    { field: 'category', headerName: t('fields.category') },
    { field: 'amount', headerName: t('fields.amount'), render: r => formatCurrency(r.amount) },
    { field: 'description', headerName: t('fields.description') },
  ];

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const handleSave = async () => {
    const nextErrors = validateFields(expenseRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await create(form).unwrap();
      setDialog(false);
      setErrors({});
      enqueueSnackbar(t('messages.created'), { variant: 'success' });
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
        title={t('expenses.title', { ns: 'pages' })}
        subtitle={t('expenses.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('expenses.add', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? () => { setErrors({}); setDialog(true); } : undefined}
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        selects={[
          { key: 'category', label: 'Category', options: [{ value: 'DIRECT', label: 'Direct' }, { value: 'INDIRECT', label: 'Indirect' }] },
          { key: 'expenseTypeId', label: 'Expense Type', options: (expenseTypesData?.data || []).map((et) => ({ value: et.id, label: et.name })) },
        ]}
      />
      <DataTable columns={columns} rows={data?.data || []} loading={isLoading} page={page} limit={10} total={data?.meta?.total || 0} onPageChange={setPage}
        onDelete={canDelete ? async (row) => { if (window.confirm(t('messages.deleteQuestion'))) { await remove(row.id); enqueueSnackbar(t('messages.deleted'), { variant: 'success' }); } } : undefined}
        actions={canDelete}
        helpTopic="payments" />
      <FormDialog open={dialog} onClose={() => setDialog(false)} title={t('expenses.add', { ns: 'pages' })} onValidSubmit={handleSave}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <MasterSelect
              masterType="expense-types"
              label="Expense Type"
              value={form.expenseTypeId}
              onChange={(v) => { setForm({ ...form, expenseTypeId: v }); clearFieldError(setErrors, 'expenseTypeId'); }}
              required
              error={Boolean(errors.expenseTypeId)}
              helperText={errors.expenseTypeId}
              useListQuery={MASTER_LIST_HOOKS['expense-types']}
            />
          </Grid>
          <Grid size={6}>
            <TextField select fullWidth label={t('fields.category')} value={form.category} onChange={setField('category')} required error={Boolean(errors.category)} helperText={errors.category}>
              {['DIRECT', 'INDIRECT'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField fullWidth label={t('fields.amount')} type="number" required value={form.amount} onChange={setField('amount')} error={Boolean(errors.amount)} helperText={errors.amount} />
          </Grid>
          <Grid size={6}>
            <DateField fullWidth label={t('fields.date')} required value={form.expenseDate} onChange={setField('expenseDate')} error={Boolean(errors.expenseDate)} helperText={errors.expenseDate} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label={t('fields.description')} value={form.description} onChange={setField('description')} />
          </Grid>
        </Grid>
      </FormDialog>
    </ListPageLayout>
  );
}
