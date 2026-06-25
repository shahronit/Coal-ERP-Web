import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Stack, Alert, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCompleteSetupMutation, useGetSetupStatusQuery, useGetPublicBrandingQuery } from '../../store/api/services';
import { useSnackbar } from 'notistack';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { resolveAppName } from '../../utils/branding';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';

const setupRules = (t) => ({
  companyName: (values) => validators.required(values.companyName, t),
  password: (values) => validators.passwordMin(values.password, t),
});

export default function SetupWizardPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: statusData, isLoading: statusLoading } = useGetSetupStatusQuery();
  const { data: brandingData } = useGetPublicBrandingQuery(undefined, { pollingInterval: 60000 });
  const appName = resolveAppName(brandingData?.data?.appName || statusData?.data?.appName);
  useDocumentTitle(appName);
  const [completeSetup, { isLoading }] = useCompleteSetupMutation();
  const [form, setForm] = useState({ companyName: '', password: '', name: 'Super Admin' });
  const [errors, setErrors] = useState({});

  if (statusLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statusData?.data?.setupCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateFields(setupRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await completeSetup(form).unwrap();
      enqueueSnackbar('Setup completed', { variant: 'success' });
      setErrors({});
      navigate('/dashboard');
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(err.data?.message || 'Setup failed', { variant: 'error' });
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%' }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>Welcome to {appName}</Typography>
        <Typography color="text.secondary" mb={3}>Complete setup to start managing your coal trading business. All master data will be created by you.</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>Your database starts empty. Create partners, suppliers, customers, coal qualities, and batches from the Masters menu.</Alert>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Company Name"
              value={form.companyName}
              onChange={setField('companyName')}
              fullWidth
              required
              error={Boolean(errors.companyName)}
              helperText={errors.companyName}
            />
            <TextField label="Your Name" value={form.name} onChange={setField('name')} fullWidth />
            <TextField
              label="New Password"
              type="password"
              value={form.password}
              onChange={setField('password')}
              fullWidth
              required
              error={Boolean(errors.password)}
              helperText={errors.password}
            />
            <Button type="submit" variant="contained" disabled={isLoading}>Complete Setup</Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
