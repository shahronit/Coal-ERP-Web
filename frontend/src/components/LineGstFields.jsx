import {
  Box, Checkbox, FormControlLabel, Grid, Link, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/constants';

export default function LineGstFields({
  line,
  onChange,
  disabled = false,
  isIndirect = false,
  taxConfigs = [],
  gstAmount = 0,
  size = 'small',
  inline = false,
}) {
  const { t } = useTranslation('common');

  if (isIndirect) return null;

  const applyGst = line.applyGst === true;
  const hasWeightAndRate = Number(line.weight) > 0 && Number(line.rate) > 0;

  const handleApplyGstChange = (checked) => {
    onChange({
      applyGst: checked,
      ...(checked ? {} : { gstRate: 0, taxConfigurationId: '' }),
    });
  };

  const handleTaxConfigChange = (taxId) => {
    const tax = taxConfigs.find((item) => item.id === taxId);
    onChange({
      taxConfigurationId: taxId,
      gstRate: tax ? parseFloat(tax.gstRate) : line.gstRate,
      applyGst: true,
    });
  };

  const content = (
    <Stack spacing={0.5} sx={{ width: '100%' }}>
      <FormControlLabel
        control={(
          <Checkbox
            size="small"
            checked={applyGst}
            onChange={(e) => handleApplyGstChange(e.target.checked)}
            disabled={disabled || !hasWeightAndRate}
          />
        )}
        label={t('gst.calculateGst')}
        sx={{ ml: 0, mr: 0 }}
      />
      {applyGst && (
        <>
          <TextField
            select
            fullWidth
            size={size}
            label={t('gst.rateLabel')}
            value={line.taxConfigurationId || ''}
            onChange={(e) => handleTaxConfigChange(e.target.value)}
            disabled={disabled}
          >
            <MenuItem value="">{t('gst.customRate')}</MenuItem>
            {taxConfigs.filter((item) => item.isActive !== false).map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} ({parseFloat(item.gstRate)}%)
              </MenuItem>
            ))}
          </TextField>
          {!line.taxConfigurationId && (
            <TextField
              fullWidth
              size={size}
              label={t('gst.percentLabel')}
              type="number"
              value={line.gstRate ?? ''}
              onChange={(e) => onChange({ gstRate: e.target.value, applyGst: true })}
              disabled={disabled}
            />
          )}
          {gstAmount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {t('gst.amountPreview', { amount: formatCurrency(gstAmount) })}
            </Typography>
          )}
        </>
      )}
      {!disabled && (
        <Link component={RouterLink} to="/masters/tax-configurations" variant="caption" underline="hover">
          {t('gst.manageRates')}
        </Link>
      )}
    </Stack>
  );

  if (inline) {
    return content;
  }

  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Box>{content}</Box>
    </Grid>
  );
}
