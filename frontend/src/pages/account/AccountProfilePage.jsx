import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Avatar, Box, Button, Chip, CircularProgress, Fade, Grow,
  Grid, Stack, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import { glassSurface } from '../../theme/colors';
import { ROLE_LABELS } from '../../utils/roles';
import { updateUser } from '../../store/slices/authSlice';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../store/api/services';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';
import RequiredMark from '../../components/RequiredMark';

const profileRules = (t) => ({
  name: (values) => validators.nameMin(values.name, t),
  phone: (values) => validators.phone(values.phone, t),
});

const EMPTY_FORM = {
  name: '',
  phone: '',
  username: '',
  department: '',
  designation: '',
  address: '',
};

const profileFromData = (data) => ({
  name: data?.name || '',
  phone: data?.phone || '',
  username: data?.username || '',
  department: data?.department || '',
  designation: data?.designation || '',
  address: data?.address || '',
});

function ProfileField({ label, value, editing, children, readOnly = false, required = false }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const display = value?.trim?.() ? value : null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isLight ? alpha(theme.palette.primary.main, editing && !readOnly ? 0.16 : 0.08) : alpha('#fff', editing && !readOnly ? 0.14 : 0.08),
        bgcolor: isLight ? alpha('#fff', 0.45) : alpha('#fff', 0.03),
        transition: 'border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease',
        ...(readOnly && {
          bgcolor: isLight ? alpha(theme.palette.primary.main, 0.03) : alpha('#fff', 0.02),
        }),
        ...(editing && !readOnly && {
          boxShadow: isLight
            ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.06)}`
            : `0 4px 16px ${alpha('#000', 0.2)}`,
        }),
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.75}>
        {label}
        {required && <RequiredMark />}
      </Typography>
      <Fade in key={editing && !readOnly ? 'edit-field' : 'view-field'} timeout={220}>
        <Box>
          {editing && !readOnly ? children : (
            <Typography variant="body1" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
              {display || '—'}
            </Typography>
          )}
        </Box>
      </Fade>
    </Box>
  );
}

export default function AccountProfilePage() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const isLight = theme.palette.mode === 'light';
  const glass = glassSurface(theme.palette.mode, isLight ? 0.82 : 0.08);

  const { data: profileRes, isLoading, isError } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const profile = profileRes?.data;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) setForm(profileFromData(profile));
  }, [profile]);

  const displayName = profile?.name || 'User';
  const roleLabel = ROLE_LABELS[profile?.role] || profile?.role || '—';

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return null;
    return new Date(profile.createdAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }, [profile?.createdAt]);

  const handleEdit = () => {
    setForm(profileFromData(profile));
    setEditing(true);
  };

  const handleCancel = () => {
    setForm(profileFromData(profile));
    setEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    const nextErrors = validateFields(profileRules(t), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const result = await updateProfile(form).unwrap();
      dispatch(updateUser(result.data));
      enqueueSnackbar(t('account.profileUpdated'), { variant: 'success' });
      setEditing(false);
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(err?.data?.message || t('account.profileUpdateFailed'), { variant: 'error' });
      }
    }
  };

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const headerActions = editing ? (
    <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
      <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
        {t('actions.cancel')}
      </Button>
      <Button
        variant="contained"
        startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
        onClick={handleSave}
        disabled={isSaving}
      >
        {t('actions.saveChanges')}
      </Button>
    </Stack>
  ) : (
    <Grow in timeout={280}>
      <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={handleEdit}>
        {t('actions.edit')}
      </Button>
    </Grow>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !profile) {
    return (
      <Box maxWidth={720}>
        <PageHeader title={t('account.profileDetails')} />
        <Typography color="error">{t('account.profileUpdateFailed')}</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth={880} sx={{ pb: 3 }}>
      <PageHeader
        title={t('account.profileDetails')}
        subtitle={editing ? t('account.editModeHint') : t('account.viewModeHint')}
        sx={{ mb: 2.5 }}
      >
        {headerActions}
      </PageHeader>

      <Fade in timeout={280}>
        <Box
          className="glass-panel"
          sx={{
            ...glass,
            borderRadius: 3,
            p: { xs: 2.5, md: 3 },
            mb: 2.5,
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            ...(editing && {
              borderColor: isLight ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.light, 0.22),
            }),
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Avatar
              sx={{
                width: 88,
                height: 88,
                fontWeight: 800,
                fontSize: '2rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {displayName[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box flex={1} textAlign={{ xs: 'center', sm: 'left' }} minWidth={0}>
              <Typography variant="h5" fontWeight={800} noWrap>{displayName}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap mt={0.5}>{profile.email}</Typography>
              <Stack direction="row" spacing={1} mt={1.25} justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap" useFlexGap>
                <Chip label={roleLabel} size="small" color="primary" sx={{ fontWeight: 700 }} />
                {memberSince && (
                  <Chip
                    label={`${t('account.memberSince')} ${memberSince}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Fade>

      <Stack spacing={2.5}>
        <Box sx={{ ...glass, borderRadius: 3, p: { xs: 2, md: 2.5 } }}>
          <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.08em">
            {t('account.personalInfo')}
          </Typography>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.name')} value={form.name} editing={editing} required>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={form.name}
                  onChange={setField('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                />
              </ProfileField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.email')} value={profile.email} editing={editing} readOnly />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.mobile')} value={form.phone} editing={editing}>
                <TextField
                  fullWidth
                  size="small"
                  value={form.phone}
                  onChange={setField('phone')}
                  placeholder={t('fields.phone')}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                />
              </ProfileField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.username')} value={form.username} editing={editing}>
                <TextField fullWidth size="small" value={form.username} onChange={setField('username')} />
              </ProfileField>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ ...glass, borderRadius: 3, p: { xs: 2, md: 2.5 } }}>
          <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.08em">
            {t('account.workInfo')}
          </Typography>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.department')} value={form.department} editing={editing}>
                <TextField fullWidth size="small" value={form.department} onChange={setField('department')} />
              </ProfileField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.designation')} value={form.designation} editing={editing}>
                <TextField fullWidth size="small" value={form.designation} onChange={setField('designation')} />
              </ProfileField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProfileField label={t('fields.role')} value={roleLabel} editing={editing} readOnly />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ ...glass, borderRadius: 3, p: { xs: 2, md: 2.5 } }}>
          <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.08em">
            {t('account.contactInfo')}
          </Typography>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={{ xs: 12 }}>
              <ProfileField label={t('fields.address')} value={form.address} editing={editing}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  value={form.address}
                  onChange={setField('address')}
                />
              </ProfileField>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            ...glass,
            borderRadius: 3,
            p: { xs: 2, md: 2.5 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>{t('auth.changePassword')}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t('account.changePasswordHint')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<LockOutlinedIcon />}
            onClick={() => navigate('/change-password')}
            sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            {t('auth.changePassword')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
