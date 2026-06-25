import { useState } from 'react';
import { Stack, Button, CircularProgress, alpha, useTheme } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import { useTranslation } from 'react-i18next';

const FORMATS = [
  { key: 'excel', icon: TableChartIcon, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { key: 'pdf', icon: PictureAsPdfIcon, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { key: 'csv', icon: GridOnIcon, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
];

export default function FormatDownloadGroup({ onDownload, formats = ['excel', 'pdf', 'csv'], downloadKey = 'default' }) {
  const { t } = useTranslation('pages');
  const theme = useTheme();
  const [loading, setLoading] = useState(null);

  const handleClick = async (format) => {
    const id = `${downloadKey}-${format}`;
    setLoading(id);
    try {
      await onDownload(format);
    } finally {
      setLoading(null);
    }
  };

  const visible = FORMATS.filter((f) => formats.includes(f.key));

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {visible.map(({ key, icon: Icon, color, bg }) => {
        const id = `${downloadKey}-${key}`;
        const isLoading = loading === id;
        return (
          <Button
            key={key}
            size="small"
            disabled={Boolean(loading)}
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <Icon fontSize="small" />}
            onClick={() => handleClick(key)}
            sx={{
              borderRadius: 999,
              fontWeight: 700,
              textTransform: 'none',
              color,
              bgcolor: bg,
              border: `1px solid ${alpha(color, 0.25)}`,
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              '&:hover': {
                bgcolor: bg,
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'light'
                  ? `0 6px 16px ${alpha(color, 0.2)}`
                  : `0 6px 16px ${alpha(color, 0.15)}`,
              },
            }}
          >
            {t(`reports.formats.${key}`)}
          </Button>
        );
      })}
    </Stack>
  );
}
