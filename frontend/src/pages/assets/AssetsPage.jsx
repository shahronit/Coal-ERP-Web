import { useState } from 'react';
import { TextField, Grid } from '@mui/material';
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
  useListAssetsQuery, useCreateAssetMutation, useDeleteAssetMutation,
  useListAssetTypesQuery,
} from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { assetRules } from '../../utils/crmFinanceValidation';
import { formatApiError } from '../../utils/formatApiError';

export default function AssetsPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { canCreate, canDelete } = useCrudAccess('assets');
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const [form, setForm] = useState({ name: '', assetTypeId: '', purchaseValue: '', purchaseDate: new Date().toISOString().split('T')[0] });
  const [errors, setErrors] = useState({});
  const { data: assetTypesData } = useListAssetTypesQuery({ limit: 200 });
  const { data, isLoading } = useListAssetsQuery({ page: page + 1, limit: 10, ...query });
  const [create] = useCreateAssetMutation();
  const [remove] = useDeleteAssetMutation();
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'name', headerName: t('fields.name') },
    { field: 'assetType', headerName: t('fields.type'), render: r => r.assetType?.name },
    { field: 'purchaseDate', headerName: t('fields.purchaseDate'), render: r => formatDate(r.purchaseDate) },
    { field: 'purchaseValue', headerName: t('fields.purchaseValue'), render: r => formatCurrency(r.purchaseValue) },
    { field: 'currentValue', headerName: t('fields.currentValue'), render: r => formatCurrency(r.currentValue) },
    { field: 'depreciationRate', headerName: t('fields.depreciationRate') },
  ];

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const handleSave = async () => {
    const nextErrors = validateFields(assetRules(t), form, t);
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
        title={t('assets.title', { ns: 'pages' })}
        subtitle={t('assets.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('assets.add', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? () => { setErrors({}); setDialog(true); } : undefined}
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        selects={[{ key: 'assetTypeId', label: 'Asset Type', options: (assetTypesData?.data || []).map((at) => ({ value: at.id, label: at.name })) }]}
      />
      <DataTable columns={columns} rows={data?.data || []} loading={isLoading} page={page} limit={10} total={data?.meta?.total || 0} onPageChange={setPage}
        onDelete={canDelete ? async (row) => { if (window.confirm(t('messages.deleteQuestion'))) { await remove(row.id); enqueueSnackbar(t('messages.deleted'), { variant: 'success' }); } } : undefined}
        actions={canDelete}
      />
      <FormDialog open={dialog} onClose={() => setDialog(false)} title={t('assets.add', { ns: 'pages' })} onValidSubmit={handleSave}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField fullWidth label={t('fields.name')} required value={form.name} onChange={setField('name')} error={Boolean(errors.name)} helperText={errors.name} />
          </Grid>
          <Grid size={12}>
            <MasterSelect
              masterType="asset-types"
              label="Asset Type"
              value={form.assetTypeId}
              onChange={(v) => { setForm({ ...form, assetTypeId: v }); clearFieldError(setErrors, 'assetTypeId'); }}
              required
              error={Boolean(errors.assetTypeId)}
              helperText={errors.assetTypeId}
              useListQuery={MASTER_LIST_HOOKS['asset-types']}
            />
          </Grid>
          <Grid size={6}>
            <TextField fullWidth label={t('fields.purchaseValue')} type="number" required value={form.purchaseValue} onChange={setField('purchaseValue')} error={Boolean(errors.purchaseValue)} helperText={errors.purchaseValue} />
          </Grid>
          <Grid size={6}>
            <DateField fullWidth label={t('fields.date')} required value={form.purchaseDate} onChange={setField('purchaseDate')} error={Boolean(errors.purchaseDate)} helperText={errors.purchaseDate} />
          </Grid>
        </Grid>
      </FormDialog>
    </ListPageLayout>
  );
}
