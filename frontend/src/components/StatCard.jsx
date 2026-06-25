import { Box, Card, CardContent, Typography, Chip, Avatar, Skeleton, alpha, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { layout, shadow, space } from '../theme/tokens';

export default function StatCard({ title, value, subtitle, icon, color = 'primary.main', delta, onClick, loading, className = '' }) {
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
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, transparent 55%)`,
          opacity: 0,
          transition: 'opacity 0.22s ease',
        },
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: isLight ? shadow.cardHover.light : shadow.cardHover.dark,
          '&::before': { opacity: onClick ? 1 : 0 },
        },
      }}
    >
      <CardContent sx={{ p: layout.cardPaddingCompact, position: 'relative' }}>
        {icon && (
          <Avatar
            sx={{
              position: 'absolute',
              top: layout.cardPaddingCompact,
              right: layout.cardPaddingCompact,
              bgcolor: color,
              color: '#fff',
              width: 44,
              height: 44,
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
              '& .MuiSvgIcon-root': { fontSize: 22 },
            }}
          >
            {icon}
          </Avatar>
        )}
        <Box minWidth={0} sx={{ pr: icon ? 6.5 : 0 }}>
          <Typography variant="overline" color="text.secondary" display="block">
            {title}
          </Typography>
          <Typography variant="h5" mt={0.5} sx={{ letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {delta !== undefined && (
          <Chip
            size="small"
            icon={<TrendingUpIcon />}
            label={`${delta >= 0 ? '+' : ''}${delta}%`}
            color={delta >= 0 ? 'success' : 'error'}
            sx={{ mt: space.md, fontWeight: 800 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
