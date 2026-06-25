import { Box, Skeleton } from '@mui/material';

export default function PageLoadingFallback() {
  return (
    <Box className="page-loading-fallback" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
      <Skeleton variant="rounded" height={48} sx={{ borderRadius: 3, maxWidth: 420 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} className={`stagger-${i + 1}`} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
    </Box>
  );
}
