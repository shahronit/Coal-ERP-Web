import { Box, Button, Card, CardContent, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader';
import VideoGuidePlayer from '../../components/VideoGuidePlayer';
import { findHelpTopic } from '../../content/helpManifest';

export default function HelpTopicPage() {
  const { topicId } = useParams();
  const topic = findHelpTopic(topicId);
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'guides']);

  if (!topic) return <Navigate to="/help" replace />;

  const steps = t(`topics.${topic.guideKey}.steps`, { ns: 'guides', returnObjects: true });

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/help')} sx={{ mb: 2 }}>
        {t('actions.back')}
      </Button>
      <PageHeader
        title={t(`topics.${topic.guideKey}.title`, { ns: 'guides' })}
        subtitle={t(`topics.${topic.guideKey}.summary`, { ns: 'guides' })}
      >
        <Button variant="contained" endIcon={<OpenInNewIcon />} onClick={() => navigate(topic.route)}>
          {t('actions.goToScreen')}
        </Button>
      </PageHeader>
      <VideoGuidePlayer topic={topic} />
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} gutterBottom>{t('help.stepsTitle')}</Typography>
          <Divider sx={{ mb: 1 }} />
          <List>
            {steps.map((step, index) => (
              <ListItem key={step.title} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemText
                  primary={`${index + 1}. ${step.title}`}
                  secondary={step.body}
                  primaryTypographyProps={{ fontWeight: 800 }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
