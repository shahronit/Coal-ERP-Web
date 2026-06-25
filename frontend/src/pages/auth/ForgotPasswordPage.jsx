import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useForgotPasswordMutation } from '../../store/api/services';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';

const forgotRules = (t) => ({
  email: (values) => validators.email(values.email, t),
});

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [forgot, { isLoading, isSuccess, error }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateFields(forgotRules(t), { email }, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await forgot({ email }).unwrap();
      setErrors({});
    } catch (err) {
      setErrors(mapApiErrorsToFields(err?.data?.errors));
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center">
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>{t('auth.forgotPasswordTitle')}</Typography>
            {isSuccess && <Alert severity="success" sx={{ mb: 2 }}>{t('messages.resetSent')}</Alert>}
            {error && !Object.keys(errors).length && <Alert severity="error" sx={{ mb: 2 }}>{error.data?.message}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label={t('fields.email')}
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError(setErrors, 'email'); }}
                margin="normal"
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
              <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }} disabled={isLoading}>{t('auth.sendResetLink')}</Button>
              <Box textAlign="center" mt={2}><Link to="/login">{t('auth.backToLogin')}</Link></Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
