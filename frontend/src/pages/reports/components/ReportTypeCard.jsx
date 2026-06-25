import {
  Card, CardContent, Box, Typography, Stack, Chip, Avatar, alpha, useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getReportVisual, CUSTOM_TEMPLATE_VISUAL, staggerClass } from '../reportVisuals';
import FormatDownloadGroup from './FormatDownloadGroup';
import { ROLE_LABELS } from '../../../utils/roles';

export default function ReportTypeCard({
  reportId,
  title,
  description,
  filters = [],
  roleChips,
  index = 0,
  onDownload,
  formats = ['excel', 'pdf', 'csv'],
  downloadKey,
  variant = 'standard',
}) {
  const theme = useTheme();
  const visual = variant === 'custom'
    ? CUSTOM_TEMPLATE_VISUAL
    : getReportVisual(reportId);
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
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
          <Avatar
            sx={{
              bgcolor: color,
              color: '#fff',
              width: 48,
              height: 48,
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Icon />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ lineHeight: 1.3 }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        </Stack>

        {filters.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mb={2}>
            {filters.map((filter) => (
              <Chip
                key={filter}
                size="small"
                icon={<FilterListIcon sx={{ fontSize: 14 }} />}
                label={filter}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}

        {roleChips?.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mb={2}>
            {roleChips.map((role) => (
              <Chip
                key={role}
                size="small"
                label={ROLE_LABELS[role] || role.replace(/_/g, ' ')}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}

        <FormatDownloadGroup
          formats={formats}
          downloadKey={downloadKey || reportId}
          onDownload={onDownload}
        />
      </CardContent>
    </Card>
  );
}
