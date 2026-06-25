import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button, Chip, TextField, Grid, MenuItem, Stack, Typography, FormControlLabel, Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import FormDialog from '../../components/FormDialog';
import { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../store/api/services';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getAssignableRoles, ROLE_HIERARCHY, ROLE_LABELS } from '../../utils/roles';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';
import { formatApiError } from '../../utils/formatApiError';
import { validateFields, mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validators } from '../../utils/validation';

const emptyForm = () => ({ name: '', email: '', password: '', role: 'READ_ONLY', isActive: true });

const userRules = (t, isEdit) => ({
  name: (values) => validators.nameMin(values.name, t),
  email: (values) => validators.email(values.email, t),
  password: (values) => {
    if (isEdit && !values.password) return null;
    return validators.passwordMin(values.password, t, { required: !isEdit });
  },
  role: (values) => (values.role ? null : t('validation.roleRequired')),
});

export default function UsersPage() {
  const { t } = useTranslation(['common', 'pages']);
  const currentUser = useSelector(selectCurrentUser);
  const assignableRoles = useMemo(() => getAssignableRoles(currentUser?.role), [currentUser?.role]);
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const { data, isLoading } = useListUsersQuery({ page: page + 1, limit: 10, ...query });
  const [create] = useCreateUserMutation();
  const [update] = useUpdateUserMutation();
  const [remove] = useDeleteUserMutation();
  const { enqueueSnackbar } = useSnackbar();
  const { canCreate, canUpdate, canDelete } = useCrudAccess('users');

  const openCreate = () => {
    setEditRow(null);
    setForm({ ...emptyForm(), role: assignableRoles[assignableRoles.length - 1] || 'READ_ONLY' });
    setErrors({});
    setDialog(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({ name: row.name, email: row.email, password: '', role: row.role, isActive: row.isActive });
    setErrors({});
    setDialog(true);
  };

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearFieldError(setErrors, field);
  };

  const handleSave = async () => {
    const nextErrors = validateFields(userRules(t, Boolean(editRow)), form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!assignableRoles.includes(form.role)) {
      setErrors({ role: 'You are not allowed to assign this role' });
      return;
    }

    try {
      if (editRow) {
        const payload = { id: editRow.id, name: form.name.trim(), email: form.email.trim(), role: form.role, isActive: form.isActive };
        if (form.password) payload.password = form.password;
        await update(payload).unwrap();
        enqueueSnackbar(t('messages.updated'), { variant: 'success' });
      } else {
        await create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          isActive: form.isActive,
        }).unwrap();
        enqueueSnackbar(t('messages.userCreated'), { variant: 'success' });
        setPage(0);
      }
      setDialog(false);
      setForm(emptyForm());
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(formatApiError(err, t('messages.failed')), { variant: 'error' });
      }
    }
  };

  const columns = [
    { field: 'name', headerName: t('fields.name') },
    { field: 'email', headerName: t('fields.email') },
    {
      field: 'role',
      headerName: t('fields.role'),
      render: (r) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={ROLE_LABELS[r.role] || r.role.replace('_', ' ')} />
          <Typography variant="caption" color="text.secondary">L{ROLE_HIERARCHY[r.role]}</Typography>
        </Stack>
      ),
    },
    { field: 'isActive', headerName: t('status.active'), render: r => r.isActive ? t('status.yes') : t('status.no') },
  ];

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title={t('users.title', { ns: 'pages' })}
        subtitle={t('users.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('users.add', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? openCreate : undefined}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0 }}>
        {assignableRoles.map((role) => (
          <Chip key={role} label={`${ROLE_LABELS[role]} (L${ROLE_HIERARCHY[role]})`} variant="outlined" size="small" />
        ))}
      </Stack>

      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        showDates={false}
        selects={[
          {
            key: 'role',
            label: 'Role',
            options: assignableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
          },
          {
            key: 'isActive',
            label: 'Status',
            options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }],
          },
        ]}
      />
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={isLoading}
        page={page}
        limit={10}
        total={data?.meta?.total || 0}
        onPageChange={setPage}
        onEdit={canUpdate ? openEdit : undefined}
        onDelete={canDelete ? async (row) => {
          if (!window.confirm(t('messages.deleteUserQuestion'))) return;
          try {
            await remove(row.id).unwrap();
            enqueueSnackbar(t('messages.deleted'), { variant: 'success' });
          } catch (err) {
            enqueueSnackbar(formatApiError(err, t('messages.failed')), { variant: 'error' });
          }
        } : undefined}
        actions={canUpdate || canDelete}
      />
      <FormDialog
        open={dialog}
        onClose={() => setDialog(false)}
        title={editRow ? t('actions.edit') : t('users.add', { ns: 'pages' })}
        onValidSubmit={handleSave}
        saveDisabled={!assignableRoles.length || !assignableRoles.includes(form.role) || (editRow ? !canUpdate : !canCreate)}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField
              fullWidth
              label={t('fields.name')}
              required
              value={form.name}
              onChange={setField('name')}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              label={t('fields.email')}
              required
              value={form.email}
              onChange={setField('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              label={editRow ? `${t('fields.password')} (leave blank to keep)` : t('fields.password')}
              type="password"
              required={!editRow}
              value={form.password}
              onChange={setField('password')}
              error={Boolean(errors.password)}
              helperText={errors.password}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              label={t('fields.role')}
              required
              value={form.role}
              onChange={setField('role')}
              error={Boolean(errors.role)}
              helperText={errors.role}
            >
              {assignableRoles.map(r => (
                <MenuItem key={r} value={r}>{ROLE_LABELS[r]} — Level {ROLE_HIERARCHY[r]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {editRow && (
            <Grid size={12}>
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                label={t('status.active')}
              />
            </Grid>
          )}
        </Grid>
      </FormDialog>
    </ListPageLayout>
  );
}
