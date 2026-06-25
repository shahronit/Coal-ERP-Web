import { useState } from 'react';
import { TextField, Grid, MenuItem } from '@mui/material';
import DataTable from '../../components/DataTable';
import SectionCard from '../../components/SectionCard';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import PageHeader from '../../components/PageHeader';
import DateField from '../../components/DateField';
import FormDialog from '../../components/FormDialog';
import { useCreateActivityMutation, useListActivitiesQuery, useUpdateActivityMutation } from '../../store/api/services';
import { formatDate } from '../../utils/constants';
import { useCrudAccess } from '../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { activityRules } from '../../utils/crmFinanceValidation';
import { formatApiError } from '../../utils/formatApiError';
import { useSnackbar } from 'notistack';

const types = ['CALL', 'EMAIL', 'MEETING', 'TASK'];
const statuses = ['OPEN', 'COMPLETED', 'CANCELLED'];
const emptyForm = () => ({ type: 'CALL', subject: '', dueDate: '', status: 'OPEN', notes: '' });

export default function ActivitiesPage() {
  const { t } = useTranslation('common');
  const { canCreate, canUpdate } = useCrudAccess('crm');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data } = useListActivitiesQuery({ page: page + 1, limit, ...query });
  const [createActivity] = useCreateActivityMutation();
  const [updateActivity] = useUpdateActivityMutation();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    clearFieldError(setErrors, key);
  };

  const save = async () => {
    const nextErrors = validateFields(activityRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (form.id) await updateActivity(form).unwrap();
      else await createActivity(form).unwrap();
      setOpen(false);
      setForm(emptyForm());
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, 'Failed to save activity'), { variant: 'error' });
    }
  };

  const rows = data?.data || [];
  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title="Activities"
        subtitle="Manage calls, emails, meetings, tasks, and reminders."
        actionLabel={canCreate ? 'New Activity' : undefined}
        onAction={canCreate ? () => { setForm(emptyForm()); setErrors({}); setOpen(true); } : undefined}
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        selects={[
          { key: 'type', label: 'Type', options: types.map((v) => ({ value: v, label: v })) },
          { key: 'status', label: 'Status', options: statuses.map((v) => ({ value: v, label: v })) },
        ]}
      />
      <SectionCard>
        <DataTable
          rows={rows}
          columns={[
            { field: 'type', headerName: 'Type' },
            { field: 'subject', headerName: 'Subject' },
            { field: 'dueDate', headerName: 'Due', render: row => formatDate(row.dueDate) },
            { field: 'status', headerName: 'Status' },
            { field: 'party', headerName: 'Linked To', render: row => row.lead?.name || row.customer?.name || '-' },
          ]}
          page={page}
          limit={limit}
          total={data?.meta?.total || 0}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onEdit={canUpdate ? (row) => { setForm({ ...row, dueDate: row.dueDate ? row.dueDate.slice(0, 10) : '' }); setErrors({}); setOpen(true); } : undefined}
          actions={canUpdate}
        />
      </SectionCard>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'Edit Activity' : 'New Activity'}
        onValidSubmit={save}
        saveDisabled={form.id ? !canUpdate : !canCreate}
      >
        <Grid container spacing={2} mt={0.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth select label="Type" value={form.type} onChange={setField('type')} required error={Boolean(errors.type)} helperText={errors.type}>
              {types.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth select label="Status" value={form.status} onChange={setField('status')}>
              {statuses.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label="Subject" required value={form.subject} onChange={setField('subject')} error={Boolean(errors.subject)} helperText={errors.subject} />
          </Grid>
          <Grid size={12}>
            <DateField fullWidth label="Due Date" value={form.dueDate || ''} onChange={setField('dueDate')} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline rows={3} label="Notes" value={form.notes || ''} onChange={setField('notes')} />
          </Grid>
        </Grid>
      </FormDialog>
      <SectionCard title="CRM Tip">
        Move leads through stages after calls, meetings, or quotations. Activities can be used for reminders and follow-ups.
      </SectionCard>
    </ListPageLayout>
  );
}
