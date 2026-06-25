import { useState } from 'react';
import { TextField, Grid } from '@mui/material';
import DateField from './DateField';
import FormDialog from './FormDialog';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { MASTER_CONFIGS } from '../utils/constants';
import {
  useCreatePartnerMutation, useCreateSupplierMutation, useCreateCustomerMutation,
  useCreateQualityMutation, useCreatePurchaseBatchMutation, useCreateSalesBatchMutation,
  useCreateLocationMutation, useCreateExpenseTypeMutation, useCreateIncomeTypeMutation,
  useCreateAssetTypeMutation, useCreateTaxMutation,
} from '../store/api/services';
import { mapApiErrorsToFields, clearFieldError } from '../utils/formErrors';
import { validateMasterForm, masterFieldsForType } from '../utils/masterValidation';
import { formatApiError } from '../utils/formatApiError';

const QUICK_CREATE_TYPES = [
  'partners', 'suppliers', 'customers', 'coal-qualities', 'purchase-batches', 'sales-batches',
  'locations', 'expense-types', 'income-types', 'asset-types', 'tax-configurations',
];

export default function QuickCreateDialog({ open, masterType, title, onClose, onCreated }) {
  const { t } = useTranslation('common');
  const { enqueueSnackbar } = useSnackbar();
  const config = MASTER_CONFIGS[masterType];
  const fields = masterFieldsForType(masterType, t).map((f) => ({
    ...f,
    required: f.required ?? (f.key === 'name' || f.key === 'code' || f.key === 'startDate' || f.key === 'gstRate' || f.key === 'effectiveFrom'),
  }));
  const [form, setForm] = useState({ name: '' });
  const [errors, setErrors] = useState({});

  const [createPartner, { isLoading: l1 }] = useCreatePartnerMutation();
  const [createSupplier, { isLoading: l2 }] = useCreateSupplierMutation();
  const [createCustomer, { isLoading: l3 }] = useCreateCustomerMutation();
  const [createQuality, { isLoading: l4 }] = useCreateQualityMutation();
  const [createPurchaseBatch, { isLoading: l5 }] = useCreatePurchaseBatchMutation();
  const [createSalesBatch, { isLoading: l6 }] = useCreateSalesBatchMutation();
  const [createLocation, { isLoading: l7 }] = useCreateLocationMutation();
  const [createExpenseType, { isLoading: l8 }] = useCreateExpenseTypeMutation();
  const [createIncomeType, { isLoading: l9 }] = useCreateIncomeTypeMutation();
  const [createAssetType, { isLoading: l10 }] = useCreateAssetTypeMutation();
  const [createTax, { isLoading: l11 }] = useCreateTaxMutation();

  const creators = {
    partners: createPartner,
    suppliers: createSupplier,
    customers: createCustomer,
    'coal-qualities': createQuality,
    'purchase-batches': createPurchaseBatch,
    'sales-batches': createSalesBatch,
    locations: createLocation,
    'expense-types': createExpenseType,
    'income-types': createIncomeType,
    'asset-types': createAssetType,
    'tax-configurations': createTax,
  };

  const create = creators[masterType];
  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11;

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    clearFieldError(setErrors, key);
  };

  const handleSave = async () => {
    if (!create) return;

    const nextErrors = validateMasterForm(fields, form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await create(payload).unwrap();
      enqueueSnackbar(`${config?.title || 'Record'} created`, { variant: 'success' });
      onCreated(res.data);
      setForm({ name: '' });
      setErrors({});
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(formatApiError(err, 'Failed to create'), { variant: 'error' });
      }
    }
  };

  if (!QUICK_CREATE_TYPES.includes(masterType)) return null;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={title}
      onValidSubmit={handleSave}
      loading={isLoading}
    >
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {fields.map((field) => (
          <Grid size={{ xs: 12, sm: field.type === 'date' ? 6 : 12 }} key={field.key}>
            {field.type === 'date' ? (
              <DateField
                fullWidth
                label={field.label}
                required={Boolean(field.required)}
                value={form[field.key] || ''}
                onChange={setField(field.key)}
                error={Boolean(errors[field.key])}
                helperText={errors[field.key]}
              />
            ) : (
              <TextField
                fullWidth
                label={field.label}
                type={field.type || 'text'}
                required={Boolean(field.required)}
                value={form[field.key] || ''}
                onChange={setField(field.key)}
                error={Boolean(errors[field.key])}
                helperText={errors[field.key]}
              />
            )}
          </Grid>
        ))}
      </Grid>
    </FormDialog>
  );
}
