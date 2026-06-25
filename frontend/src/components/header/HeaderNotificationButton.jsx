import { Badge, Box, Tooltip, alpha, useTheme } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useNavigate } from 'react-router-dom';
import { floatingGlassShell, headerBarHeight } from './headerGlass';

export default function HeaderNotificationButton({ unreadCount = 0 }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isLight = theme.palette.mode === 'light';
  const shell = floatingGlassShell(theme.palette.mode);

  return (
    <Tooltip title="Notifications">
      <Box
        component="button"
        type="button"
        onClick={() => navigate('/notifications')}
        aria-label="Notifications"
        sx={{
          ...shell,
          borderRadius: 3,
          width: headerBarHeight,
          height: headerBarHeight,
          minWidth: headerBarHeight,
          minHeight: headerBarHeight,
          flexShrink: 0,
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          p: 0,
          bgcolor: isLight ? alpha('#fff', 0.72) : alpha('#fff', 0.06),
        }}
      >
        <Badge
          badgeContent={unreadCount > 0 ? unreadCount : undefined}
          color="error"
          max={99}
          invisible={!unreadCount}
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 800,
              fontSize: '0.75rem',
              minWidth: 20,
              height: 20,
              boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.4)}`,
            },
          }}
        >
          <NotificationsNoneIcon
            sx={{
              fontSize: { xs: 26, md: 28 },
              color: isLight ? theme.palette.primary.main : theme.palette.primary.light,
            }}
          />
        </Badge>
      </Box>
    </Tooltip>
  );
}
