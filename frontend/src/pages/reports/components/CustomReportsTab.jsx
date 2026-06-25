import {
  Box, Grid, Stack, Typography, alpha, useTheme,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useTranslation } from 'react-i18next';
import DateField from '../../../components/DateField';
import ReportTypeCard from './ReportTypeCard';
import { glassSurface } from '../../../theme/colors';

export default function CustomReportsTab({
  templateFilters,
  onFiltersChange,
  templates,
  isAdmin,
  onDownload,
}) {
  const { t } = useTranslation('pages');
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const glass = glassSurface(theme.palette.mode, isLight ? 0.75 : 0.08);

  return (
    <Box>
      <Box
        className="glass-panel animate-in stagger-1"
        sx={{
          ...glass,
          borderRadius: 2,
          p: 2,
          mb: 3,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <CalendarTodayOutlinedIcon color="primary" sx={{ display: { xs: 'none', sm: 'block' } }} />
          <DateField
            label={t('reports.filters.from')}
            value={templateFilters.from}
            onChange={(e) => onFiltersChange({ ...templateFilters, from: e.target.value })}
          />
          <DateField
            label={t('reports.filters.to')}
            value={templateFilters.to}
            onChange={(e) => onFiltersChange({ ...templateFilters, to: e.target.value })}
          />
        </Stack>
      </Box>

      {templates.length === 0 ? (
        <Box
          className="animate-in stagger-2"
          sx={{
            ...glass,
            borderRadius: 3,
            p: 5,
            textAlign: 'center',
          }}
        >
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 56, color: alpha(theme.palette.primary.main, 0.4), mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {t('reports.custom.empty')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin ? t('reports.custom.emptyAdminHint') : t('reports.noTemplates')}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {templates.map((template, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={template.id}>
              <ReportTypeCard
                variant="custom"
                reportId={template.id}
                title={template.name}
                description={template.description}
                roleChips={template.allowedRoles || []}
                formats={['excel', 'pdf']}
                index={index}
                downloadKey={`template-${template.id}`}
                onDownload={(format) => onDownload(template, format)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
