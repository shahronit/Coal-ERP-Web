import { useState } from 'react';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import KanbanBoard from '../../components/KanbanBoard';
import SectionCard from '../../components/SectionCard';
import PageHeader from '../../components/PageHeader';
import FormDialog from '../../components/FormDialog';
import { useCreateLeadMutation, useGetPipelineQuery, useUpdateLeadMutation } from '../../store/api/services';
import { useCrudAccess } from '../../hooks/usePermissions';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { leadRules } from '../../utils/crmFinanceValidation';
import { formatApiError } from '../../utils/formatApiError';
import { useSnackbar } from 'notistack';

const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];
const emptyForm = () => ({ name: '', company: '', phone: '', email: '', source: '', stage: 'NEW', estimatedValue: 0, notes: '' });

export default function LeadsPage() {
  const { t } = useTranslation('common');
  const { canCreate, canUpdate } = useCrudAccess('crm');
  const { data } = useGetPipelineQuery();
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    clearFieldError(setErrors, key);
  };

  const save = async () => {
    const nextErrors = validateFields(leadRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (form.id) await updateLead(form).unwrap();
      else await createLead(form).unwrap();
      setOpen(false);
      setForm(emptyForm());
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, 'Failed to save lead'), { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Leads Pipeline"
        subtitle="Track opportunities from first contact to won/lost."
        actionLabel={canCreate ? 'New Lead' : undefined}
        onAction={canCreate ? () => { setForm(emptyForm()); setErrors({}); setOpen(true); } : undefined}
      />
      <KanbanBoard columns={data?.data || []} onCardClick={canUpdate ? (lead) => { setForm(lead); setErrors({}); setOpen(true); } : undefined} />
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'Edit Lead' : 'New Lead'}
        onValidSubmit={save}
        maxWidth="md"
        saveDisabled={form.id ? !canUpdate : !canCreate}
      >
        <Grid container spacing={2} mt={0.5}>
          {[
            ['name', 'Name'], ['company', 'Company'], ['phone', 'Phone'], ['email', 'Email'], ['source', 'Source'],
          ].map(([key, label]) => (
            <Grid size={{ xs: 12, md: 6 }} key={key}>
              <TextField
                fullWidth
                label={label}
                required={key === 'name'}
                value={form[key] || ''}
                onChange={setField(key)}
                error={Boolean(errors[key])}
                helperText={errors[key]}
              />
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth select label="Stage" value={form.stage} onChange={setField('stage')}>
              {stages.map(stage => <MenuItem key={stage} value={stage}>{stage}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth type="number" label="Estimated Value" value={form.estimatedValue || 0} onChange={setField('estimatedValue')} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline rows={3} label="Notes" value={form.notes || ''} onChange={setField('notes')} />
          </Grid>
        </Grid>
      </FormDialog>
      <SectionCard sx={{ mt: 2 }} title="CRM Tip">
        Move leads through stages after calls, meetings, or quotations. Activities can be used for reminders and follow-ups.
      </SectionCard>
    </Box>
  );
}
