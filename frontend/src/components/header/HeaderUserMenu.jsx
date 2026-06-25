import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Avatar, Box, Divider, ListItemIcon, ListItemText, Menu, MenuItem,
  Stack, Typography, alpha, useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LightModeIcon from '@mui/icons-material/LightMode';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import LanguageSwitcher from '../LanguageSwitcher';
import { ROLE_LABELS } from '../../utils/roles';
import { glassSurface } from '../../theme/colors';
import { profileGlassShell } from './headerGlass';
import { useTranslation } from 'react-i18next';

export default function HeaderUserMenu() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const mode = useSelector((s) => s.theme.mode);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isLight = theme.palette.mode === 'light';
  const shell = profileGlassShell(theme.palette.mode, { open });
  const menuGlass = glassSurface(theme.palette.mode, 0.94);
  const displayName = user?.name || 'User';

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={(e) => setAnchorEl(open ? null : e.currentTarget)}
        aria-label={`User menu, ${displayName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        sx={{
            ...shell,
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            flexShrink: 0,
            border: 'none',
            cursor: 'pointer',
            px: { xs: 1, md: 1.75 },
            py: 0,
            height: 'auto',
            bgcolor: isLight ? alpha('#fff', 0.72) : alpha('#fff', 0.06),
            minWidth: { xs: 'auto', md: 188 },
            maxWidth: { xs: 172, sm: 240 },
          }}
        >
          <Avatar
            sx={{
              width: { xs: 36, md: 38 },
              height: { xs: 36, md: 38 },
              flexShrink: 0,
              fontWeight: 700,
              fontSize: { xs: '0.9375rem', md: '1rem' },
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.28)}`,
            }}
          >
            {displayName[0]?.toUpperCase() || 'U'}
          </Avatar>

          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{
              display: { xs: 'none', sm: 'block' },
              flex: 1,
              minWidth: 0,
              textAlign: 'left',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              color: 'text.primary',
              fontSize: { sm: '0.9375rem', md: '1rem' },
            }}
          >
            {displayName}
          </Typography>

          <KeyboardArrowDownIcon
            sx={{
              flexShrink: 0,
              fontSize: { xs: 22, md: 24 },
              color: isLight ? 'text.secondary' : alpha(theme.palette.primary.light, 0.85),
              transition: 'transform 0.22s ease, color 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              ...(open && {
                color: isLight ? theme.palette.primary.main : theme.palette.primary.light,
              }),
            }}
          />
        </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.25,
              minWidth: 280,
              borderRadius: 2,
              ...menuGlass,
              overflow: 'visible',
            },
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1.75, pb: 1.25 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            >
              {displayName[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={800} noWrap>{displayName}</Typography>
              <Typography variant="caption" color="primary.main" fontWeight={700} display="block" mt={0.25}>
                {ROLE_LABELS[user?.role] || user?.role}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mx: 2, opacity: isLight ? 0.55 : 0.25 }} />

        <MenuItem
          onClick={() => { setAnchorEl(null); navigate('/profile'); }}
          sx={{ py: 1.1, mx: 1, mt: 0.5, borderRadius: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary={t('account.profile')}
            primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9375rem' }}
          />
        </MenuItem>

        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
            Language
          </Typography>
          <LanguageSwitcher inMenu />
        </Box>

        <MenuItem
          onClick={() => { dispatch(toggleTheme()); }}
          sx={{ py: 1.1, mx: 1, borderRadius: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText
            primary={mode === 'light' ? 'Dark mode' : 'Light mode'}
            primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9375rem' }}
          />
        </MenuItem>

        <Divider sx={{ mx: 2, my: 0.5, opacity: isLight ? 0.55 : 0.25 }} />

        <MenuItem
          onClick={() => { setAnchorEl(null); navigate('/change-password'); }}
          sx={{ py: 1.1, mx: 1, borderRadius: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}><LockIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('auth.changePassword')} primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => { dispatch(logout()); navigate('/login'); }}
          sx={{ py: 1.1, mx: 1, mb: 0.75, borderRadius: 1.5, color: 'error.main' }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('account.logout')} primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
      </Menu>
    </>
  );
}
