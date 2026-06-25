import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, MenuItem, IconButton, Paper, Divider, Stack, Alert, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useCreateSaleMutation, useGetSaleQuery, usePreviewFifoMutation, useGetAppSettingsQuery, useListQualitiesQuery, useListExpenseTypesQuery, useListIncomeTypesQuery, useListTaxConfigsQuery } from '../../store/api/services';
import MasterSelect from '../../components/MasterSelect';
import DateField from '../../components/DateField';
import PageLayout from '../../components/PageLayout';
import PageHeader from '../../components/PageHeader';
import PurchaseBillPreview from '../../components/PurchaseBillPreview';
import LineGstFields from '../../components/LineGstFields';
import { MASTER_LIST_HOOKS } from '../../utils/masterHooks';
import AdjustmentRows from '../../components/AdjustmentRows';
import { buildSaleBillLines } from '../../utils/saleBillPreview';
import { calcSalePreview, formatCurrency } from '../../utils/constants';
import { useCrudAccess } from '../../hooks/usePermissions';
import { mapApiErrorsToFields, clearFieldError } from '../../utils/formErrors';
import { mapSaleAdjustmentFromApi, serializeAdjustment } from '../../utils/adjustmentForm';
import { validateSaleForm } from '../../utils/tradingValidation';
import { formPaperSx } from '../../theme/tokens';
import { useTheme } from '@mui/material/styles';

const emptyLine = () => ({
  qualityId: '', truckNumber: '', weight: '', rate: '', applyGst: false, taxConfigurationId: '', gstRate: 18,
});
const emptyFreight = () => ({ description: '', amount: '', truckNumber: '' });

const mapLegacySaleType = (type) => {
  if (type === 'DOMESTIC' || type === 'EXPORT') return 'DIRECT';
  return type || 'DIRECT';
};

export default function SaleFormPage() {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const isView = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { canCreate } = useCrudAccess('sales');
  const theme = useTheme();

  const { data: saleData } = useGetSaleQuery(id, { skip: !isView });
  const { data: appSettingsData } = useGetAppSettingsQuery(undefined, { skip: isView });
  const fifoCostBasis = appSettingsData?.data?.fifoCostBasis || 'EX_GST';
  const { data: qualitiesData } = useListQualitiesQuery({ limit: 200 });
  const { data: expenseTypesData } = useListExpenseTypesQuery({ limit: 200 });
  const { data: incomeTypesData } = useListIncomeTypesQuery({ limit: 200 });
  const { data: taxConfigsData } = useListTaxConfigsQuery({ limit: 100, isActive: true });
  const [createSale] = useCreateSaleMutation();
  const [previewFifo, { data: fifoData }] = usePreviewFifoMutation();

  const [form, setForm] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    saleType: 'DIRECT',
    salesBatchId: '',
    customerId: '',
    locationId: '',
    truckNumber: '',
    notes: '',
    lineItems: [emptyLine()],
    freightEntries: [],
    expenseAdjustments: [],
    incomeAdjustments: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (saleData?.data) {
      const s = saleData.data;
      setForm({
        saleDate: s.saleDate?.split('T')[0],
        saleType: mapLegacySaleType(s.saleType),
        salesBatchId: s.salesBatchId || '',
        customerId: s.customerId,
        locationId: '',
        truckNumber: s.truckNumber || '',
        notes: s.notes || '',
        lineItems: s.lineItems?.map((l) => ({
          id: l.id,
          qualityId: l.qualityId,
          qualityName: l.quality?.name,
          truckNumber: l.truckNumber || '',
          weight: parseFloat(l.weight),
          rate: parseFloat(l.rate),
          applyGst: l.applyGst === true,
          taxConfigurationId: l.taxConfigurationId || '',
          gstRate: parseFloat(l.gstRate) || 18,
        })) || [emptyLine()],
        freightEntries: s.freightEntries?.map((f) => ({
          description: f.description || '',
          amount: parseFloat(f.amount),
          truckNumber: f.truckNumber || '',
        })) || [],
        expenseAdjustments: s.expenseAdjustments?.map((a) => mapSaleAdjustmentFromApi(
          a,
          s.lineItems || [],
          'expenseTypeId',
          'saleLineItemId',
          'expenseTypeName',
          'expenseType',
        )) || [],
        incomeAdjustments: s.incomeAdjustments?.map((a) => mapSaleAdjustmentFromApi(
          a,
          s.lineItems || [],
          'incomeTypeId',
          'saleLineItemId',
          'incomeTypeName',
          'incomeType',
        )) || [],
      });
    }
  }, [saleData]);

  const isIndirect = form.saleType === 'INDIRECT';

  const { rows: billRows, preview } = useMemo(() => buildSaleBillLines({
    lineItems: form.lineItems,
    freightEntries: form.freightEntries,
    expenseAdjustments: form.expenseAdjustments,
    incomeAdjustments: form.incomeAdjustments,
    isIndirect,
    qualities: qualitiesData?.data || [],
    expenseTypes: expenseTypesData?.data || [],
    incomeTypes: incomeTypesData?.data || [],
  }), [form.lineItems, form.freightEntries, form.expenseAdjustments, form.incomeAdjustments, isIndirect, qualitiesData, expenseTypesData, incomeTypesData]);

  const linePreview = useMemo(() => calcSalePreview(
    form.lineItems,
    form.freightEntries,
    form.expenseAdjustments,
    form.incomeAdjustments,
    isIndirect,
  ), [form.lineItems, form.freightEntries, form.expenseAdjustments, form.incomeAdjustments, isIndirect]);

  const updateLine = (idx, fieldOrPatch, value) => {
    const lines = [...form.lineItems];
    const patch = typeof fieldOrPatch === 'object'
      ? fieldOrPatch
      : { [fieldOrPatch]: value };
    lines[idx] = { ...lines[idx], ...patch };
    setForm({ ...form, lineItems: lines });
    Object.keys(patch).forEach((key) => clearFieldError(setErrors, `lineItems.${idx}.${key}`));
  };

  const handlePreviewFifo = async () => {
    const validLines = form.lineItems.filter((l) => l.qualityId && Number(l.weight) > 0);
    if (!validLines.length) {
      enqueueSnackbar('Select coal quality and weight before FIFO preview', { variant: 'warning' });
      return;
    }
    try {
      await previewFifo({
        locationId: form.locationId || null,
        lineItems: validLines.map((l) => ({ qualityId: l.qualityId, weight: Number(l.weight) })),
      }).unwrap();
    } catch (err) {
      enqueueSnackbar(err.data?.message || 'FIFO preview failed', { variant: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView || !canCreate) return;

    const nextErrors = validateSaleForm(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const validLines = form.lineItems.filter((l) => l.qualityId && Number(l.weight) > 0 && Number(l.rate) > 0);
    try {
      const payload = {
        ...form,
        salesBatchId: form.salesBatchId || null,
        locationId: form.locationId || null,
        lineItems: validLines.map((l) => ({
          qualityId: l.qualityId,
          truckNumber: l.truckNumber || form.truckNumber || null,
          weight: Number(l.weight),
          rate: Number(l.rate),
          applyGst: isIndirect ? false : l.applyGst === true,
          taxConfigurationId: isIndirect ? null : (l.taxConfigurationId || null),
          gstRate: isIndirect ? 0 : (l.applyGst === true ? (Number(l.gstRate) || 0) : 0),
        })),
        freightEntries: isIndirect ? [] : form.freightEntries
          .filter((f) => f.amount)
          .map((f) => ({ ...f, amount: Number(f.amount) })),
        expenseAdjustments: form.expenseAdjustments
          .filter((a) => a.expenseTypeId && a.value)
          .map(serializeAdjustment),
        incomeAdjustments: form.incomeAdjustments
          .filter((a) => a.incomeTypeId && a.value)
          .map(serializeAdjustment),
      };
      await createSale(payload).unwrap();
      enqueueSnackbar('Sale created', { variant: 'success' });
      navigate('/sales');
    } catch (err) {
      const apiErrors = mapApiErrorsToFields(err?.data?.errors);
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        enqueueSnackbar(err.data?.message || 'Failed to save sale', { variant: 'error' });
      }
    }
  };

  return (
    <PageLayout>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ alignSelf: 'flex-start' }}>
        Back
      </Button>
      <PageHeader title={isView ? 'Sale Details' : 'New Coal Sale'} />
      <Paper sx={formPaperSx(theme)}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField select fullWidth label="Sale Type" value={form.saleType} onChange={(e) => setForm({ ...form, saleType: e.target.value })} disabled={isView}>
                {['DIRECT', 'INDIRECT'].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DateField
                fullWidth
                label="Date"
                required
                value={form.saleDate}
                onChange={(e) => { setForm({ ...form, saleDate: e.target.value }); clearFieldError(setErrors, 'saleDate'); }}
                disabled={isView}
                error={Boolean(errors.saleDate)}
                helperText={errors.saleDate}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect
                masterType="customers"
                label="Customer"
                value={form.customerId}
                onChange={(v) => { setForm({ ...form, customerId: v }); clearFieldError(setErrors, 'customerId'); }}
                required
                disabled={isView}
                error={Boolean(errors.customerId)}
                helperText={errors.customerId}
                useListQuery={MASTER_LIST_HOOKS.customers}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect masterType="sales-batches" label="Sales Batch" value={form.salesBatchId} onChange={(v) => setForm({ ...form, salesBatchId: v })} disabled={isView} allowNone useListQuery={MASTER_LIST_HOOKS['sales-batches']} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect masterType="locations" label="Stock Location" value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} disabled={isView} allowNone noneLabel="Any location" useListQuery={MASTER_LIST_HOOKS.locations} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth label="Truck Number" value={form.truckNumber} onChange={(e) => setForm({ ...form, truckNumber: e.target.value })} disabled={isView} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Add Entry</Typography>
          {isIndirect && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Indirect sale: freight and line GST are excluded. Add GST via expense heads below.
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
                  disabled={isView}
                  error={Boolean(errors[`lineItems.${idx}.qualityId`])}
                  helperText={errors[`lineItems.${idx}.qualityId`]}
                  useListQuery={MASTER_LIST_HOOKS['coal-qualities']}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  fullWidth
                  label="Qty (MT)"
                  type="number"
                  required
                  value={line.weight}
                  onChange={(e) => updateLine(idx, 'weight', e.target.value)}
                  size="small"
                  disabled={isView}
                  error={Boolean(errors[`lineItems.${idx}.weight`])}
                  helperText={errors[`lineItems.${idx}.weight`]}
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
                  disabled={isView}
                  error={Boolean(errors[`lineItems.${idx}.rate`])}
                  helperText={errors[`lineItems.${idx}.rate`]}
                />
              </Grid>
              {!isIndirect && (
                <Grid size={{ xs: 12, sm: 3 }}>
                  <LineGstFields
                    inline
                    line={line}
                    onChange={(patch) => updateLine(idx, patch)}
                    disabled={isView}
                    isIndirect={isIndirect}
                    taxConfigs={taxConfigsData?.data || []}
                    gstAmount={linePreview.linePreviews?.[idx]?.gstAmount || 0}
                  />
                </Grid>
              )}
              {!isView && (
                <Grid size={{ xs: 12, sm: 1 }}>
                  <IconButton color="error" onClick={() => setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== idx) })} disabled={form.lineItems.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          ))}
          {!isView && <Button startIcon={<AddIcon />} onClick={() => setForm({ ...form, lineItems: [...form.lineItems, emptyLine()] })} sx={{ mb: 2 }}>Add Entry</Button>}

          {!isIndirect && (
            <>
              <Typography variant="h6" gutterBottom>Freight Entries</Typography>
          {form.freightEntries.map((f, idx) => {
            const freightStarted = Boolean(f.description || f.amount || f.truckNumber);
            return (
            <Grid container spacing={2} key={idx} sx={{ mb: 1 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Description" value={f.description} onChange={(e) => {
                  const entries = [...form.freightEntries];
                  entries[idx] = { ...entries[idx], description: e.target.value };
                  setForm({ ...form, freightEntries: entries });
                }} disabled={isView} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField fullWidth size="small" label="Amount" type="number" required={freightStarted} value={f.amount} onChange={(e) => {
                  const entries = [...form.freightEntries];
                  entries[idx] = { ...entries[idx], amount: e.target.value };
                  setForm({ ...form, freightEntries: entries });
                }} disabled={isView} error={Boolean(errors[`freightEntries.${idx}.amount`])} helperText={errors[`freightEntries.${idx}.amount`]} />
              </Grid>
              {!isView && (
                <Grid size={{ xs: 12, sm: 1 }}>
                  <IconButton color="error" onClick={() => setForm({ ...form, freightEntries: form.freightEntries.filter((_, i) => i !== idx) })}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              )}
            </Grid>
            );
          })}
          {!isView && <Button startIcon={<AddIcon />} onClick={() => setForm({ ...form, freightEntries: [...form.freightEntries, emptyFreight()] })} sx={{ mb: 2 }}>Add Freight</Button>}
            </>
          )}

          <TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} sx={{ mb: 2, mt: 2 }} disabled={isView} />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>{t('adjustments.expenseAdjustments')}</Typography>
          <AdjustmentRows
            kind="expense"
            items={form.expenseAdjustments}
            onChange={(expenseAdjustments) => setForm({ ...form, expenseAdjustments })}
            grossSubtotal={preview.grossSubtotal}
            lineItems={form.lineItems}
            disabled={isView}
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
            disabled={isView}
            fieldPrefix="incomeAdjustments"
            errors={errors}
          />

          {!isView && (
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button variant="outlined" onClick={handlePreviewFifo}>Preview FIFO Consumption</Button>
            </Stack>
          )}

          {fifoData?.data && (
            <Box sx={{ mb: 2 }}>
              {fifoData.data.map((block, i) => {
                const saleLine = form.lineItems.filter((l) => l.qualityId && Number(l.weight) > 0)[i];
                const lineGrossPreview = saleLine
                  ? calcSalePreview([saleLine], form.freightEntries, form.expenseAdjustments, form.incomeAdjustments, isIndirect).grossAmount
                  : 0;
                const estProfit = lineGrossPreview - (block.totalAllocatedCost || 0);
                return (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      FIFO preview {block.shortfall > 0 ? `(Shortfall: ${block.shortfall} MT)` : ''}
                    </Typography>
                    <Table size="small" sx={{ mt: 1 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Purchase</TableCell>
                          <TableCell>Consume MT</TableCell>
                          <TableCell>Cost/MT (ex-GST)</TableCell>
                          <TableCell>Cost/MT (inc-GST)</TableCell>
                          <TableCell>Allocated Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(block.preview || []).map((p) => (
                          <TableRow key={p.batchId}>
                            <TableCell>{p.purchaseNumber}</TableCell>
                            <TableCell>{p.consumeMT}</TableCell>
                            <TableCell>{formatCurrency(p.costPerMT)}</TableCell>
                            <TableCell>{formatCurrency(p.costPerMTIncGst)}</TableCell>
                            <TableCell>{formatCurrency(p.allocatedCost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          Avg FIFO rate (ex-GST): {formatCurrency(block.averageCostPerMTExGst || 0)}/MT
                        </Typography>
                        <Typography variant="body2">
                          Avg FIFO rate (inc-GST): {formatCurrency(block.averageCostPerMTIncGst || 0)}/MT
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          Active basis ({fifoCostBasis === 'INC_GST' ? 'inc-GST' : 'ex-GST'}):
                          {' '}{formatCurrency(block.averageCostPerMT || 0)}/MT
                        </Typography>
                        <Typography variant="body2">
                          Total COGS: {formatCurrency(block.totalAllocatedCost || 0)}
                        </Typography>
                        {lineGrossPreview > 0 && (
                          <Typography variant="body2" fontWeight={700}>
                            Est. gross profit (ex-GST sale − COGS): {formatCurrency(estProfit)}
                          </Typography>
                        )}
                      </Stack>
                    </Alert>
                  </Box>
                );
              })}
            </Box>
          )}

          <PurchaseBillPreview
            title={isView ? 'Sale Invoice' : 'Sale Invoice (Preview)'}
            rows={billRows}
            purchaseType={form.saleType}
            purchaseDate={form.saleDate}
            documentNumber={saleData?.data?.saleNumber}
            footerNote="Sale amount includes rate, freight, document expense/income heads, and GST where applicable."
            meta={{
              customer: saleData?.data?.customer?.name,
              location: saleData?.data?.location?.name,
              batch: saleData?.data?.salesBatch
                ? `${saleData.data.salesBatch.code} — ${saleData.data.salesBatch.name}`
                : undefined,
              truckNumber: form.truckNumber,
              notes: form.notes,
              status: saleData?.data?.status,
              totalWeight: preview.totalWeight,
            }}
          />

          {!isView && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="body2" fontWeight={600}>Before creating a sale:</Typography>
                <Typography variant="body2">1. Confirm a purchase first (Purchases → open draft → Confirm &amp; Add to Stock)</Typography>
                <Typography variant="body2">2. Use the same coal quality and location as the confirmed purchase</Typography>
                <Typography variant="body2">3. Leave Stock Location as &quot;Any location&quot; unless you need a specific yard</Typography>
              </Stack>
            </Alert>
          )}

          {!isView && canCreate && <Button type="submit" variant="contained">Create Sale</Button>}
        </Box>
      </Paper>
    </PageLayout>
  );
}
