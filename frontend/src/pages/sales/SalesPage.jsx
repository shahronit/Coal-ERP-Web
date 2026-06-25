import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import { useListSalesQuery, useDeleteSaleMutation, useListCustomersQuery } from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';

export default function SalesPage() {
  const { t } = useTranslation(['common', 'pages']);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { canCreate, canUpdate, canDelete } = useCrudAccess('sales');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data: customersData } = useListCustomersQuery({ limit: 200 });
  const { data, isLoading } = useListSalesQuery({ page: page + 1, limit, ...query });
  const [remove] = useDeleteSaleMutation();

  const columns = [
    { field: 'saleNumber', headerName: t('fields.number') },
    { field: 'saleDate', headerName: t('fields.date'), render: r => formatDate(r.saleDate) },
    { field: 'customer', headerName: t('fields.customer'), render: r => r.customer?.name },
    { field: 'netAmount', headerName: t('fields.amount'), render: r => formatCurrency(r.netAmount) },
    { field: 'profit', headerName: t('fields.profit'), render: r => formatCurrency(r.profit) },
    { field: 'status', headerName: t('fields.status'), render: r => (
      <Chip
        size="small"
        label={r.status}
        color={r.status === 'CONFIRMED' ? 'success' : r.status === 'CANCELLED' ? 'error' : 'default'}
      />
    ) },
  ];

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title={t('sales.title', { ns: 'pages' })}
        subtitle={t('sales.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('sales.new', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? () => navigate('/sales/new') : undefined}
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        selects={[
          {
            key: 'customerId',
            label: 'Customer',
            options: (customersData?.data || []).map((c) => ({ value: c.id, label: c.name })),
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
      />
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={isLoading}
        page={page} limit={limit} total={data?.meta?.total || 0}
        onPageChange={setPage} onLimitChange={setLimit}
        onEdit={canUpdate ? (row) => navigate(`/sales/${row.id}`) : undefined}
        onDelete={canDelete ? async (row) => {
          if (window.confirm(t('messages.deleteQuestion'))) {
            await remove(row.id);
            enqueueSnackbar(t('messages.deleted'), { variant: 'success' });
          }
        } : undefined}
        actions={canUpdate || canDelete}
        helpTopic="sales"
      />
    </ListPageLayout>
  );
}
