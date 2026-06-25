import { Fab, Tooltip, alpha, useTheme } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function FloatingHelpButton({ topicId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Tooltip title={t('actions.openHelp')}>
      <Fab
        data-tour="floating-help"
        aria-label={t('actions.openHelp')}
        onClick={() => navigate(topicId ? `/help/${topicId}` : '/help')}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: (z) => z.drawer + 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: '#fff',
          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.light})`,
            transform: 'scale(1.06)',
            boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.48)}`,
          },
        }}
      >
        <HelpIcon />
      </Fab>
    </Tooltip>
  );
}
