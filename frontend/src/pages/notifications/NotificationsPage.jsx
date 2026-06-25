import { useState } from 'react';
import { Typography, List, ListItem, ListItemText, Chip, IconButton } from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useTranslation } from 'react-i18next';
import { useListNotificationsQuery, useMarkReadMutation } from '../../store/api/services';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';

export default function NotificationsPage() {
  const { t } = useTranslation(['common', 'pages']);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data, isLoading } = useListNotificationsQuery({ page: page + 1, limit: 20, ...query });
  const [markRead] = useMarkReadMutation();

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader title={t('notifications.title', { ns: 'pages' })} subtitle={t('notifications.subtitle', { ns: 'pages' })} />
      <ListToolbar filters={filters} onChange={setFilters} onApply={applyFilters} onReset={resetFilters} showDates={false} />
      <List>
        {(data?.data || []).map(n => (
          <ListItem key={n.id} divider secondaryAction={
            !n.readAt && <IconButton onClick={() => markRead(n.id)}><MarkEmailReadIcon /></IconButton>
          }>
            <ListItemText
              primary={
                <Typography component="span" display="flex" alignItems="center" gap={1}>
                  {n.title}
                  <Chip size="small" label={n.type.replace('_', ' ')} />
                  {!n.readAt && <Chip size="small" color="error" label={t('status.new')} />}
                </Typography>
              }
              secondary={
                <>
                  {n.body}
                  <br />
                  <Typography variant="caption">{new Date(n.createdAt).toLocaleString()}</Typography>
                </>
              }
            />
          </ListItem>
        ))}
        {!isLoading && (data?.data || []).length === 0 && (
          <Typography color="text.secondary" py={4} textAlign="center">{t('notifications.none', { ns: 'pages' })}</Typography>
        )}
      </List>
    </ListPageLayout>
  );
}
