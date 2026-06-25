import {
  Box, IconButton, Stack, Tooltip, alpha, useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function SidebarUserPanel({ collapsed, onToggleCollapse }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  if (!onToggleCollapse) return null;

  const iconBtnSx = {
    borderRadius: 2,
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.14),
    bgcolor: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.35),
    transition: 'transform 0.15s ease, background-color 0.15s ease',
    '&:hover': { transform: 'scale(1.06)' },
  };

  return (
    <Box
      sx={{
        p: collapsed ? 1.25 : 1.5,
        borderTop: '1px solid',
        borderColor: alpha(theme.palette.primary.main, isLight ? 0.08 : 0.12),
        bgcolor: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.35),
        backdropFilter: 'blur(12px)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center">
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton size="small" onClick={onToggleCollapse} sx={iconBtnSx}>
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
