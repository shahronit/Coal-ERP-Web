import { useMemo, useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import VirtualDataGrid from '../../components/VirtualDataGrid';
import { useListPurchaseBatchesQuery, useListSalesBatchesQuery } from '../../store/api/services';
import { formatCurrency, gridCurrencyFormatter } from '../../utils/constants';

function BatchTab({ type, search }) {
  const purchaseQuery = useListPurchaseBatchesQuery(undefined, { skip: type !== 'purchase' });
  const salesQuery = useListSalesBatchesQuery(undefined, { skip: type !== 'sales' });
  const { data, isLoading } = type === 'purchase' ? purchaseQuery : salesQuery;
  const rows = useMemo(() => {
    const items = (data?.data || []).map((item, idx) => ({
      id: item.batch?.id || idx,
      code: item.batch?.code,
      name: item.batch?.name,
      volumeMT: type === 'purchase' ? item.totalPurchasedMT : item.totalSoldMT,
      remainingMT: type === 'purchase' ? item.remainingMT : null,
      cost: item.totalCost,
      revenue: type === 'purchase' ? item.realizedRevenue : item.totalRevenue,
      profit: type === 'purchase' ? item.realizedProfit : item.totalProfit,
    }));
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(q));
  }, [data, search, type]);

  const columns = [
    { field: 'code', headerName: 'Code', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1.5 },
    { field: 'volumeMT', headerName: 'Volume (MT)', flex: 1 },
    ...(type === 'purchase'
      ? [{ field: 'remainingMT', headerName: 'Remaining (MT)', flex: 1 }]
      : []),
    { field: 'cost', headerName: 'Cost', flex: 1, valueFormatter: gridCurrencyFormatter },
    { field: 'revenue', headerName: 'Revenue (ex-GST)', flex: 1.2, valueFormatter: gridCurrencyFormatter },
    { field: 'profit', headerName: 'Gross Profit', flex: 1, valueFormatter: gridCurrencyFormatter },
  ];

  return <VirtualDataGrid columns={columns} rows={rows} loading={isLoading} rowCount={rows.length} />;
}

export default function BatchManagementPage() {
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});

  const applyFilters = () => setQuery(filters);
  const resetFilters = () => { setFilters({}); setQuery({}); };

  return (
    <ListPageLayout>
      <PageHeader
        title="Batch Management"
        subtitle="Gross profit = sale value (ex-GST) − FIFO cost. Purchase batches show realized totals from sold stock."
      />
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        showDates={false}
        searchPlaceholder="Search by batch code or name…"
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Purchase Batches" />
        <Tab label="Sales Batches" />
      </Tabs>
      {tab === 0
        ? <BatchTab key="purchase" type="purchase" search={query.search} />
        : <BatchTab key="sales" type="sales" search={query.search} />}
    </ListPageLayout>
  );
}
