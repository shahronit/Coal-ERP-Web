import { alpha, createTheme } from '@mui/material/styles';
import { brand, darkPalette, glassSurface, lightPalette } from './colors';
import { buildTypography, fontBody, fontHeading } from './typography';
import { radius, layout, blur } from './tokens';

export {
  brand,
  chartColors,
  chartPalette,
  brandGradient,
  brandGradientGlow,
  meshBackground,
  glassSurface,
  brandGlassHeader,
} from './colors';
export { fontBody, fontHeading } from './typography';
export { radius, space, layout, blur, shadow, glassPaperSx, formPaperSx } from './tokens';

export const getTheme = (mode) => {
  const tokens = mode === 'light' ? lightPalette : darkPalette;
  const isLight = mode === 'light';
  const glass = glassSurface(mode);

  return createTheme({
    palette: {
      mode,
      ...tokens,
    },
    typography: buildTypography(tokens),
    shape: { borderRadius: radius.lg },
    spacing: 8,
    transitions: {
      duration: { short: 180, standard: 250, complex: 350 },
      easing: { easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            fontSize: '16px',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
          },
          body: {
            backgroundColor: tokens.background.default,
            color: tokens.text.primary,
            fontFamily: fontBody,
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          '#root': {
            minHeight: '100vh',
          },
          '::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '::-webkit-scrollbar-thumb': {
            background: isLight ? alpha(brand.indigo, 0.2) : alpha(brand.indigoMuted, 0.35),
            borderRadius: 8,
          },
          '::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          /* Keep date labels floated and hide browser placeholder until focused or filled */
          '.MuiFormControl-root:has(> .MuiInputBase-root > input[type="date"]) .MuiInputLabel-outlined': {
            transform: 'translate(14px, -9px) scale(0.75)',
            maxWidth: 'calc(133% - 32px)',
          },
          '.MuiFormControl-root:has(> .MuiInputBase-root.MuiInputBase-sizeSmall > input[type="date"]) .MuiInputLabel-outlined': {
            transform: 'translate(14px, -7px) scale(0.75)',
          },
          '.MuiFormControl-root:has(> .MuiInputBase-root > input[type="date"]) input[type="date"]:not(:focus):invalid::-webkit-datetime-edit': {
            color: 'transparent',
          },
          '.MuiFormControl-root:has(> .MuiInputBase-root > input[type="date"]) input[type="date"]:focus::-webkit-datetime-edit, .MuiFormControl-root:has(> .MuiInputBase-root > input[type="date"]) input[type="date"]:valid::-webkit-datetime-edit': {
            color: 'inherit',
          },
        },
      },
      MuiStack: {
        defaultProps: { spacing: 2, useFlexGap: true },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            ...glass,
            borderRadius: radius.xxl,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { paddingTop: 20, paddingBottom: 20 },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '16px 24px', gap: 12 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...glass,
            borderRight: isLight
              ? `1px solid ${alpha(brand.indigo, 0.08)}`
              : '1px solid rgba(255,255,255,0.06)',
          },
        },
      },
      MuiGrid: {
        defaultProps: { spacing: 2 },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            fontFamily: fontHeading,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
            borderRadius: radius.md,
            paddingInline: 20,
            minHeight: layout.inputMinHeight,
            transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
            '&:active': { transform: 'scale(0.98)' },
          },
          sizeSmall: { paddingInline: 14, minHeight: layout.inputMinHeightSm },
          containedPrimary: {
            background: `linear-gradient(135deg, ${tokens.primary.dark} 0%, ${tokens.primary.main} 55%, ${brand.cyan} 100%)`,
            boxShadow: `0 8px 24px ${alpha(tokens.primary.main, 0.35)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${tokens.primary.dark} 0%, ${tokens.primary.light} 55%, ${brand.cyanLight} 100%)`,
              boxShadow: `0 12px 32px ${alpha(tokens.primary.main, 0.4)}`,
            },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${tokens.secondary.dark} 0%, ${tokens.secondary.main} 100%)`,
            boxShadow: `0 8px 24px ${alpha(tokens.secondary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 12px 32px ${alpha(tokens.secondary.main, 0.38)}`,
            },
          },
          outlined: {
            borderColor: alpha(tokens.primary.main, 0.35),
            '&:hover': {
              borderColor: tokens.primary.main,
              bgcolor: alpha(tokens.primary.main, 0.06),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...glass,
            borderRadius: radius.xl,
            transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: layout.cardPadding * 8,
            '&:last-child': { paddingBottom: layout.cardPadding * 8 },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            ...glass,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...glass,
            color: tokens.text.primary,
            boxShadow: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            paddingTop: 14,
            paddingBottom: 14,
            fontSize: '0.9375rem',
            fontWeight: 500,
            color: tokens.text.primary,
            borderColor: tokens.divider,
          },
          head: {
            fontFamily: fontHeading,
            fontWeight: 800,
            fontSize: '0.8125rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: tokens.text.secondary,
            backgroundColor: isLight ? brand.frostSoft : brand.midnightElevated,
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: alpha(tokens.primary.main, isLight ? 0.04 : 0.08),
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            minHeight: layout.inputMinHeight,
            transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(tokens.primary.main, 0.45),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.primary.main,
              boxShadow: `0 0 0 3px ${alpha(tokens.primary.main, 0.15)}`,
            },
          },
          notchedOutline: {
            borderColor: tokens.divider,
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          asterisk: {
            color: tokens.error.main,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: fontHeading,
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: tokens.text.secondary,
            '&.Mui-focused': {
              color: tokens.primary.main,
            },
          },
          asterisk: {
            color: tokens.error.main,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: '1rem',
            fontWeight: 500,
          },
          input: {
            '&::placeholder': {
              color: tokens.text.secondary,
              opacity: 0.85,
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
            fontWeight: 500,
            marginTop: 6,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontFamily: fontHeading,
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: tokens.text.primary,
          },
          secondary: {
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: tokens.text.secondary,
          },
        },
      },
      MuiListSubheader: {
        styleOverrides: {
          root: {
            fontFamily: fontHeading,
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            lineHeight: 2.4,
            color: tokens.text.secondary,
            backgroundColor: 'transparent',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: fontHeading,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
            minHeight: 48,
            borderRadius: 10,
            transition: 'color 0.18s ease, background 0.18s ease',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${tokens.primary.main}, ${brand.cyan})`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: fontHeading,
            fontWeight: 700,
            fontSize: '0.8125rem',
            borderRadius: 10,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontFamily: fontBody,
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 10,
            padding: '8px 14px',
            color: tokens.text.primary,
            ...glass,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          message: {
            fontSize: '0.9375rem',
            fontWeight: 500,
            lineHeight: 1.55,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'all 0.18s ease',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...glass,
            borderRadius: 14,
            marginTop: 6,
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            ...glass,
            borderRadius: '14px !important',
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: 14,
            ...glass,
          },
          columnHeaders: {
            backgroundColor: isLight ? brand.frostSoft : brand.midnightElevated,
            borderBottom: `1px solid ${tokens.divider}`,
          },
        },
      },
    },
  });
};
