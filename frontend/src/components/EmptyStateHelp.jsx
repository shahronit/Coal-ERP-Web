import { Box, Button, Typography } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function EmptyStateHelp({ topicId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box py={4} textAlign="center">
      <HelpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
      <Typography fontWeight={700}>{t('table.emptyTitle')}</Typography>
      <Typography color="text.secondary" mt={0.5} mb={2}>
        {t('table.emptyBody')}
      </Typography>
      {topicId && (
        <Button size="small" variant="outlined" onClick={() => navigate(`/help/${topicId}`)}>
          {t('actions.watchGuide')}
        </Button>
      )}
    </Box>
  );
}
