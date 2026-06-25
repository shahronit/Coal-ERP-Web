import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, LinearProgress, alpha, useTheme } from '@mui/material';
import PageLoadingFallback from './PageLoadingFallback';

export default function PageTransition({ pendingPath }) {
  const location = useLocation();
  const theme = useTheme();
  const isNavigating = pendingPath && !location.pathname.startsWith(pendingPath);

  return (
    <>
      {isNavigating && (
        <LinearProgress
          className="nav-progress-bar"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer + 3,
            height: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        />
      )}
      <Box className="page-transition-host" sx={{ flex: 1, minWidth: 0 }}>
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </Box>
    </>
  );
}
