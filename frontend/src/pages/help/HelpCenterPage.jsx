import { useMemo, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Grid, TextField, Typography, Chip, Stack } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { HELP_TOPICS } from '../../content/helpManifest';
import { replayOnboardingTour } from '../../utils/onboarding';

export default function HelpCenterPage() {
  const { t } = useTranslation(['common', 'guides']);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const topics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HELP_TOPICS;
    return HELP_TOPICS.filter(topic => {
      const title = t(`topics.${topic.guideKey}.title`, { ns: 'guides' }).toLowerCase();
      const summary = t(`topics.${topic.guideKey}.summary`, { ns: 'guides' }).toLowerCase();
      return title.includes(q) || summary.includes(q);
    });
  }, [search, t]);

  return (
    <Box>
      <PageHeader title={t('help.title')} subtitle={t('help.subtitle')}>
        <Button startIcon={<RestartAltIcon />} variant="outlined" onClick={replayOnboardingTour}>
          {t('actions.startTour')}
        </Button>
      </PageHeader>
      <TextField
        fullWidth
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('help.searchPlaceholder')}
        sx={{ mb: 3 }}
      />
      <Grid container spacing={2}>
        {topics.map(topic => {
          const Icon = topic.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic.id}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => navigate(`/help/${topic.id}`)} sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Icon color="primary" />
                      <Box>
                        <Typography fontWeight={800}>{t(`topics.${topic.guideKey}.title`, { ns: 'guides' })}</Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {t(`topics.${topic.guideKey}.summary`, { ns: 'guides' })}
                        </Typography>
                        <Chip size="small" label={topic.duration} sx={{ mt: 2 }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
