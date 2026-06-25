import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import { useListAuditQuery } from '../../store/api/services';

export default function AuditPage() {
  const { t } = useTranslation(['common', 'pages']);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data, isLoading } = useListAuditQuery({ page: page + 1, limit: 20, ...query });

  const columns = [
    { field: 'createdAt', headerName: t('fields.timestamp'), render: r => new Date(r.createdAt).toLocaleString() },
    { field: 'user', headerName: t('fields.user'), render: r => r.user?.name || t('audit.system', { ns: 'pages' }) },
    { field: 'action', headerName: t('fields.action') },
    { field: 'entity', headerName: t('fields.entity') },
    { field: 'entityId', headerName: t('fields.entityId'), render: r => r.entityId?.slice(0, 8) + '...' },
  ];

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader title={t('audit.title', { ns: 'pages' })} subtitle={t('audit.subtitle', { ns: 'pages' })} />
      <ListToolbar filters={filters} onChange={setFilters} onApply={applyFilters} onReset={resetFilters} />
      <DataTable columns={columns} rows={data?.data || []} loading={isLoading} page={page} limit={20} total={data?.meta?.total || 0} onPageChange={setPage} actions={false} />
    </ListPageLayout>
  );
}
