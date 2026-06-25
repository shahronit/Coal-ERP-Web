import { Stack } from '@mui/material';
import { layout } from '../theme/tokens';

/** Consistent vertical rhythm for list pages: header → filters → table */
export default function ListPageLayout({ children, sx = {} }) {
  return (
    <Stack
      spacing={layout.listPageGap}
      sx={{ width: '100%', pb: 1, maxWidth: layout.maxContentWidth, ...sx }}
    >
      {children}
    </Stack>
  );
}
