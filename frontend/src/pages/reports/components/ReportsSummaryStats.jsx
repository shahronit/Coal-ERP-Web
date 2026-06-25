import { Grid } from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTranslation } from 'react-i18next';
import StatCard from '../../../components/StatCard';
import { DOCUMENT_TYPE_COUNT } from '../reportVisuals';

export default function ReportsSummaryStats({ standardCount, templateCount }) {
  const { t } = useTranslation('pages');

  const stats = [
    {
      title: t('reports.stats.standard'),
      value: String(standardCount),
      icon: <AssessmentOutlinedIcon />,
      color: 'primary.main',
      className: 'stagger-1',
    },
    {
      title: t('reports.stats.templates'),
      value: String(templateCount),
      icon: <DashboardCustomizeOutlinedIcon />,
      color: 'secondary.main',
      className: 'stagger-2',
    },
    {
      title: t('reports.stats.documents'),
      value: String(DOCUMENT_TYPE_COUNT),
      icon: <DescriptionOutlinedIcon />,
      color: 'info.main',
      className: 'stagger-3',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2.5 }}>
      {stats.map((stat) => (
        <Grid size={{ xs: 12, sm: 4 }} key={stat.title}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
}
