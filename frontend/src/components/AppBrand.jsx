import { Avatar, Box, Stack, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

import { resolveAppName, DEFAULT_APP_NAME } from '../utils/branding';

export default function AppBrand({
  appName = DEFAULT_APP_NAME,
  companyName = '',
  companyLogo = '',
  compact = false,
  iconOnly = false,
  inverted = false,
}) {
  const displayName = resolveAppName(appName);
  const subtitle = companyName && companyName !== displayName ? companyName : null;

  const avatar = companyLogo ? (
    <Avatar
      src={companyLogo}
      alt={displayName}
      variant="rounded"
      sx={{
        width: compact || iconOnly ? 38 : 46,
        height: compact || iconOnly ? 38 : 46,
        bgcolor: inverted ? 'rgba(255,255,255,0.22)' : 'background.paper',
        border: inverted ? '1px solid rgba(255,255,255,0.45)' : '1px solid',
        borderColor: inverted ? 'rgba(255,255,255,0.45)' : 'divider',
        boxShadow: inverted
          ? '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)'
          : 'none',
        backdropFilter: inverted ? 'blur(8px)' : 'none',
      }}
    />
  ) : (
    <Avatar
      variant="rounded"
      sx={{
        width: compact || iconOnly ? 38 : 46,
        height: compact || iconOnly ? 38 : 46,
        bgcolor: inverted ? 'rgba(255,255,255,0.22)' : 'primary.main',
        color: inverted ? '#fff' : 'primary.contrastText',
        border: inverted ? '1px solid rgba(255,255,255,0.4)' : 'none',
        boxShadow: inverted
          ? '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.35)'
          : `0 4px 16px rgba(79, 70, 229, 0.25)`,
        backdropFilter: inverted ? 'blur(8px)' : 'none',
      }}
    >
      <BusinessIcon fontSize={compact || iconOnly ? 'small' : 'medium'} />
    </Avatar>
  );

  if (iconOnly) return avatar;

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
      {avatar}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant={compact ? 'subtitle1' : 'h6'}
          fontWeight={900}
          noWrap
          sx={{
            color: inverted ? '#fff' : 'text.primary',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {displayName}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            noWrap
            sx={{ color: inverted ? 'rgba(255,255,255,0.88)' : 'text.secondary', display: 'block' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
