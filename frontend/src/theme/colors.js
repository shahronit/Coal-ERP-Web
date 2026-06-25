/**
 * Liquid Glass — premium blue · indigo · cyan palette for VK Trading ERP.
 */
export const brand = {
  indigoDeep: '#312E81',
  indigo: '#4F46E5',
  indigoLight: '#6366F1',
  indigoMuted: '#818CF8',
  cyan: '#06B6D4',
  cyanLight: '#22D3EE',
  cyanDark: '#0891B2',
  sky: '#38BDF8',
  slateInk: '#0F172A',
  slateInkMuted: '#475569',
  frost: '#F0F4FA',
  frostSoft: '#E8EEF7',
  paper: '#FFFFFF',
  glassBorder: 'rgba(79, 70, 229, 0.14)',
  midnight: '#0B0F1A',
  midnightSurface: '#121829',
  midnightElevated: '#1A2235',
  frostText: '#E8EEF7',
  frostTextMuted: '#94A3B8',
};

export const chartColors = {
  primary: brand.indigo,
  success: '#10B981',
  warning: '#F59E0B',
  info: brand.cyan,
  secondary: brand.sky,
  error: '#EF4444',
};

export const chartPalette = [
  brand.indigo,
  brand.cyan,
  chartColors.success,
  brand.sky,
  brand.indigoLight,
  '#8B5CF6',
  chartColors.warning,
  chartColors.error,
];

export const brandGradient = (mode = 'light') => (
  mode === 'light'
    ? `linear-gradient(135deg, ${brand.indigoDeep} 0%, ${brand.indigo} 45%, ${brand.cyan} 100%)`
    : `linear-gradient(135deg, ${brand.midnight} 0%, ${brand.indigoDeep} 50%, ${brand.indigo} 100%)`
);

export const brandGradientGlow = (mode = 'light') => (
  mode === 'light'
    ? '0 16px 48px rgba(79, 70, 229, 0.22), 0 4px 16px rgba(6, 182, 212, 0.12)'
    : '0 16px 48px rgba(0, 0, 0, 0.45), 0 0 40px rgba(79, 70, 229, 0.15)'
);

/** Frosted glass panel for sidebar / hero branding */
export const brandGlassHeader = (mode = 'light') => ({
  background: `${brandGradient(mode)}, ${mode === 'light'
    ? `linear-gradient(145deg,
        rgba(255, 255, 255, 0.22) 0%,
        rgba(79, 70, 229, 0.55) 35%,
        rgba(99, 102, 241, 0.48) 65%,
        rgba(6, 182, 212, 0.42) 100%)`
    : `linear-gradient(145deg,
        rgba(255, 255, 255, 0.08) 0%,
        rgba(49, 46, 129, 0.72) 40%,
        rgba(79, 70, 229, 0.55) 70%,
        rgba(6, 182, 212, 0.28) 100%)`}`,
  backgroundBlendMode: 'overlay, normal',
  backdropFilter: 'blur(24px) saturate(200%)',
  WebkitBackdropFilter: 'blur(24px) saturate(200%)',
  border: mode === 'light'
    ? '1px solid rgba(255, 255, 255, 0.55)'
    : '1px solid rgba(255, 255, 255, 0.14)',
  boxShadow: brandGradientGlow(mode) + (mode === 'light'
    ? ', inset 0 1px 0 rgba(255, 255, 255, 0.65), inset 0 -1px 0 rgba(255, 255, 255, 0.12)'
    : ', inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'),
});

export const meshBackground = (mode = 'light') => (
  mode === 'light'
    ? `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(79, 70, 229, 0.12), transparent),
       radial-gradient(ellipse 60% 40% at 90% 10%, rgba(6, 182, 212, 0.10), transparent),
       ${brand.frost}`
    : `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(79, 70, 229, 0.18), transparent),
       radial-gradient(ellipse 60% 40% at 90% 10%, rgba(6, 182, 212, 0.12), transparent),
       ${brand.midnight}`
);

export const glassSurface = (mode = 'light', opacity = 0.72) => ({
  background: mode === 'light'
    ? `rgba(255, 255, 255, ${opacity})`
    : `rgba(255, 255, 255, ${Math.min(opacity * 0.12, 0.1)})`,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: mode === 'light'
    ? '1px solid rgba(255, 255, 255, 0.65)'
    : '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: mode === 'light'
    ? '0 8px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
    : '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
});

export const lightPalette = {
  primary: {
    main: brand.indigo,
    light: brand.indigoLight,
    dark: brand.indigoDeep,
    contrastText: brand.paper,
  },
  secondary: {
    main: brand.cyan,
    light: brand.cyanLight,
    dark: brand.cyanDark,
    contrastText: brand.paper,
  },
  success: { main: chartColors.success, light: '#34D399', dark: '#059669' },
  warning: { main: chartColors.warning, light: '#FBBF24', dark: '#D97706' },
  error: { main: chartColors.error, light: '#F87171', dark: '#DC2626' },
  info: { main: brand.cyan, light: brand.cyanLight, dark: brand.cyanDark },
  background: { default: brand.frost, paper: brand.paper },
  text: { primary: brand.slateInk, secondary: brand.slateInkMuted },
  divider: brand.glassBorder,
};

export const darkPalette = {
  primary: {
    main: brand.indigoMuted,
    light: '#A5B4FC',
    dark: brand.indigo,
    contrastText: brand.midnight,
  },
  secondary: {
    main: brand.cyanLight,
    light: '#67E8F9',
    dark: brand.cyan,
    contrastText: brand.midnight,
  },
  success: { main: '#34D399', light: '#6EE7B7', dark: '#10B981' },
  warning: { main: '#FBBF24', light: '#FCD34D', dark: '#F59E0B' },
  error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
  info: { main: brand.cyanLight, light: '#67E8F9', dark: brand.cyan },
  background: { default: brand.midnight, paper: brand.midnightSurface },
  text: { primary: brand.frostText, secondary: brand.frostTextMuted },
  divider: 'rgba(148, 163, 184, 0.14)',
};
