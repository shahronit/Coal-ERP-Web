import { alpha, useTheme } from '@mui/material/styles';
import { chartColors, chartPalette } from '../theme/colors';

export const CHART_PALETTE = chartPalette;

export const CHART_SEMANTIC = chartColors;

export const BAR_RADIUS = [8, 8, 0, 0];

export function useChartStyles() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const axisColor = theme.palette.text.secondary;
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(79, 70, 229, 0.08)';

  return {
    palette: CHART_PALETTE,
    colors: CHART_SEMANTIC,
    grid: {
      stroke: gridColor,
      strokeDasharray: '4 4',
      vertical: false,
    },
    axis: {
      stroke: gridColor,
      tick: { fill: axisColor, fontSize: 13, fontWeight: 600 },
      tickLine: false,
      axisLine: { stroke: gridColor },
    },
    tooltip: {
      cursor: { fill: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05) },
      contentStyle: {
        background: isDark ? 'rgba(26, 34, 53, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 14,
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(79, 70, 229, 0.12)',
        color: theme.palette.text.primary,
      },
      labelStyle: { color: theme.palette.text.secondary, fontWeight: 700, marginBottom: 4 },
      itemStyle: { color: theme.palette.text.primary, fontWeight: 600 },
    },
    legend: {
      wrapperStyle: { paddingTop: 8, fontSize: 13, fontWeight: 600, color: axisColor },
    },
  };
}
