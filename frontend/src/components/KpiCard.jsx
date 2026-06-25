import { Card, CardContent, Typography, Box, Avatar, Skeleton, alpha, useTheme } from '@mui/material';
import { layout, shadow, space } from '../theme/tokens';

export default function KpiCard({ title, value, icon, color = 'primary.main', loading, className = '' }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: layout.cardPaddingCompact }}>
          <Skeleton variant="rounded" height={88} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`animate-in ${className}`.trim()}
      sx={{
        height: '100%',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isLight ? shadow.cardHover.light : shadow.cardHover.dark,
        },
      }}
    >
      <CardContent sx={{ p: layout.cardPaddingCompact }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={space.md}>
          <Box minWidth={0}>
            <Typography variant="overline" color="text.secondary" display="block">
              {title}
            </Typography>
            <Typography variant="h5" color={color} mt={0.5} sx={{ letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color,
                width: 44,
                height: 44,
                flexShrink: 0,
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
