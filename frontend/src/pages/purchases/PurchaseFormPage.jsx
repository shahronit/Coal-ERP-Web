import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, MenuItem, IconButton, Paper, Divider, Stack, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
  useCreatePurchaseMutation, useGetPurchaseQuery, useUpdatePurchaseMutation, useConfirmPurchaseMutation,
  useListQualitiesQuery, useListExpenseTypesQuery, useListIncomeTypesQuery, useListTaxConfigsQuery,
} from '../../store/api/services';
import MasterSelect from '../../components/MasterSelect';
import DateField from '../../components/DateField';
import PageLayout from '../../components/PageLayout';
import PageHeader from '../../components/PageHeader';
import PurchaseBillPreview from '../../components/PurchaseBillPreview';
import LineGstFields from '../../components/LineGstFields';
import { MASTER_LIST_HOOKS } from '../../utils/masterHooks';
import AdjustmentRows from '../../components/AdjustmentRows';
import { buildPurchaseBillLines } from '../../utils/purchaseBillPreview';
import { calcPurchasePreview } from '../../utils/constants';
import { mapPurchaseAdjustmentFromApi, serializeAdjustment } from '../../utils/adjustmentForm';
import { useCrudAccess } from '../../hooks/usePermissions';
import { mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { validatePurchaseForm } from '../../utils/tradingValidation';
import { formPaperSx } from '../../theme/tokens';
import { useTheme } from '@mui/material/styles';

const emptyLine = () => ({
  qualityId: '', truckNumber: '', weight: '', rate: '', freight: 0, additionalExpenses: 0,
  applyGst: false, taxConfigurationId: '', gstRate: 18,
});

export default function PurchaseFormPage() {
  const { t } = useTranslation(['common', 'pages']);
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { canCreate, canUpdate } = useCrudAccess('purchases');
  const canWrite = isEdit ? canUpdate : canCreate;
  const theme = useTheme();

  const { data: purchaseData } = useGetPurchaseQuery(id, { skip: !isEdit });

  const { data: qualitiesData } = useListQualitiesQuery({ limit: 200 });
  const { data: expenseTypesData } = useListExpenseTypesQuery({ limit: 200 });
  const { data: incomeTypesData } = useListIncomeTypesQuery({ limit: 200 });
  const { data: taxConfigsData } = useListTaxConfigsQuery({ limit: 100, isActive: true });

  const [createPurchase] = useCreatePurchaseMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();
  const [confirmPurchase] = useConfirmPurchaseMutation();

  const [form, setForm] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseType: 'DIRECT',
    purchaseBatchId: '',
    supplierId: '',
    locationId: '',
    truckNumber: '',
    notes: '',
    lineItems: [emptyLine()],
    expenseAdjustments: [],
    incomeAdjustments: [],
  });
  const [errors, setErrors] = useState({});

  const isIndirect = form.purchaseType === 'INDIRECT';
  const isConfirmed = purchaseData?.data?.status === 'CONFIRMED';

  useEffect(() => {
    if (purchaseData?.data) {
      const p = purchaseData.data;
      setForm({
        purchaseDate: p.purchaseDate?.split('T')[0],
        purchaseType: p.purchaseType || 'DIRECT',
        purchaseBatchId: p.purchaseBatchId || '',
        supplierId: p.supplierId,
        locationId: p.locationId || '',
        truckNumber: p.truckNumber || '',
        notes: p.notes || '',
        lineItems: p.lineItems?.map((l) => ({
          id: l.id,
          qualityId: l.qualityId,
          qualityName: l.quality?.name,
          truckNumber: l.truckNumber || '',
          weight: parseFloat(l.weight),
          rate: parseFloat(l.rate),
          freight: parseFloat(l.freight) || 0,
          additionalExpenses: parseFloat(l.additionalExpenses) || 0,
          applyGst: l.applyGst === true,
          taxConfigurationId: l.taxConfigurationId || '',
          gstRate: parseFloat(l.gstRate) || 18,
        })) || [emptyLine()],
        incomeAdjustments: p.incomeAdjustments?.map((a) => mapPurchaseAdjustmentFromApi(
          a,
          p.lineItems || [],
          'incomeTypeId',
          'purchaseLineItemId',
          'incomeTypeName',
          'incomeType',
        )) || [],
        expenseAdjustments: p.expenseAdjustments?.map((a) => mapPurchaseAdjustmentFromApi(
          a,
          p.lineItems || [],
          'expenseTypeId',
          'purchaseLineItemId',
          'expenseTypeName',
          'expenseType',
        )) || [],
      });
    }
  }, [purchaseData]);

  const { rows: billRows, preview } = useMemo(() => buildPurchaseBillLines({
    lineItems: form.lineItems,
    expenseAdjustments: form.expenseAdjustments,
    incomeAdjustments: form.incomeAdjustments,
    isIndirect,
    qualities: qualitiesData?.data || [],
    expenseTypes: expenseTypesData?.data || [],
    incomeTypes: incomeTypesData?.data || [],
  }), [form.lineItems, form.expenseAdjustments, form.incomeAdjustments, isIndirect, qualitiesData, expenseTypesData, incomeTypesData]);

  const linePreview = useMemo(() => calcPurchasePreview(
    form.lineItems,
    form.expenseAdjustments,
    form.incomeAdjustments,
    isIndirect,
  ), [form.lineItems, form.expenseAdjustments, form.incomeAdjustments, isIndirect]);

  const updateLine = (idx, fieldOrPatch, value) => {
    const lines = [...form.lineItems];
    const patch = typeof fieldOrPatch === 'object'
      ? fieldOrPatch
      : { [fieldOrPatch]: value };
    lines[idx] = { ...lines[idx], ...patch };
    setForm({ ...form, lineItems: lines });
    Object.keys(patch).forEach((key) => clearFieldError(setErrors, `lineItems.${idx}.${key}`));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) return;

    const nextErrors = validatePurchaseForm(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const payload = {
        ...form,
        purchaseBatchId: form.purchaseBatchId || null,
        locationId: form.locationId || null,
        lineItems: form.lineItems.map((l) => ({
          ...l,
          weight: Number(l.weight),
          rate: Number(l.rate),
          freight: isIndirect ? 0 : (Number(l.freight) || 0),
          additionalExpenses: isIndirect ? 0 : (Number(l.additionalExpenses) || 0),
          applyGst: isIndirect ? false : l.applyGst === true,
          taxConfigurationId: isIndirect ? null : (l.taxConfigurationId || null),
          gstRate: isIndirect ? 0 : (l.applyGst === true ? (Number(l.gstRate) || 0) : 0),
          truckNumber: l.truckNumber || null,
        })),
        expenseAdjustments: form.expenseAdjustments
          .filter((a) => a.expenseTypeId && a.value)
          .map(serializeAdjustment),
        incomeAdjustments: form.incomeAdjustments
          .filter((a) => a.incomeTypeId && a.value)
          .map(serializeAdjustment),
      };
      if (isEdit) {
        await updatePurchase({ id, ...payload }).unwrap();
        enqueueSnackbar(t('messages.updated'), { variant: 'success' });
      } else {
        const res = await createPurchase(payload).unwrap();
        enqueueSnackbar(t('messages.created'), { variant: 'success' });
        navigate(`/purchases/${res.data.id}`);
      }
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(err.data?.message || t('messages.errorSaving'), { variant: 'error' });
      }
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmPurchase(id).unwrap();
      enqueueSnackbar(t('messages.purchaseConfirmed'), { variant: 'success' });
      navigate('/purchases');
    } catch (err) {
      enqueueSnackbar(err.data?.message || t('messages.failed'), { variant: 'error' });
    }
  };

  return (
    <PageLayout>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')} sx={{ alignSelf: 'flex-start' }}>
        {t('actions.back')}
      </Button>
      <PageHeader title={isEdit ? 'Purchase Details' : 'New Coal Purchase'} />
      {isConfirmed && (
        <Alert severity="info">
          This purchase is confirmed. You can edit all fields — stock (FIFO) will be rebuilt automatically unless stock from this bill has already been sold.
        </Alert>
      )}
      <Paper sx={formPaperSx(theme)}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField select fullWidth label="Purchase Type" value={form.purchaseType} onChange={(e) => setForm({ ...form, purchaseType: e.target.value })} disabled={!canWrite}>
                {['DIRECT', 'INDIRECT'].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DateField
                fullWidth
                label="Date"
                required
                value={form.purchaseDate}
                onChange={(e) => { setForm({ ...form, purchaseDate: e.target.value }); clearFieldError(setErrors, 'purchaseDate'); }}
                error={Boolean(errors.purchaseDate)}
                helperText={errors.purchaseDate}
                disabled={!canWrite}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect
                masterType="suppliers"
                label="Supplier"
                value={form.supplierId}
                onChange={(v) => { setForm({ ...form, supplierId: v }); clearFieldError(setErrors, 'supplierId'); }}
                required
                error={Boolean(errors.supplierId)}
                helperText={errors.supplierId}
                useListQuery={MASTER_LIST_HOOKS.suppliers}
                disabled={!canWrite}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect masterType="purchase-batches" label="Purchase Batch" value={form.purchaseBatchId} onChange={(v) => setForm({ ...form, purchaseBatchId: v })} allowNone useListQuery={MASTER_LIST_HOOKS['purchase-batches']} disabled={!canWrite} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect masterType="locations" label="Location" value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} useListQuery={MASTER_LIST_HOOKS.locations} disabled={!canWrite} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth label="Truck Number" value={form.truckNumber} onChange={(e) => setForm({ ...form, truckNumber: e.target.value })} disabled={!canWrite} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Coal Lines</Typography>
          {isIndirect && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Indirect purchase: line freight, expenses, and GST are excluded. Add GST via expense heads below.
            </Typography>
          )}
          {errors.lineItems && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>{errors.lineItems}</Typography>
          )}
          {form.lineItems.map((line, idx) => (
            <Grid container spacing={2} key={idx} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <MasterSelect
                  masterType="coal-qualities"
                  label="Coal Quality"
                  value={line.qualityId}
                  onChange={(v) => updateLine(idx, 'qualityId', v)}
                  required
                  size="small"
                  error={Boolean(errors[`lineItems.${idx}.qualityId`])}
                  helperText={errors[`lineItems.${idx}.qualityId`]}
                  useListQuery={MASTER_LIST_HOOKS['coal-qualities']}
                  disabled={!canWrite}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  fullWidth
                  label="Weight (MT)"
                  type="number"
                  required
                  value={line.weight}
                  onChange={(e) => updateLine(idx, 'weight', e.target.value)}
                  size="small"
                  error={Boolean(errors[`lineItems.${idx}.weight`])}
                  helperText={errors[`lineItems.${idx}.weight`]}
                  disabled={!canWrite}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  fullWidth
                  label="Rate (PMT)"
                  type="number"
                  required
                  value={line.rate}
                  onChange={(e) => updateLine(idx, 'rate', e.target.value)}
                  size="small"
                  error={Boolean(errors[`lineItems.${idx}.rate`])}
                  helperText={errors[`lineItems.${idx}.rate`]}
                  disabled={!canWrite}
                />
              </Grid>
              {!isIndirect && (
                <>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <TextField fullWidth label="Freight" type="number" value={line.freight} onChange={(e) => updateLine(idx, 'freight', e.target.value)} size="small" disabled={!canWrite} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <TextField fullWidth label="Expenses" type="number" value={line.additionalExpenses} onChange={(e) => updateLine(idx, 'additionalExpenses', e.target.value)} size="small" disabled={!canWrite} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <LineGstFields
                      inline
                      line={line}
                      onChange={(patch) => updateLine(idx, patch)}
                      disabled={!canWrite}
                      isIndirect={isIndirect}
                      taxConfigs={taxConfigsData?.data || []}
                      gstAmount={linePreview.linePreviews?.[idx]?.gstAmount || 0}
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, sm: 1 }}>
                <IconButton color="error" onClick={() => setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== idx) })} disabled={form.lineItems.length === 1 || !canWrite}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          {canWrite && (
            <Button startIcon={<AddIcon />} onClick={() => setForm({ ...form, lineItems: [...form.lineItems, emptyLine()] })} sx={{ mb: 2 }}>Add Line</Button>
          )}

          <Typography variant="h6" gutterBottom>{t('adjustments.expenseAdjustments')}</Typography>
          <AdjustmentRows
            kind="expense"
            items={form.expenseAdjustments}
            onChange={(expenseAdjustments) => setForm({ ...form, expenseAdjustments })}
            grossSubtotal={preview.grossSubtotal}
            lineItems={form.lineItems}
            disabled={!canWrite}
            fieldPrefix="expenseAdjustments"
            errors={errors}
          />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>{t('adjustments.incomeAdjustments')}</Typography>
          <AdjustmentRows
            kind="income"
            items={form.incomeAdjustments}
            onChange={(incomeAdjustments) => setForm({ ...form, incomeAdjustments })}
            grossSubtotal={preview.grossSubtotal}
            lineItems={form.lineItems}
            disabled={!canWrite}
            fieldPrefix="incomeAdjustments"
            errors={errors}
          />

          <PurchaseBillPreview
            title={isEdit ? 'Purchase Cost Bill' : 'Purchase Cost Bill (Preview)'}
            rows={billRows}
            purchaseType={form.purchaseType}
            purchaseDate={form.purchaseDate}
            documentNumber={purchaseData?.data?.purchaseNumber}
            meta={{
              supplier: purchaseData?.data?.supplier?.name,
              location: purchaseData?.data?.location?.name,
              batch: purchaseData?.data?.purchaseBatch
                ? `${purchaseData.data.purchaseBatch.code} — ${purchaseData.data.purchaseBatch.name}`
                : undefined,
              truckNumber: form.truckNumber,
              notes: form.notes,
              status: purchaseData?.data?.status,
              totalWeight: preview.totalWeight,
            }}
          />

          <TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} sx={{ mb: 2 }} disabled={!canWrite} />
          <Stack direction="row" spacing={2}>
            {canWrite && (
              <Button type="submit" variant="contained">
                {isEdit ? (isConfirmed ? 'Update Confirmed Purchase' : 'Update Purchase') : 'Create Purchase'}
              </Button>
            )}
            {canUpdate && isEdit && !isConfirmed && (
              <Button variant="outlined" color="success" onClick={handleConfirm}>Confirm & Add to Stock</Button>
            )}
          </Stack>
        </Box>
      </Paper>
    </PageLayout>
  );
}
