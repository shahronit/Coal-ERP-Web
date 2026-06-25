import { Box } from '@mui/material';
import { layout } from '../theme/tokens';

export default function PageLayout({ children, sx = {} }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: layout.pageGap,
        pb: 2,
        width: '100%',
        maxWidth: layout.maxContentWidth,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
