import { useState } from 'react';
import {
  Card, CardContent, Box, Typography, TextField, MenuItem, Stack, Chip, Avatar, alpha, useTheme,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTranslation } from 'react-i18next';
import { getDocumentVisual, staggerClass } from '../reportVisuals';
import FormatDownloadGroup from './FormatDownloadGroup';
import { glassSurface } from '../../../theme/colors';

export default function DocumentExportCard({ docKey, title, rows, getLabel, onDownload, index = 0 }) {
  const { t } = useTranslation('pages');
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const glass = glassSurface(theme.palette.mode, isLight ? 0.6 : 0.06);
  const [selectedId, setSelectedId] = useState('');
  const selected = rows.find((row) => row.id === selectedId);
  const visual = getDocumentVisual(docKey);
  const { Icon, color } = visual;

  return (
    <Card
      className={`animate-in ${staggerClass(index)}`}
      sx={{
        height: '100%',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 16px 40px rgba(79, 70, 229, 0.12)'
            : '0 16px 40px rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      <Box sx={{ height: 3, bgcolor: color }} />
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: color, color: '#fff', width: 44, height: 44 }}>
            <Icon />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
            <Chip
              size="small"
              label={rows.length > 0
                ? t('reports.documents.recordsAvailable', { count: rows.length })
                : t('reports.documents.empty')}
              color={rows.length > 0 ? 'default' : 'warning'}
              variant="outlined"
              sx={{ mt: 0.5, fontWeight: 600 }}
            />
          </Box>
        </Stack>

        {rows.length === 0 ? (
          <Box
            sx={{
              ...glass,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('reports.documents.empty')}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ ...glass, borderRadius: 2, p: 2, mb: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('reports.selectRecord')}
                required
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {rows.map((row) => (
                  <MenuItem key={row.id} value={row.id}>{getLabel(row)}</MenuItem>
                ))}
              </TextField>
            </Box>

            {selected && (
              <Box
                sx={{
                  borderRadius: 2,
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, isLight ? 0.04 : 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }}
              >
                <Typography variant="body2" fontWeight={700} mb={1.5} noWrap>
                  {getLabel(selected)}
                </Typography>
                <FormatDownloadGroup
                  formats={['excel', 'pdf']}
                  downloadKey={`doc-${docKey}-${selected.id}`}
                  onDownload={(format) => onDownload(selected.id, format)}
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
