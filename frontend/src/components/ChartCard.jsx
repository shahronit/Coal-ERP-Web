import { Skeleton } from '@mui/material';
import SectionCard from './SectionCard';

export default function ChartCard({ title, subtitle, loading, height = 320, children, action }) {
  return (
    <SectionCard title={title} subtitle={subtitle} action={action}>
      {loading ? <Skeleton variant="rounded" height={height} /> : children}
    </SectionCard>
  );
}
