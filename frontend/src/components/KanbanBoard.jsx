import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../utils/constants';

export default function KanbanBoard({ columns = [], onCardClick }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${columns.length || 1}, minmax(220px, 1fr))` }, gap: 2 }}>
      {columns.map((column) => (
        <Card key={column.stage} sx={{ bgcolor: 'background.default' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontWeight={900}>{column.stage}</Typography>
              <Chip size="small" label={formatCurrency(column.totalValue || 0)} />
            </Stack>
            <Stack spacing={1.25}>
              {(column.leads || []).map((lead) => (
                <Card key={lead.id} variant="outlined" onClick={() => onCardClick?.(lead)} sx={{ cursor: 'pointer' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography fontWeight={800}>{lead.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{lead.company || lead.phone || lead.email}</Typography>
                    <Typography variant="caption" color="primary" fontWeight={800}>{formatCurrency(lead.estimatedValue)}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
