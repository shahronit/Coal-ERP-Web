import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

export default function VideoGuidePlayer({ topic }) {
  const { t } = useTranslation();
  const appLang = useSelector(s => s.language.lang);
  const [videoLang, setVideoLang] = useState(appLang);
  const [hasError, setHasError] = useState(false);

  const source = topic.video[videoLang] || topic.video.en;

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PlayCircleIcon color="primary" />
            <Typography fontWeight={800}>{t('actions.watchGuide')}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant={videoLang === 'en' ? 'contained' : 'outlined'} onClick={() => { setVideoLang('en'); setHasError(false); }}>
              English
            </Button>
            <Button size="small" variant={videoLang === 'hi' ? 'contained' : 'outlined'} onClick={() => { setVideoLang('hi'); setHasError(false); }}>
              हिंदी
            </Button>
          </Stack>
        </Stack>
        {hasError && <Alert severity="info" sx={{ mb: 2 }}>{t('help.videoUnavailable')}</Alert>}
        <Box
          component="video"
          controls
          poster={topic.thumbnail}
          src={source}
          onError={() => setHasError(true)}
          sx={{
            width: '100%',
            maxHeight: 440,
            borderRadius: 2,
            bgcolor: 'black',
          }}
        >
          {t('help.videoUnavailable')}
        </Box>
      </CardContent>
    </Card>
  );
}
