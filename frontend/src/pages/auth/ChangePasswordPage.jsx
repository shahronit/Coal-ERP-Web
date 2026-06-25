import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useChangePasswordMutation } from '../../store/api/services';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';

const changePasswordRules = (t) => ({
  currentPassword: (values) => validators.required(values.currentPassword, t),
  newPassword: (values) => validators.passwordMin(values.newPassword, t),
  confirm: (values) => validators.match(values.newPassword, values.confirm, t)
    || validators.required(values.confirm, t),
});

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();
  const { enqueueSnackbar } = useSnackbar();

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
    if (field === 'newPassword' || field === 'confirm') {
      clearFieldError(setErrors, 'confirm');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateFields(changePasswordRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }).unwrap();
      enqueueSnackbar(t('messages.passwordChanged'), { variant: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setErrors({});
    } catch (err) {
      setErrors(mapApiErrorsToFields(err?.data?.errors));
    }
  };

  return (
    <Box maxWidth={480}>
      <PageHeader title={t('auth.changePassword')} />
      <Card>
        <CardContent>
          {error && !Object.keys(errors).length && <Alert severity="error" sx={{ mb: 2 }}>{error.data?.message}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label={t('fields.currentPassword')}
              type="password"
              required
              value={form.currentPassword}
              onChange={setField('currentPassword')}
              margin="normal"
              error={Boolean(errors.currentPassword)}
              helperText={errors.currentPassword}
            />
            <TextField
              fullWidth
              label={t('fields.newPassword')}
              type="password"
              required
              value={form.newPassword}
              onChange={setField('newPassword')}
              margin="normal"
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword}
            />
            <TextField
              fullWidth
              label={t('fields.confirmPassword')}
              type="password"
              required
              value={form.confirm}
              onChange={setField('confirm')}
              margin="normal"
              error={Boolean(errors.confirm)}
              helperText={errors.confirm}
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={isLoading}>{t('auth.updatePassword')}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
