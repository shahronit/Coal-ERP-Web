import { memo, useCallback } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Collapse, ListSubheader, Tooltip, alpha, useTheme,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { NAV_GROUPS } from '../config/navGroups';
import { prefetchRoute } from '../routes/lazyPages';

function SidebarNavigation({
  collapsed,
  isMobile,
  isLight,
  pathname,
  pendingPath,
  openGroups,
  onToggleGroup,
  onNavClick,
  userRole,
  canShow,
  canShowGroup,
}) {
  const { t } = useTranslation('nav');
  const theme = useTheme();

  const handlePrefetch = useCallback((path) => {
    prefetchRoute(path);
  }, []);

  const renderItem = (item) => {
    const selected = pendingPath
      ? item.path === pendingPath
      : pathname.startsWith(item.path);
    const pending = pendingPath === item.path && !pathname.startsWith(item.path);
    const label = t(`items.${item.key}.label`);

    const button = (
      <ListItemButton
        key={item.path}
        selected={selected}
        onClick={() => onNavClick(item.path)}
        onMouseEnter={() => handlePrefetch(item.path)}
        onFocus={() => handlePrefetch(item.path)}
        className={[
          'nav-item',
          selected ? 'nav-item--selected' : '',
          pending ? 'nav-item--pending' : '',
        ].filter(Boolean).join(' ')}
        sx={{
          borderRadius: 2.5,
          mb: 0.5,
          minHeight: collapsed && !isMobile ? 48 : 52,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          px: collapsed && !isMobile ? 1 : 2,
          transition: 'transform 0.18s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.28s ease, background 0.28s ease',
          '&.Mui-selected': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: '#fff',
            boxShadow: `0 8px 28px ${alpha(theme.palette.primary.main, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
            '& .MuiListItemIcon-root': { color: '#fff' },
            '& .MuiListItemText-primary, & .MuiListItemText-secondary': { color: '#fff' },
          },
          '&:hover:not(.Mui-selected)': {
            bgcolor: alpha(theme.palette.primary.main, isLight ? 0.07 : 0.12),
            transform: 'translateX(4px)',
          },
        }}
      >
        <ListItemIcon
          className="nav-item-icon"
          sx={{ minWidth: collapsed && !isMobile ? 0 : 40, justifyContent: 'center' }}
        >
          {item.icon}
        </ListItemIcon>
        {(!collapsed || isMobile) && (
          <ListItemText
            primary={label}
            secondary={t(`items.${item.key}.subtitle`)}
            primaryTypographyProps={{ fontWeight: 700 }}
            secondaryTypographyProps={{ sx: { opacity: 0.88 } }}
          />
        )}
      </ListItemButton>
    );

    if (collapsed && !isMobile) {
      return (
        <Tooltip key={item.path} title={label} placement="right" arrow>
          {button}
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <List disablePadding>
      {NAV_GROUPS.filter(canShowGroup).map((group) => {
        const items = group.items.filter((item) => canShow(item, userRole));
        if (!items.length) return null;

        if (collapsed && !isMobile) {
          return (
            <Box key={group.key} sx={{ mb: 1 }}>
              {items.map(renderItem)}
            </Box>
          );
        }

        return (
          <Box key={group.key}>
            <ListSubheader component="div" disableSticky sx={{ bgcolor: 'transparent', px: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                {t(`groups.${group.key}`)}
                <IconButton size="small" onClick={() => onToggleGroup(group.key)}>
                  {openGroups[group.key] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
            </ListSubheader>
            <Collapse in={openGroups[group.key]} timeout="auto" unmountOnExit>
              {items.map(renderItem)}
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

export default memo(SidebarNavigation);
