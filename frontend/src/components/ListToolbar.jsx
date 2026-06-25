import { Box, Button, Divider, MenuItem, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import DateField from './DateField';
import { glassPaperSx, space } from '../theme/tokens';

export default function ListToolbar({
  filters,
  onChange,
  onApply,
  onReset,
  showDates = true,
  searchPlaceholder = 'Search by name, number, truck, reference…',
  selects = [],
  children,
  sx = {},
}) {
  const theme = useTheme();
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <Paper sx={{ ...glassPaperSx(theme), ...sx }}>
      <Stack spacing={space.md}>
        <Typography variant="overline" sx={{ lineHeight: 1 }}>
          Search & filters
        </Typography>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={space.md}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            size="small"
            label="Search"
            placeholder={searchPlaceholder}
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
            sx={{ minWidth: { md: 240 }, flex: { md: 1 } }}
          />
          {showDates && (
            <>
              <DateField
                label="From"
                size="small"
                value={filters.from || ''}
                onChange={(e) => update('from', e.target.value)}
                sx={{ minWidth: { md: 160 } }}
              />
              <DateField
                label="To"
                size="small"
                value={filters.to || ''}
                onChange={(e) => update('to', e.target.value)}
                sx={{ minWidth: { md: 160 } }}
              />
            </>
          )}
          {selects.map((sel) => (
            <TextField
              key={sel.key}
              select
              size="small"
              label={sel.label}
              value={filters[sel.key] || ''}
              onChange={(e) => update(sel.key, e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All</MenuItem>
              {(sel.options || []).map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          ))}
          {children}
        </Stack>
        <Divider sx={{ opacity: theme.palette.mode === 'light' ? 0.55 : 0.25 }} />
        <Stack direction="row" spacing={space.sm} justifyContent="flex-end">
          <Button variant="contained" onClick={onApply}>Apply</Button>
          <Button variant="outlined" color="inherit" onClick={onReset}>Reset</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
