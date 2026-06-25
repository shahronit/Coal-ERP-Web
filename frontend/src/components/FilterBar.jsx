import { Box, Button, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import DateField from './DateField';
import { glassPaperSx, space } from '../theme/tokens';

export default function FilterBar({ filters, onChange, onApply, onReset, children, title = 'Date filters' }) {
  const theme = useTheme();

  return (
    <Paper sx={glassPaperSx(theme)}>
      <Stack spacing={space.md}>
        <Typography variant="overline" sx={{ lineHeight: 1 }}>
          {title}
        </Typography>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={space.md}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <DateField
            label="From"
            size="small"
            value={filters.from || ''}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
            sx={{ minWidth: { md: 160 } }}
          />
          <DateField
            label="To"
            size="small"
            value={filters.to || ''}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
            sx={{ minWidth: { md: 160 } }}
          />
          {children}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
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
