import { Card, CardActionArea, CardContent, Box, Typography, alpha, useTheme } from '@mui/material';
import { layout, radius, shadow, space } from '../theme/tokens';

export default function QuickActionCard({ title, body, icon, color = 'primary.main', onClick, className = '' }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const accent = theme.palette.primary.main;

  return (
    <Card
      className={`animate-in ${className}`.trim()}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha(accent, isLight ? 0.28 : 0.4),
        background: isLight
          ? `linear-gradient(135deg, ${alpha(accent, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 55%, rgba(255,255,255,0.9) 100%)`
          : `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 55%, rgba(255,255,255,0.04) 100%)`,
        boxShadow: isLight
          ? `0 6px 24px ${alpha(accent, 0.1)}`
          : `0 6px 24px ${alpha(accent, 0.2)}`,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: space.md * 8,
          bottom: space.md * 8,
          width: 3,
          borderRadius: '0 2px 2px 0',
          bgcolor: accent,
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: alpha(accent, isLight ? 0.45 : 0.55),
          boxShadow: isLight ? shadow.cardHover.light : shadow.cardHover.dark,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: layout.cardPaddingCompact }}>
          <Box display="flex" gap={space.md} alignItems="flex-start">
            <Box
              sx={{
                color,
                width: layout.inputMinHeight,
                height: layout.inputMinHeight,
                borderRadius: radius.md / 8,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                transition: 'transform 0.2s ease',
                '.MuiCardActionArea-root:hover &': { transform: 'scale(1.06)' },
              }}
            >
              {icon}
            </Box>
            <Box minWidth={0}>
              <Typography variant="subtitle1" fontWeight={800}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {body}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
