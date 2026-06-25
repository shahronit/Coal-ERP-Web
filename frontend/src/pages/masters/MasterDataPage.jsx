import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button, TextField, Grid, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import DateField from '../../components/DateField';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import FormDialog from '../../components/FormDialog';
import { MASTER_CONFIGS, formatDate } from '../../utils/constants';
import baseApi from '../../store/api/baseApi';
import { useCrudAccess } from '../../hooks/usePermissions';
import { mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validateMasterForm, masterFieldsForType } from '../../utils/masterValidation';
import { formatApiError } from '../../utils/formatApiError';

const useMasterHooks = (resource) => {
  const name = resource
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const endpoints = baseApi.injectEndpoints({
    endpoints: (builder) => ({
      [`listMasterPage${name}`]: builder.query({
        query: (p) => ({ url: `/masters/${resource}`, params: p }),
        providesTags: [{ type: 'Master', id: resource }],
      }),
      [`createMasterPage${name}`]: builder.mutation({
        query: (b) => ({ url: `/masters/${resource}`, method: 'POST', body: b }),
        invalidatesTags: [{ type: 'Master', id: resource }],
      }),
      [`updateMasterPage${name}`]: builder.mutation({
        query: ({ id, ...b }) => ({ url: `/masters/${resource}/${id}`, method: 'PUT', body: b }),
        invalidatesTags: [{ type: 'Master', id: resource }],
      }),
      [`removeMasterPage${name}`]: builder.mutation({
        query: (id) => ({ url: `/masters/${resource}/${id}`, method: 'DELETE' }),
        invalidatesTags: [{ type: 'Master', id: resource }],
      }),
    }),
    overrideExisting: true,
  });

  return {
    useListQuery: endpoints[`useListMasterPage${name}Query`],
    useCreateMutation: endpoints[`useCreateMasterPage${name}Mutation`],
    useUpdateMutation: endpoints[`useUpdateMasterPage${name}Mutation`],
    useRemoveMutation: endpoints[`useRemoveMasterPage${name}Mutation`],
  };
};

export default function MasterDataPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { type = 'partners' } = useParams();
  const config = MASTER_CONFIGS[type] || MASTER_CONFIGS.partners;
  const title = t(`masters.titles.${type}`, { ns: 'pages', defaultValue: config.title });
  const { useListQuery, useCreateMutation, useUpdateMutation, useRemoveMutation } = useMasterHooks(config.api);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [dialog, setDialog] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ name: '', isActive: true });
  const [errors, setErrors] = useState({});
  const { enqueueSnackbar } = useSnackbar();
  const { canCreate, canUpdate, canDelete } = useCrudAccess('masters');

  const { data, isLoading } = useListQuery({ page: page + 1, limit, sort, order, ...query });
  const [create] = useCreateMutation();
  const [update] = useUpdateMutation();
  const [remove] = useRemoveMutation();

  const fields = masterFieldsForType(type, t);

  const columns = config.fields.map(f => ({
    field: f,
    headerName: t(`fields.${f}`, { defaultValue: f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) }),
    render: f.includes('Date') || f.includes('From') ? (row) => formatDate(row[f]) : undefined,
  }));

  const openCreate = () => {
    setEditRow(null);
    setForm({ name: '', isActive: true });
    setErrors({});
    setDialog(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({ ...row });
    setErrors({});
    setDialog(true);
  };

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    clearFieldError(setErrors, key);
  };

  const buildPayload = () => {
    const payload = {};
    fields.forEach((f) => {
      const value = form[f.key];
      if (value !== undefined && value !== '') payload[f.key] = value;
    });
    if (form.isActive !== undefined) payload.isActive = form.isActive;
    return payload;
  };

  const handleSave = async () => {
    const nextErrors = validateMasterForm(fields, form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = buildPayload();

    try {
      if (editRow) {
        await update({ id: editRow.id, ...payload }).unwrap();
        enqueueSnackbar(t('messages.updated'), { variant: 'success' });
      } else {
        await create(payload).unwrap();
        enqueueSnackbar(t('messages.created'), { variant: 'success' });
      }
      setDialog(false);
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(formatApiError(err, t('messages.errorSaving')), { variant: 'error' });
      }
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(t('messages.deleteQuestion'))) return;
    try {
      await remove(row.id).unwrap();
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, t('messages.deleteFailed')), { variant: 'error' });
    }
  };

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title={title}
        subtitle={t('masters.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('actions.addNew') : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? openCreate : undefined}
      />

      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        showDates={false}
        selects={[{
          key: 'isActive',
          label: 'Status',
          options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }],
        }]}
      />

      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.meta?.total || 0}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sort={sort}
        order={order}
        onSort={(f, o) => { setSort(f); setOrder(o); }}
        onEdit={canUpdate ? openEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        actions={canUpdate || canDelete}
        helpTopic="master-data"
      />

      <FormDialog
        open={dialog}
        onClose={() => setDialog(false)}
        title={t('masters.dialogTitle', { ns: 'pages', mode: editRow ? t('actions.edit') : t('actions.create'), title })}
        onValidSubmit={handleSave}
        saveDisabled={editRow ? !canUpdate : !canCreate}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {fields.map(f => (
            <Grid size={{ xs: 12, sm: 6 }} key={f.key}>
              {f.select ? (
                <TextField
                  select
                  fullWidth
                  label={f.label}
                  required={Boolean(f.required)}
                  value={form[f.key] || ''}
                  onChange={setField(f.key)}
                  error={Boolean(errors[f.key])}
                  helperText={errors[f.key]}
                >
                  {f.select.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              ) : f.type === 'date' ? (
                <DateField
                  fullWidth
                  label={f.label}
                  required={Boolean(f.required)}
                  value={form[f.key] ?? ''}
                  onChange={setField(f.key)}
                  error={Boolean(errors[f.key])}
                  helperText={errors[f.key]}
                />
              ) : (
                <TextField
                  fullWidth
                  label={f.label}
                  type={f.type || 'text'}
                  required={Boolean(f.required)}
                  value={form[f.key] ?? ''}
                  onChange={setField(f.key)}
                  error={Boolean(errors[f.key])}
                  helperText={errors[f.key]}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </FormDialog>
    </ListPageLayout>
  );
}
