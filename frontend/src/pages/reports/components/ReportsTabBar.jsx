import { Box, Button, Stack, useTheme, alpha } from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useTranslation } from 'react-i18next';
import { glassSurface } from '../../../theme/colors';

export default function ReportsTabBar({ tab, onChange, isAdmin }) {
  const { t } = useTranslation('pages');
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const glass = glassSurface(theme.palette.mode, isLight ? 0.75 : 0.08);

  const tabs = [
    { id: 0, label: t('reports.tabs.standard'), icon: AssessmentOutlinedIcon },
    { id: 1, label: t('reports.tabs.documents'), icon: DescriptionOutlinedIcon },
    { id: 2, label: t('reports.tabs.custom'), icon: AutoAwesomeOutlinedIcon },
    ...(isAdmin ? [{ id: 3, label: t('reports.tabs.admin'), icon: AdminPanelSettingsOutlinedIcon }] : []),
  ];

  return (
    <Box
      className="glass-panel animate-in stagger-1"
      role="tablist"
      aria-label={t('reports.title')}
      sx={{
        ...glass,
        borderRadius: 999,
        p: 0.75,
        mb: 3,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ minWidth: 'min-content' }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = tab === id;
          return (
            <Button
              key={id}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(id)}
              startIcon={<Icon fontSize="small" />}
              sx={{
                borderRadius: 999,
                px: { xs: 2, sm: 2.5 },
                py: 1,
                whiteSpace: 'nowrap',
                fontWeight: 700,
                textTransform: 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                ...(selected
                  ? {
                    color: '#fff',
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    },
                  }
                  : {
                    color: 'text.secondary',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                    },
                  }),
              }}
            >
              {label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
