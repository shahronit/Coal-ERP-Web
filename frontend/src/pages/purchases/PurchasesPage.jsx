import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import { useListPurchasesQuery, useConfirmPurchaseMutation, useDeletePurchaseMutation, useListSuppliersQuery } from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';
import { useSnackbar } from 'notistack';
import { useCrudAccess } from '../../hooks/usePermissions';

export default function PurchasesPage() {
  const { t } = useTranslation(['common', 'pages']);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { canCreate, canUpdate, canDelete } = useCrudAccess('purchases');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data: suppliersData } = useListSuppliersQuery({ limit: 200 });
  const { data, isLoading } = useListPurchasesQuery({ page: page + 1, limit, ...query });
  const [confirm] = useConfirmPurchaseMutation();
  const [remove] = useDeletePurchaseMutation();

  const columns = [
    { field: 'purchaseNumber', headerName: t('fields.number') },
    { field: 'purchaseDate', headerName: t('fields.date'), render: r => formatDate(r.purchaseDate) },
    { field: 'supplier', headerName: t('fields.supplier'), render: r => r.supplier?.name },
    { field: 'netAmount', headerName: t('fields.amount'), render: r => formatCurrency(r.netAmount) },
    { field: 'status', headerName: t('fields.status'), render: r => <Chip size="small" label={r.status} color={r.status === 'CONFIRMED' ? 'success' : 'default'} /> },
    { field: 'outstanding', headerName: t('fields.outstanding'), render: r => formatCurrency(r.outstanding) },
  ];

  const handleConfirm = async (row) => {
    try {
      await confirm(row.id).unwrap();
      enqueueSnackbar(t('messages.purchaseConfirmed'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.data?.message || t('messages.failed'), { variant: 'error' });
    }
  };

  const applyFilters = () => { setQuery(filters); setPage(0); };
  const resetFilters = () => { setFilters({}); setQuery({}); setPage(0); };

  return (
    <ListPageLayout>
      <PageHeader
        title={t('purchases.title', { ns: 'pages' })}
        subtitle={t('purchases.subtitle', { ns: 'pages' })}
        actionLabel={canCreate ? t('purchases.new', { ns: 'pages' }) : undefined}
        actionIcon={<AddIcon />}
        onAction={canCreate ? () => navigate('/purchases/new') : undefined}
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        selects={[
          {
            key: 'supplierId',
            label: 'Supplier',
            options: (suppliersData?.data || []).map((s) => ({ value: s.id, label: s.name })),
          },
          {
            key: 'status',
            label: 'Status',
            options: [{ value: 'DRAFT', label: 'Draft' }, { value: 'CONFIRMED', label: 'Confirmed' }],
          },
        ]}
      />
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={isLoading}
        page={page} limit={limit} total={data?.meta?.total || 0}
        onPageChange={setPage} onLimitChange={setLimit}
        onEdit={canUpdate ? (row) => navigate(`/purchases/${row.id}`) : undefined}
        onDelete={canDelete ? async (row) => {
          if (window.confirm(t('messages.deleteQuestion'))) {
            await remove(row.id);
            enqueueSnackbar(t('messages.deleted'), { variant: 'success' });
          }
        } : undefined}
        actions={canUpdate || canDelete}
        helpTopic="purchases"
      />
      {canUpdate && (data?.data || []).filter(r => r.status === 'DRAFT').length > 0 && (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {(data?.data || []).filter(r => r.status === 'DRAFT').map(r => (
            <Button key={r.id} size="small" onClick={() => handleConfirm(r)}>
              {t('purchases.confirmItem', { ns: 'pages', number: r.purchaseNumber })}
            </Button>
          ))}
        </Stack>
      )}
    </ListPageLayout>
  );
}
