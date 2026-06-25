import { Card, CardContent, Stack, Typography, Box, Divider } from '@mui/material';
import { layout, space } from '../theme/tokens';

export default function SectionCard({ title, subtitle, action, children, sx = {}, noDivider = false }) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ p: layout.cardPadding, '&:last-child': { pb: layout.cardPadding } }}>
        {(title || subtitle || action) && (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              mb={space.md}
              gap={space.md}
            >
              <Box flex={1} minWidth={0}>
                {title && (
                  <Typography variant="h6" component="h2" gutterBottom={Boolean(subtitle)}>
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {action && <Box flexShrink={0}>{action}</Box>}
            </Stack>
            {!noDivider && <Divider sx={{ mb: space.md, opacity: 0.6 }} />}
          </>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
