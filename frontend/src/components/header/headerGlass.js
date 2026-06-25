import { useTheme } from '@mui/material';
import { glassSurface } from '../../theme/colors';
/** Search input min-heights — keep in sync with GlobalSearch header variant */
export const headerSearchInputHeight = { xs: 44, md: 46 };

/** Vertical padding on the search glass shell (theme spacing units) */
export const headerShellPaddingY = 0.5;

/** Outer height of search shell (input + vertical padding) */
export const headerBarHeight = {
  xs: headerSearchInputHeight.xs + headerShellPaddingY * 16,
  md: headerSearchInputHeight.md + headerShellPaddingY * 16,
};

/** Shared floating glass shell for header pills */
export function floatingGlassShell(mode, { hover = true } = {}) {
  const isLight = mode === 'light';
  const glass = glassSurface(mode);

  return {
    ...glass,
    borderRadius: 3,
    boxShadow: isLight
      ? '0 8px 28px rgba(79, 70, 229, 0.08), 0 2px 10px rgba(15, 23, 42, 0.05)'
      : '0 10px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(79, 70, 229, 0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    ...(hover && {
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: isLight
          ? '0 12px 32px rgba(79, 70, 229, 0.12), 0 4px 14px rgba(6, 182, 212, 0.08)'
          : '0 14px 36px rgba(0, 0, 0, 0.48), 0 0 28px rgba(79, 70, 229, 0.12)',
      },
    }),
  };
}

/** Compact enterprise profile card — less rounded than icon pills */
export function profileGlassShell(mode, { hover = true, open = false } = {}) {
  const isLight = mode === 'light';
  const glass = glassSurface(mode);

  return {
    ...glass,
    borderRadius: 2,
    boxShadow: isLight
      ? '0 6px 24px rgba(79, 70, 229, 0.07), 0 2px 8px rgba(15, 23, 42, 0.04)'
      : '0 8px 28px rgba(0, 0, 0, 0.38), 0 0 16px rgba(79, 70, 229, 0.06)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
    ...(open && {
      borderColor: isLight ? 'rgba(79, 70, 229, 0.22)' : 'rgba(129, 140, 248, 0.28)',
      boxShadow: isLight
        ? '0 8px 28px rgba(79, 70, 229, 0.1), 0 2px 10px rgba(6, 182, 212, 0.06)'
        : '0 10px 32px rgba(0, 0, 0, 0.42), 0 0 22px rgba(79, 70, 229, 0.1)',
    }),
    ...(hover && {
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: isLight
          ? '0 10px 28px rgba(79, 70, 229, 0.11), 0 4px 12px rgba(6, 182, 212, 0.07)'
          : '0 12px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(79, 70, 229, 0.12)',
      },
    }),
  };
}

export function useFloatingGlass() {
  const theme = useTheme();
  return (opts) => floatingGlassShell(theme.palette.mode, opts);
}
