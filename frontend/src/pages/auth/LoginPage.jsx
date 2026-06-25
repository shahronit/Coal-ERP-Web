import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, useTheme,
} from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import { useLoginMutation, useGetPublicBrandingQuery } from '../../store/api/services';
import { setCredentials } from '../../store/slices/authSlice';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import AppBrand from '../../components/AppBrand';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { brandGradient, glassSurface, meshBackground } from '../../theme/colors';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';

const loginRules = (t) => ({
  email: (values) => validators.email(values.email, t),
  password: (values) => validators.required(values.password, t),
});

export default function LoginPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [email, setEmail] = useState('superadmin@tradecrm.com');
  const [password, setPassword] = useState('Demo@123');
  const [errors, setErrors] = useState({});
  const [login, { isLoading, error }] = useLoginMutation();
  const { data: brandingData } = useGetPublicBrandingQuery(undefined, { pollingInterval: 60000 });
  const branding = brandingData?.data || {};
  useDocumentTitle(branding.appName);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateFields(loginRules(t), { email, password }, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials(res.data));
      setErrors({});
      navigate('/dashboard');
    } catch (err) {
      setErrors(mapApiErrorsToFields(err?.data?.errors));
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      sx={{
        background: meshBackground(theme.palette.mode),
        px: 2,
        py: 3,
      }}
    >
      <Box position="absolute" top={16} right={16} zIndex={2}>
        <LanguageSwitcher />
      </Box>

      <Box width="100%" maxWidth={440} mx="auto">
        <Card
          elevation={0}
          sx={{
            ...glassSurface(theme.palette.mode, isLight ? 0.82 : 0.1),
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              height: 3,
              background: brandGradient(theme.palette.mode),
            }}
          />
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={3} alignItems="center">
              <Box display="flex" justifyContent="center" width="100%">
                <AppBrand
                  appName={branding.appName}
                  companyName={branding.companyName}
                  companyLogo={branding.companyLogo}
                />
              </Box>

              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
                sx={{ lineHeight: 1.6, maxWidth: 360 }}
              >
                {t('auth.subtitle')}
              </Typography>

              <Box width="100%">
                <Typography
                  variant="h5"
                  fontWeight={800}
                  textAlign="center"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  {t('auth.signIn')}
                </Typography>

                {error && !Object.keys(errors).length && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error.data?.message
                      || (error.status === 'FETCH_ERROR' ? t('messages.networkError') : null)
                      || t('messages.loginFailed')}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label={t('fields.email')}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError(setErrors, 'email'); }}
                      autoComplete="email"
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                    />
                    <TextField
                      fullWidth
                      label={t('fields.password')}
                      type="password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError(setErrors, 'password'); }}
                      autoComplete="current-password"
                      error={Boolean(errors.password)}
                      helperText={errors.password}
                    />
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      sx={{ mt: 0.5 }}
                    >
                      {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                    </Button>
                  </Stack>
                  <Box textAlign="center" mt={2}>
                    <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
                  </Box>
                </Box>
              </Box>

              <Alert
                severity="info"
                icon={<InfoOutlinedIcon fontSize="inherit" />}
                sx={{
                  width: '100%',
                  alignItems: 'flex-start',
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {t('auth.needDemoAccess')}
                </Typography>
                <Typography
                  variant="body2"
                  component="code"
                  sx={{
                    display: 'block',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '0.8125rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {t('auth.demoCredentials')}
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<PlayCircleIcon />}
                onClick={() => navigate('/help/getting-started')}
                fullWidth
              >
                {t('auth.watchIntro')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
