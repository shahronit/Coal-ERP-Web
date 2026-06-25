import {
  Box, Button, Grid, IconButton, MenuItem, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import MasterSelect from './MasterSelect';
import { MASTER_LIST_HOOKS } from '../utils/masterHooks';
import { formatCurrency, resolveAdjustmentPreview } from '../utils/constants';

export const emptyExpenseAdjustment = () => ({
  expenseTypeId: '', basisType: 'FLAT', value: '', lineIndex: '', description: '',
});

export const emptyIncomeAdjustment = () => ({
  incomeTypeId: '', basisType: 'FLAT', value: '', lineIndex: '', description: '',
});

const valueLabelKey = (basisType) => {
  if (basisType === 'PERCENT') return 'percentValue';
  if (basisType === 'PER_MT') return 'perMtValue';
  return 'flatValue';
};

export default function AdjustmentRows({
  kind = 'expense',
  items = [],
  onChange,
  grossSubtotal = 0,
  lineItems = [],
  disabled = false,
  fieldPrefix = '',
  errors = {},
}) {
  const { t } = useTranslation('common');
  const isExpense = kind === 'expense';
  const masterType = isExpense ? 'expense-types' : 'income-types';
  const typeKey = isExpense ? 'expenseTypeId' : 'incomeTypeId';
  const emptyRow = isExpense ? emptyExpenseAdjustment : emptyIncomeAdjustment;

  const coalLineOptions = lineItems
    .map((line, index) => ({
      index,
      label: line.qualityName || line.quality?.name || `${t('adjustments.lineFallback', { n: index + 1 })}`,
      weight: Number(line.weight) || 0,
    }))
    .filter((line) => line.weight > 0);

  const fieldError = (idx, key) => {
    const path = fieldPrefix ? `${fieldPrefix}.${idx}.${key}` : `${idx}.${key}`;
    return errors[path] || '';
  };

  const rowStarted = (item) => item[typeKey] || item.value || item.description;

  const updateItem = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    if (patch.basisType && patch.basisType !== 'PER_MT') {
      next[idx].lineIndex = '';
    }
    onChange(next);
  };

  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <Box>
      {items.map((item, idx) => {
        const resolved = resolveAdjustmentPreview(item, grossSubtotal, lineItems);
        const basisType = item.basisType || 'FLAT';
        return (
          <Grid container spacing={2} key={idx} sx={{ mb: 1 }} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <MasterSelect
                masterType={masterType}
                label={isExpense ? t('adjustments.expenseType') : t('adjustments.incomeType')}
                value={item[typeKey]}
                onChange={(v) => updateItem(idx, { [typeKey]: v })}
                size="small"
                disabled={disabled}
                required={Boolean(rowStarted(item))}
                error={Boolean(fieldError(idx, typeKey))}
                helperText={fieldError(idx, typeKey)}
                useListQuery={MASTER_LIST_HOOKS[masterType]}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('adjustments.basis')}
                value={basisType}
                onChange={(e) => updateItem(idx, { basisType: e.target.value })}
                disabled={disabled}
              >
                <MenuItem value="FLAT">{t('adjustments.basisFlat')}</MenuItem>
                <MenuItem value="PERCENT">{t('adjustments.basisPercent')}</MenuItem>
                <MenuItem value="PER_MT">{t('adjustments.basisPerMt')}</MenuItem>
              </TextField>
            </Grid>
            {basisType === 'PER_MT' && (
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t('adjustments.linkedLine')}
                  value={item.lineIndex === '' || item.lineIndex == null ? '' : String(item.lineIndex)}
                  onChange={(e) => updateItem(idx, { lineIndex: e.target.value === '' ? '' : Number(e.target.value) })}
                  disabled={disabled}
                  required={Boolean(rowStarted(item))}
                  error={Boolean(fieldError(idx, 'lineIndex'))}
                  helperText={fieldError(idx, 'lineIndex') || (coalLineOptions.length === 0 ? t('adjustments.linkedLineHint') : '')}
                >
                  <MenuItem value="">{t('adjustments.selectLine')}</MenuItem>
                  {coalLineOptions.map((line) => (
                    <MenuItem key={line.index} value={String(line.index)}>
                      {line.label} ({line.weight} MT)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={t(`adjustments.${valueLabelKey(basisType)}`)}
                value={item.value}
                onChange={(e) => updateItem(idx, { value: e.target.value })}
                disabled={disabled}
                required={Boolean(rowStarted(item))}
                error={Boolean(fieldError(idx, 'value'))}
                helperText={fieldError(idx, 'value')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: basisType === 'PER_MT' ? 2 : 3 }}>
              <TextField
                fullWidth
                size="small"
                label={t('adjustments.description')}
                value={item.description || ''}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('adjustments.resolvedAmount')}
              </Typography>
              <Typography variant="body2" fontWeight={600}>{formatCurrency(resolved)}</Typography>
            </Grid>
            {!disabled && (
              <Grid size={{ xs: 6, sm: 0.5 }}>
                <IconButton color="error" onClick={() => removeItem(idx)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            )}
          </Grid>
        );
      })}
      {!disabled && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => onChange([...items, emptyRow()])}
          sx={{ mb: 2 }}
        >
          {isExpense ? t('adjustments.addExpenseHead') : t('adjustments.addIncomeHead')}
        </Button>
      )}
    </Box>
  );
}
