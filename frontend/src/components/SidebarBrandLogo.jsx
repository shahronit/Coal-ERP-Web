import { Box, Typography, Tooltip, alpha, useTheme } from '@mui/material';
import { brand } from '../theme/colors';
import { resolveAppName, splitAppName, initialsFromAppName } from '../utils/branding';

function BrandMonogram({ size = 44, initials = 'VK' }) {
  const id = `brand-monogram-${size}`;
  return (
    <Box
      component="svg"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0 }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={brand.indigoDeep} />
          <stop offset="0.45" stopColor={brand.indigo} />
          <stop offset="1" stopColor={brand.cyan} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="24" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={brand.indigo} floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M24 3.5L41.5 13.2V34.8L24 44.5L6.5 34.8V13.2L24 3.5Z"
        fill={`url(#${id}-face)`}
        filter={`url(#${id}-glow)`}
      />
      <path
        d="M24 3.5L41.5 13.2V34.8L24 44.5L6.5 34.8V13.2L24 3.5Z"
        fill={`url(#${id}-shine)`}
      />
      <path
        d="M24 3.5V44.5M6.5 13.2L41.5 34.8M41.5 13.2L6.5 34.8"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="0.75"
      />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fill="white"
        fontSize="15"
        fontWeight="800"
        fontFamily="'Source Sans 3', system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        {initials}
      </text>
    </Box>
  );
}

export default function SidebarBrandLogo({
  collapsed = false,
  appName = '',
  companyName = '',
  companyLogo = '',
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const markSize = collapsed ? 40 : 46;
  const displayName = resolveAppName(appName);
  const { primary, suffix } = splitAppName(displayName);
  const initials = initialsFromAppName(displayName);

  const mark = (
    <Box
      className="sidebar-brand__mark"
      sx={{
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: markSize + 10,
        height: markSize + 10,
        borderRadius: collapsed ? 2.5 : 3,
        background: isLight
          ? `linear-gradient(145deg, ${alpha('#fff', 0.92)} 0%, ${alpha(brand.indigo, 0.07)} 100%)`
          : `linear-gradient(145deg, ${alpha('#fff', 0.1)} 0%, ${alpha(brand.indigoDeep, 0.4)} 100%)`,
        border: '1px solid',
        borderColor: isLight ? alpha(brand.indigo, 0.14) : alpha('#fff', 0.12),
        boxShadow: isLight
          ? `0 10px 28px ${alpha(brand.indigo, 0.16)}, inset 0 1px 0 ${alpha('#fff', 0.95)}`
          : `0 10px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${alpha('#fff', 0.14)}`,
        backdropFilter: 'blur(12px) saturate(160%)',
        WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -1,
          borderRadius: 'inherit',
          padding: '1px',
          background: `linear-gradient(135deg, ${alpha(brand.indigo, 0.4)}, ${alpha(brand.cyan, 0.3)}, transparent 65%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        },
      }}
    >
      {companyLogo ? (
        <Box
          component="img"
          src={companyLogo}
          alt="Company logo"
          sx={{ width: markSize, height: markSize, objectFit: 'contain', borderRadius: 2 }}
        />
      ) : (
        <BrandMonogram size={markSize} initials={initials} />
      )}
    </Box>
  );

  return (
    <Box
      className="sidebar-brand"
      sx={{
        px: collapsed ? 1.25 : 2,
        pt: collapsed ? 2 : 2.25,
        pb: collapsed ? 1.5 : 2,
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        gap: collapsed ? 0 : 1.5,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {collapsed ? (
        <Tooltip title={displayName} placement="right" arrow>
          {mark}
        </Tooltip>
      ) : mark}

      {!collapsed && (
        <Box className="sidebar-brand__wordmark" sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component="div"
            sx={{
              fontSize: '1.06rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'text.primary',
            }}
          >
            {primary}
          </Typography>
          {suffix && (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.25 }}>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  background: `linear-gradient(90deg, ${brand.indigo}, ${brand.cyan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {suffix}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  borderRadius: 1,
                  background: `linear-gradient(90deg, ${alpha(brand.indigo, 0.5)}, transparent)`,
                }}
              />
            </Box>
          )}
          {companyName && companyName !== displayName && (
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontWeight: 600 }}
            >
              {companyName}
            </Typography>
          )}
        </Box>
      )}

      <Box
        className="sidebar-brand__rule"
        sx={{
          position: 'absolute',
          left: collapsed ? 12 : 20,
          right: collapsed ? 12 : 20,
          bottom: 0,
          height: '1px',
          background: isLight
            ? `linear-gradient(90deg, transparent, ${alpha(brand.indigo, 0.24)} 20%, ${alpha(brand.cyan, 0.2)} 80%, transparent)`
            : `linear-gradient(90deg, transparent, ${alpha(brand.indigoMuted, 0.38)} 25%, ${alpha(brand.cyan, 0.22)} 75%, transparent)`,
        }}
      />
    </Box>
  );
}
