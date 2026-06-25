import { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, MenuItem, Stack, Chip,
  Checkbox, ListItemText, Button, IconButton, alpha, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { glassSurface, brandGradient } from '../../../theme/colors';
import { staggerClass } from '../reportVisuals';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY'];

export default function TemplateAdminPanel({
  templateForm,
  templateErrors,
  baseReports,
  selectedBaseReport,
  visibleTemplates,
  creatingTemplate,
  updatingTemplate,
  onFormChange,
  onBaseReportChange,
  onClearFieldError,
  onSave,
  onEdit,
  onDelete,
  onNew,
}) {
  const { t } = useTranslation('pages');
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const glass = glassSurface(theme.palette.mode, isLight ? 0.82 : 0.1);
  const [highlight, setHighlight] = useState(false);

  const handleNew = () => {
    onNew();
    setHighlight(true);
    setTimeout(() => setHighlight(false), 600);
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card
          className={`glass-panel animate-in stagger-1${highlight ? ' tabContentEnter' : ''}`}
          sx={{
            ...glass,
            transition: 'box-shadow 0.4s ease',
            ...(highlight && {
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
            }),
          }}
        >
          <Box sx={{ height: 3, background: brandGradient(theme.palette.mode) }} />
          <CardContent sx={{ py: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>
                {templateForm.id ? t('reports.editTemplate') : t('reports.createTemplate')}
              </Typography>
              {templateForm.id && (
                <Button size="small" onClick={handleNew}>{t('reports.createTemplate')}</Button>
              )}
            </Stack>

            <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1.5}>
              {t('reports.admin.sectionDetails')}
            </Typography>
            <Stack spacing={2} mb={3}>
              <TextField
                label={t('reports.templateName')}
                required
                value={templateForm.name}
                onChange={(e) => { onFormChange({ ...templateForm, name: e.target.value }); onClearFieldError('name'); }}
                error={Boolean(templateErrors.name)}
                helperText={templateErrors.name}
              />
              <TextField
                label={t('reports.templateDescription')}
                value={templateForm.description}
                onChange={(e) => onFormChange({ ...templateForm, description: e.target.value })}
              />
              <TextField
                select
                label={t('reports.baseReport')}
                required
                value={templateForm.baseReportType}
                onChange={(e) => { onBaseReportChange(e.target.value); onClearFieldError('baseReportType'); }}
                error={Boolean(templateErrors.baseReportType)}
                helperText={templateErrors.baseReportType}
              >
                {baseReports.map((report) => (
                  <MenuItem key={report.id} value={report.id}>{report.title}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1.5}>
              {t('reports.admin.sectionAccess')}
            </Typography>
            <Stack spacing={2}>
              <TextField
                select
                label={t('reports.columns')}
                required
                value={templateForm.columns}
                onChange={(e) => { onFormChange({ ...templateForm, columns: e.target.value }); onClearFieldError('columns'); }}
                error={Boolean(templateErrors.columns)}
                helperText={templateErrors.columns}
                SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}
              >
                {(selectedBaseReport?.columns || []).map((column) => (
                  <MenuItem key={column.key} value={column.key}>
                    <Checkbox checked={templateForm.columns.includes(column.key)} />
                    <ListItemText primary={column.label} />
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t('reports.allowedRoles')}
                required
                value={templateForm.allowedRoles}
                onChange={(e) => { onFormChange({ ...templateForm, allowedRoles: e.target.value }); onClearFieldError('allowedRoles'); }}
                error={Boolean(templateErrors.allowedRoles)}
                helperText={templateErrors.allowedRoles}
                SelectProps={{ multiple: true, renderValue: (selected) => selected.map((role) => role.replace('_', ' ')).join(', ') }}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    <Checkbox checked={templateForm.allowedRoles.includes(role)} />
                    <ListItemText primary={role.replace('_', ' ')} />
                  </MenuItem>
                ))}
              </TextField>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={onSave}
                disabled={creatingTemplate || updatingTemplate}
              >
                {t('reports.saveTemplate')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Typography variant="h6" fontWeight={800} mb={2} className="animate-in stagger-2">
          {t('reports.existingTemplates')}
        </Typography>
        <Stack spacing={1.5}>
          {visibleTemplates.map((template, index) => (
            <Card
              key={template.id}
              className={`animate-in ${staggerClass(index)}`}
              sx={{
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 8px 24px rgba(79, 70, 229, 0.1)'
                    : '0 8px 24px rgba(0, 0, 0, 0.35)',
                },
              }}
            >
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={800}>{template.name}</Typography>
                    {template.description && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {template.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={template.baseReportType} color="primary" variant="outlined" />
                      <Chip
                        size="small"
                        label={t('reports.admin.columnsCount', { count: (template.columns || []).length })}
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5} flexShrink={0}>
                    <IconButton size="small" color="primary" onClick={() => onEdit(template)} aria-label={t('reports.editTemplate')}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(template.id)} aria-label={t('reports.deleteTemplate')}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {visibleTemplates.length === 0 && (
            <Box
              sx={{
                ...glass,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('reports.custom.empty')}
              </Typography>
            </Box>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
}
