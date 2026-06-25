import { Box, Typography, Stack, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { brandGradient, glassSurface } from '../../../theme/colors';

function ReportsHeroIllustration() {
  return (
    <Box
      className="floatSoft hero-glow"
      sx={{ width: 120, height: 100, flexShrink: 0, opacity: 0.9 }}
      aria-hidden
    >
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="52" width="14" height="36" rx="3" fill="url(#bar1)" opacity="0.85" />
        <rect x="28" y="38" width="14" height="50" rx="3" fill="url(#bar2)" opacity="0.9" />
        <rect x="48" y="28" width="14" height="60" rx="3" fill="url(#bar3)" />
        <rect x="68" y="44" width="14" height="44" rx="3" fill="url(#bar2)" opacity="0.75" />
        <rect x="88" y="34" width="14" height="54" rx="3" fill="url(#bar1)" opacity="0.8" />
        <path d="M72 18 L92 18 L92 38 L82 28 Z" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <rect x="76" y="22" width="10" height="2" rx="1" fill="rgba(255,255,255,0.6)" />
        <rect x="76" y="27" width="14" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
        <defs>
          <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#4F46E5" />
            <stop offset="1" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#312E81" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
}

export default function ReportsHero() {
  const { t } = useTranslation('pages');
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const glass = glassSurface(theme.palette.mode, isLight ? 0.82 : 0.1);

  return (
    <Box
      className="glass-panel animate-in"
      sx={{
        ...glass,
        borderRadius: 3,
        overflow: 'hidden',
        mb: 2.5,
        position: 'relative',
      }}
    >
      <Box sx={{ height: 3, background: brandGradient(theme.palette.mode) }} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ p: { xs: 2.5, md: 3 } }}
      >
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.9 }}>
            {t('reports.heroHint')}
          </Typography>
        </Box>
        <ReportsHeroIllustration />
      </Stack>
    </Box>
  );
}
