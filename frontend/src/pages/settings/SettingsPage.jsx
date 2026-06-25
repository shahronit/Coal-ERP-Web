import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert, Box, Button, Chip, Divider, Stack, TextField, Typography, FormControlLabel, Switch, MenuItem,
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StorageIcon from '@mui/icons-material/Storage';
import ScienceIcon from '@mui/icons-material/Science';
import RestoreIcon from '@mui/icons-material/Restore';
import { useSnackbar } from 'notistack';
import PageLayout from '../../components/PageLayout';
import SectionCard from '../../components/SectionCard';
import { layout } from '../../theme/tokens';
import PageHeader from '../../components/PageHeader';
import AppBrand from '../../components/AppBrand';
import RoleModuleMatrix from '../../components/RoleModuleMatrix';
import {
  useGetBackupHistoryQuery,
  useGetBackupSettingsQuery,
  useRunBackupMutation,
  useRestoreBackupMutation,
  useUpdateBackupSettingsMutation,
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
  useUpdateRoleModulesMutation,
  useLoadDemoSeedMutation,
} from '../../store/api/services';
import { CONFIGURABLE_ROLES, DEFAULT_ROLE_MODULES, ROLE_HIERARCHY, ROLE_LABELS, ROLES } from '../../utils/roles';
import { useCrudAccess } from '../../hooks/usePermissions';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { resolveAppName } from '../../utils/branding';
import { formatApiError } from '../../utils/formatApiError';
import { mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';

const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-IN') : 'Never';

const buildRoleModulesState = (appSettings) => {
  const merged = {};
  CONFIGURABLE_ROLES.forEach((role) => {
    merged[role] = appSettings?.roleModules?.[role] ?? DEFAULT_ROLE_MODULES[role] ?? ['dashboard'];
  });
  return merged;
};

const buildRoleModulesPayload = (state) =>
  CONFIGURABLE_ROLES.reduce((acc, role) => {
    const modules = Array.isArray(state?.[role]) ? state[role] : (DEFAULT_ROLE_MODULES[role] ?? ['dashboard']);
    const filtered = modules.filter(Boolean);
    acc[role] = filtered.includes('dashboard') ? filtered : ['dashboard', ...filtered];
    return acc;
  }, {});

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { canUpdate } = useCrudAccess('settings');
  const { data: settingsData, isLoading: settingsLoading } = useGetBackupSettingsQuery();
  const { data: historyData } = useGetBackupHistoryQuery();
  const { data: appSettingsData } = useGetAppSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateBackupSettingsMutation();
  const [updateAppSettings, { isLoading: savingApp }] = useUpdateAppSettingsMutation();
  const [updateRoleModules, { isLoading: savingRoles }] = useUpdateRoleModulesMutation();
  const [runBackup, { isLoading: backingUp }] = useRunBackupMutation();
  const [restoreBackup, { isLoading: restoring }] = useRestoreBackupMutation();
  const [loadDemoSeed, { isLoading: loadingDemo }] = useLoadDemoSeedMutation();
  const [folder, setFolder] = useState('');
  const [databasePath, setDatabasePath] = useState('');
  const [brandForm, setBrandForm] = useState({ appName: '', companyName: '', companyLogo: '' });
  const [fifoCostBasis, setFifoCostBasis] = useState('EX_GST');
  const [roleModules, setRoleModules] = useState(() => buildRoleModulesState({}));
  const [roleModulesDirty, setRoleModulesDirty] = useState(false);
  const [brandErrors, setBrandErrors] = useState({});
  const roleModulesDirtyRef = useRef(false);

  const settings = settingsData?.data;
  const appSettings = appSettingsData?.data || {};
  const history = historyData?.data || settings?.history || [];

  useEffect(() => {
    if (settings?.backupDir) setFolder(settings.backupDir);
  }, [settings?.backupDir]);

  useEffect(() => {
    setDatabasePath(appSettings.customDatabasePath || settings?.databasePath || '');
  }, [appSettings.customDatabasePath, settings?.databasePath]);

  useEffect(() => {
    setBrandForm({
      appName: appSettings.appName || '',
      companyName: appSettings.companyName || '',
      companyLogo: appSettings.companyLogo || '',
    });
    setFifoCostBasis(appSettings.fifoCostBasis || 'EX_GST');
    if (!roleModulesDirtyRef.current) {
      setRoleModules(buildRoleModulesState(appSettings));
    }
  }, [appSettings.appName, appSettings.companyName, appSettings.companyLogo, appSettings.roleModules, appSettings.fifoCostBasis]);

  const handleRoleModulesChange = (next) => {
    roleModulesDirtyRef.current = true;
    setRoleModulesDirty(true);
    setRoleModules(next);
  };

  const chooseFolder = async () => {
    const selected = await window.electronAPI?.selectBackupFolder?.();
    if (selected) {
      setFolder(selected);
      await updateSettings({ backupDir: selected });
    }
  };

  const chooseDatabaseLocation = async () => {
    const selected = await window.electronAPI?.selectDatabaseLocation?.();
    if (!selected) return;
    try {
      await updateAppSettings({ customDatabasePath: selected }).unwrap();
      setDatabasePath(selected);
      enqueueSnackbar('Database location saved. Restart the app to apply.', { variant: 'info' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to save database location'), { variant: 'error' });
    }
  };

  const resetDatabaseLocation = async () => {
    try {
      await updateAppSettings({ customDatabasePath: '' }).unwrap();
      setDatabasePath('');
      enqueueSnackbar('Database location reset. Restart the app to use the default location.', { variant: 'info' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to reset database location'), { variant: 'error' });
    }
  };

  const restartApp = async () => {
    await window.electronAPI?.restartApp?.();
  };

  const handleLoadDemoSeed = async (reset = false) => {
    if (reset && !window.confirm('This will delete existing purchases and sales, then load sample data. Continue?')) {
      return;
    }
    try {
      const result = await loadDemoSeed({ reset }).unwrap();
      const message = result?.data?.message || result?.message || 'Sample data loaded';
      enqueueSnackbar(message, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to load sample data'), { variant: 'error' });
    }
  };

  const handleRestoreBackup = async () => {
    const selected = await window.electronAPI?.selectBackupFile?.();
    if (!selected) return;
    if (!window.confirm('Restore will replace the current database with the selected backup. A safety backup is created first. Continue?')) {
      return;
    }
    try {
      await restoreBackup({ backupFilePath: selected }).unwrap();
      enqueueSnackbar('Backup restored. Restart the app if data looks stale.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to restore backup'), { variant: 'error' });
    }
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (file.size > 500000) {
      setBrandErrors((prev) => ({ ...prev, companyLogo: 'Logo must be under 500 KB' }));
      return;
    }
    clearFieldError(setBrandErrors, 'companyLogo');
    const reader = new FileReader();
    reader.onload = () => setBrandForm((f) => ({ ...f, companyLogo: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    const nextErrors = {};
    if (isSuperAdmin && brandForm.appName?.length > 120) {
      nextErrors.appName = 'App name must be at most 120 characters';
    }
    setBrandErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const payload = {
        companyName: brandForm.companyName,
        companyLogo: brandForm.companyLogo,
      };
      if (isSuperAdmin) {
        payload.appName = brandForm.appName;
      }
      await updateAppSettings(payload).unwrap();
      setBrandErrors({});
      enqueueSnackbar('Branding updated', { variant: 'success' });
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) setBrandErrors(apiErrors);
      else enqueueSnackbar(formatApiError(err, 'Failed to save branding'), { variant: 'error' });
    }
  };

  const saveRoleModules = async () => {
    const payload = buildRoleModulesPayload(roleModules || {});
    if (!Object.keys(payload).length) {
      enqueueSnackbar('No role access rules to save', { variant: 'error' });
      return;
    }
    try {
      await updateRoleModules(payload).unwrap();
      roleModulesDirtyRef.current = false;
      setRoleModulesDirty(false);
      setRoleModules(payload);
      enqueueSnackbar('Role module access updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to save role settings'), { variant: 'error' });
    }
  };

  const saveFifoSettings = async () => {
    try {
      await updateAppSettings({ fifoCostBasis }).unwrap();
      enqueueSnackbar('FIFO cost basis updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to save FIFO settings'), { variant: 'error' });
    }
  };

  const saveAppToggle = async (patch, successMessage) => {
    try {
      await updateAppSettings(patch).unwrap();
      enqueueSnackbar(successMessage, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(formatApiError(err, 'Failed to update setting'), { variant: 'error' });
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Settings"
        subtitle="Branding, role access, CRM module, and automated backups."
      />

      <Stack spacing={layout.listPageGap}>
        <SectionCard title="Branding" subtitle="App name and company logo shown in the sidebar and login screen">
          <Stack spacing={2.5}>
            <AppBrand {...brandForm} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="App display name"
                value={brandForm.appName}
                onChange={(e) => { setBrandForm({ ...brandForm, appName: e.target.value }); clearFieldError(setBrandErrors, 'appName'); }}
                error={Boolean(brandErrors.appName)}
                helperText={brandErrors.appName || (isSuperAdmin
                  ? 'Shown in sidebar header and login page for all users'
                  : 'Only Super Admin can change the app display name')}
                InputProps={{ readOnly: !canUpdate || !isSuperAdmin }}
              />
              <TextField
                fullWidth
                label="Company name"
                value={brandForm.companyName}
                onChange={(e) => setBrandForm({ ...brandForm, companyName: e.target.value })}
                helperText="Shown below app name when different"
                InputProps={{ readOnly: !canUpdate }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              {canUpdate && (
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                {brandForm.companyLogo ? 'Change logo' : 'Upload logo'}
                <input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
              </Button>
              )}
              {canUpdate && brandForm.companyLogo && (
                <Button color="inherit" onClick={() => setBrandForm({ ...brandForm, companyLogo: '' })}>Remove logo</Button>
              )}
              {brandErrors.companyLogo && (
                <Typography variant="caption" color="error">{brandErrors.companyLogo}</Typography>
              )}
              {canUpdate && (
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveBranding} disabled={savingApp}>
                Save branding
              </Button>
              )}
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Inventory & FIFO"
          subtitle="Gross profit is always calculated ex-GST (sale value − FIFO purchase cost). This setting controls which cost rate is shown in FIFO previews."
        >
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="FIFO cost basis"
              value={fifoCostBasis}
              onChange={(e) => setFifoCostBasis(e.target.value)}
              helperText={isSuperAdmin
                ? 'Gross profit uses ex-GST sale value minus ex-GST FIFO cost. This setting only affects FIFO preview display rates.'
                : 'Only Super Admin can change the FIFO cost basis'}
              InputProps={{ readOnly: !canUpdate || !isSuperAdmin }}
            >
              <MenuItem value="EX_GST">Exclude GST (pre-tax landed cost)</MenuItem>
              <MenuItem value="INC_GST">Include GST (tax-inclusive landed cost)</MenuItem>
            </TextField>
            {canUpdate && isSuperAdmin && (
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveFifoSettings} disabled={savingApp}>
                Save FIFO settings
              </Button>
            )}
          </Stack>
        </SectionCard>

        <SectionCard title="Role hierarchy" subtitle="Higher roles inherit broader system control. Module access can be customized per role below.">
          <Stack spacing={1.5}>
            {[...ROLES].sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map((role, index) => (
              <Stack key={role} direction="row" spacing={2} alignItems="center">
                <Chip label={`Level ${ROLE_HIERARCHY[role]}`} size="small" color={index === 0 ? 'primary' : 'default'} />
                <Typography fontWeight={700}>{ROLE_LABELS[role]}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {['SUPER_ADMIN', 'ADMIN'].includes(role) ? 'Full access to all modules' : 'Configurable module access'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Module access by role"
          subtitle="Control which modules Finance, Operations, and Read Only users can see"
          action={canUpdate ? (
            <Button
              variant="contained"
              color={roleModulesDirty ? 'secondary' : 'primary'}
              startIcon={<SaveIcon />}
              onClick={saveRoleModules}
              disabled={savingRoles}
            >
              {roleModulesDirty ? 'Save access rules (unsaved)' : 'Save access rules'}
            </Button>
          ) : null}
        >
          <RoleModuleMatrix value={roleModules} onChange={handleRoleModulesChange} disabled={!canUpdate} />
        </SectionCard>

        <SectionCard title="Application" subtitle="Module preferences">
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(appSettings.crmEnabled)}
                  onChange={(e) => saveAppToggle({ crmEnabled: e.target.checked }, 'CRM setting updated')}
                  disabled={!canUpdate}
                />
              }
              label="Enable CRM module (Leads & Activities)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={appSettings.autoBackupEnabled !== false}
                  onChange={(e) => saveAppToggle({ autoBackupEnabled: e.target.checked }, 'Backup setting updated')}
                  disabled={!canUpdate}
                />
              }
              label="Enable automatic monthly backups"
            />
          </Stack>
        </SectionCard>

        {canUpdate && (
          <SectionCard
            title="Sample data"
            subtitle="Load demo masters, purchases, and sales for training and testing"
          >
            <Stack spacing={2}>
              <Alert severity="info">
                Creates demo users (password Demo@123), coal qualities, suppliers, customers, purchases, and sales.
                Skips if purchase data already exists unless you reset.
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<ScienceIcon />}
                  onClick={() => handleLoadDemoSeed(false)}
                  disabled={loadingDemo}
                >
                  {loadingDemo ? 'Loading...' : 'Load sample data'}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleLoadDemoSeed(true)}
                  disabled={loadingDemo}
                >
                  Reset &amp; load sample
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        )}

        <SectionCard
          title="Database location"
          subtitle="Use a portable database file on USB or an external drive for offline multi-PC sharing"
        >
          <Stack spacing={2}>
            <Alert severity="warning">
              When the database is on a removable drive, open the app on only one PC at a time.
              Close the app before moving the drive to another computer.
            </Alert>
            <TextField
              label="Database file"
              value={databasePath || 'Default (Application Support)'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            {canUpdate && window.electronAPI && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="outlined" startIcon={<StorageIcon />} onClick={chooseDatabaseLocation}>
                  Choose location
                </Button>
                <Button variant="outlined" onClick={resetDatabaseLocation}>
                  Use default location
                </Button>
                <Button variant="contained" startIcon={<RestartAltIcon />} onClick={restartApp}>
                  Restart app
                </Button>
              </Stack>
            )}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Automatic Database Backups"
          subtitle={`${resolveAppName(appSettings.appName)} creates a monthly full backup of your SQLite database and uploaded documents.`}
          action={<Chip label="Keeps last 12 months" color="primary" />}
        >
          <Stack spacing={2}>
            <Alert severity="info">
              Backups run automatically on the first day of each month when enabled.
            </Alert>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                label="Backup folder"
                value={folder}
                fullWidth
                InputProps={{ readOnly: true }}
                disabled={settingsLoading || saving}
              />
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={chooseFolder}
                disabled={!canUpdate || !window.electronAPI || saving}
              >
                Choose
              </Button>
              <Button
                variant="contained"
                startIcon={<BackupIcon />}
                onClick={() => runBackup()}
                disabled={!canUpdate || backingUp}
              >
                {backingUp ? 'Backing up...' : 'Back up now'}
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestoreIcon />}
                onClick={handleRestoreBackup}
                disabled={!canUpdate || restoring || !window.electronAPI}
              >
                {restoring ? 'Restoring...' : 'Restore from backup'}
              </Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Typography color="text.secondary">
                Last backup: <strong>{formatDateTime(settings?.lastBackupAt)}</strong>
              </Typography>
              <Typography color="text.secondary">
                Database: <strong>{settings?.databasePath || '-'}</strong>
              </Typography>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard title="Backup History" subtitle="Newest backups are retained automatically.">
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {history.length === 0 && (
              <Typography color="text.secondary">No backups created yet.</Typography>
            )}
            {history.map((item) => (
              <Stack
                key={item.filePath || item.createdAt}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography fontWeight={800}>{item.filename}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.filePath}</Typography>
                </Box>
                <Typography color="text.secondary">{formatDateTime(item.createdAt)}</Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      </Stack>
    </PageLayout>
  );
}
