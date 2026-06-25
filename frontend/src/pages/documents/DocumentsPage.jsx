import { useState } from 'react';
import { Typography, Button, TextField, Grid, Card, CardContent, MenuItem } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import baseApi from '../../store/api/baseApi';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';
import { formatApiError } from '../../utils/formatApiError';
import RequiredMark from '../../components/RequiredMark';

const ENTITY_TYPES = ['PURCHASE', 'SALE', 'EXPENSE', 'PAYMENT', 'INVESTMENT', 'LEAD', 'OTHER'];

const uploadRules = (t) => ({
  entityType: (values) => validators.select(values.entityType, t),
  entityId: (values) => validators.uuid(values.entityId, t),
  file: (values) => (values.file ? null : t('validation.fileRequired')),
});

const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDocs: builder.query({ query: (p) => ({ url: '/documents', params: p }) }),
    uploadDoc: builder.mutation({
      query: (formData) => ({ url: '/documents/upload', method: 'POST', body: formData }),
    }),
  }),
});

const { useListDocsQuery, useUploadDocMutation } = documentsApi;

export default function DocumentsPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { canCreate } = useCrudAccess('documents');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState('PURCHASE');
  const [entityId, setEntityId] = useState('');
  const [errors, setErrors] = useState({});
  const { data, isLoading } = useListDocsQuery({ page: page + 1, limit: 10, ...query });
  const [upload, { isLoading: uploading }] = useUploadDocMutation();
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'originalName', headerName: t('fields.fileName') },
    { field: 'mimeType', headerName: t('fields.type') },
    { field: 'size', headerName: t('fields.size'), render: r => `${(r.size / 1024).toFixed(1)} KB` },
    { field: 'entityType', headerName: t('fields.entityType') },
    { field: 'createdAt', headerName: t('fields.uploaded'), render: r => new Date(r.createdAt).toLocaleDateString() },
  ];

  const handleUpload = async () => {
    const nextErrors = validateFields(uploadRules(t), { entityType, entityId, file }, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('entityType', entityType);
    fd.append('entityId', entityId);
    try {
      await upload(fd).unwrap();
      enqueueSnackbar(t('messages.uploaded'), { variant: 'success' });
      setFile(null);
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, t('messages.uploadFailed')), { variant: 'error' });
    }
  };

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader title={t('documents.title', { ns: 'pages' })} subtitle={t('documents.subtitle', { ns: 'pages' })} />
      {canCreate && (
      <Card sx={{ mb: 0 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t('documents.uploadTitle', { ns: 'pages' })}</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                select
                fullWidth
                label={t('fields.entityType')}
                required
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); clearFieldError(setErrors, 'entityType'); }}
                error={Boolean(errors.entityType)}
                helperText={errors.entityType}
              >
                {ENTITY_TYPES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label={t('fields.entityId')}
                required
                value={entityId}
                onChange={(e) => { setEntityId(e.target.value); clearFieldError(setErrors, 'entityId'); }}
                error={Boolean(errors.entityId)}
                helperText={errors.entityId}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.75}>
                {t('actions.chooseFile')}
                <RequiredMark />
              </Typography>
              <Button variant="outlined" component="label" fullWidth startIcon={<UploadFileIcon />} color={errors.file ? 'error' : 'primary'}>
                {file?.name || t('actions.chooseFile')}
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.xlsx" onChange={(e) => { setFile(e.target.files[0]); clearFieldError(setErrors, 'file'); }} />
              </Button>
              {errors.file && <Typography variant="caption" color="error" display="block" mt={0.5}>{errors.file}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button variant="contained" fullWidth onClick={handleUpload} disabled={uploading}>{t('actions.upload')}</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      )}
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        showDates={false}
        selects={[{
          key: 'entityType',
          label: 'Entity Type',
          options: ENTITY_TYPES.map((v) => ({ value: v, label: v })),
        }]}
      />
      <DataTable columns={columns} rows={data?.data || []} loading={isLoading} page={page} limit={10} total={data?.meta?.total || 0} onPageChange={setPage} actions={false} helpTopic="documents" />
    </ListPageLayout>
  );
}
