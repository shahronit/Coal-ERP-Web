/**
 * Central design tokens — use these instead of one-off spacing/radius/shadow values.
 * MUI spacing unit = 8px (theme.spacing(n) → n * 8px).
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  pill: 999,
};

export const space = {
  xs: 1,
  sm: 1.5,
  md: 2,
  lg: 3,
  xl: 4,
};

export const layout = {
  pageGap: 3,
  listPageGap: { xs: 2.5, md: 3 },
  sectionGap: 2,
  cardPadding: 3,
  cardPaddingCompact: 2.5,
  formPadding: 3,
  toolbarPadding: { xs: 2, md: 2.5 },
  dialogPadding: 3,
  inputMinHeight: 44,
  inputMinHeightSm: 36,
  gridMinHeight: { xs: 360, sm: 440, md: 520 },
  drawerWidth: 288,
  drawerCollapsed: 88,
  maxContentWidth: 1440,
};

export const blur = {
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
};

export const shadow = {
  card: {
    light: '0 8px 32px rgba(15, 23, 42, 0.06)',
    dark: '0 8px 32px rgba(0, 0, 0, 0.35)',
  },
  cardHover: {
    light: '0 20px 48px rgba(79, 70, 229, 0.14)',
    dark: '0 20px 48px rgba(0, 0, 0, 0.45)',
  },
  button: (color) => `0 8px 24px ${color}`,
  buttonHover: (color) => `0 12px 32px ${color}`,
  focusRing: (color) => `0 0 0 3px ${color}`,
};

/** Glass-styled Paper sx — shared by FilterBar, ListToolbar, DataTable wrapper */
export const glassPaperSx = (theme) => {
  const isLight = theme.palette.mode === 'light';
  return {
    elevation: 0,
    p: layout.toolbarPadding,
    borderRadius: radius.xl / 8,
    border: '1px solid',
    borderColor: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255, 255, 255, 0.08)',
    bgcolor: isLight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.04)',
    backdropFilter: `blur(${blur.md}) saturate(160%)`,
    WebkitBackdropFilter: `blur(${blur.md}) saturate(160%)`,
    boxShadow: isLight ? shadow.card.light : shadow.card.dark,
  };
};

/** Standard form section Paper wrapper */
export const formPaperSx = (theme) => ({
  ...glassPaperSx(theme),
  p: layout.formPadding,
});
