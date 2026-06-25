import { useState } from 'react';
import { Grid, Tabs, Tab } from '@mui/material';
import VirtualDataGrid from '../../components/VirtualDataGrid';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import {
  useGetStockQuery, useGetOverallStockQuery, useGetLedgerQuery,
  useListQualitiesQuery, useListLocationsQuery, useListPurchaseBatchesMasterQuery,
} from '../../store/api/services';
import { formatCurrency } from '../../utils/constants';
import KpiCard from '../../components/KpiCard';
import PageHeader from '../../components/PageHeader';
import InventoryIcon from '@mui/icons-material/Inventory';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../../components/ChartCard';
import { useChartStyles, BAR_RADIUS } from '../../utils/chartTheme';

export default function InventoryPage() {
  const chart = useChartStyles();
  const [tab, setTab] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data: qualitiesData } = useListQualitiesQuery({ limit: 200 });
  const { data: locationsData } = useListLocationsQuery({ limit: 200 });
  const { data: batchesData } = useListPurchaseBatchesMasterQuery({ limit: 200 });
  const { data: stock, isLoading } = useGetStockQuery(query);
  const { data: overallStock, isLoading: overallLoading } = useGetOverallStockQuery(query);
  const { data: ledger, isLoading: ledgerLoading } = useGetLedgerQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    ...query,
  }, { skip: tab !== 1 });

  const totalValue = (stock?.data || []).reduce((s, i) => s + (i.totalValue || 0), 0);
  const totalMT = (stock?.data || []).reduce((s, i) => s + (i.totalWeight || 0), 0);

  const overallRows = (overallStock?.data?.rows || []).map((r) => ({
    id: r.qualityId,
    quality: r.quality?.name,
    totalWeight: r.totalWeight,
    totalValue: r.totalValue,
    averageCostPerMT: r.averageCostPerMT,
    locations: Object.entries(r.byLocation || {}).map(([name, mt]) => `${name}: ${mt} MT`).join(' · '),
  }));

  const grandTotalMT = overallStock?.data?.grandTotalMT ?? totalMT;
  const grandTotalValue = overallStock?.data?.grandTotalValue ?? totalValue;

  const stockRows = (stock?.data || []).map((r, i) => ({
    id: `${r.qualityId}-${r.locationId || 'default'}-${i}`,
    quality: r.quality?.name,
    location: r.location?.name || '—',
    totalWeight: r.totalWeight,
    totalValue: r.totalValue,
    batches: r.batches?.length || 0,
  }));

  const ledgerRows = (ledger?.data || []).map((r) => ({
    id: r.id,
    createdAt: new Date(r.createdAt).toLocaleString(),
    quality: r.quality?.name,
    entryType: r.entryType,
    referenceType: r.referenceType,
    weightMT: r.weightMT,
    balanceMT: r.balanceMT,
    costPerMT: r.costPerMT,
  }));

  const applyFilters = () => {
    setQuery(filters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };
  const resetFilters = () => {
    setFilters({});
    setQuery({});
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const searchPlaceholder = tab === 1
    ? 'Search ledger entries…'
    : tab === 2
      ? 'Search coal quality…'
      : 'Search quality or location…';

  const toolbarSelects = [
    {
      key: 'qualityId',
      label: 'Coal Quality',
      options: (qualitiesData?.data || []).map((q) => ({ value: q.id, label: q.name })),
    },
    ...(tab !== 2 ? [{
      key: 'locationId',
      label: 'Location',
      options: (locationsData?.data || []).map((l) => ({ value: l.id, label: l.name })),
    }] : []),
    ...(tab === 1 ? [{
      key: 'purchaseBatchId',
      label: 'Purchase Batch',
      options: (batchesData?.data || []).map((b) => ({ value: b.id, label: `${b.code} — ${b.name}` })),
    }] : []),
  ];

  return (
    <ListPageLayout>
      <PageHeader title="Inventory Management" subtitle="FIFO stock by coal quality, overall holdings across locations, and stock ledger" />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard title="Overall Stock (MT)" value={Number(grandTotalMT).toFixed(2)} icon={<InventoryIcon />} loading={isLoading || overallLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard title="Overall Inventory Value" value={formatCurrency(grandTotalValue)} loading={isLoading || overallLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard title="Quality Lines" value={overallRows.length || stock?.data?.length || 0} loading={isLoading || overallLoading} />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={12}>
          <ChartCard title="Stock Value by Coal Quality" loading={isLoading}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockRows.slice(0, 10)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...chart.grid} />
                <XAxis dataKey="quality" {...chart.axis} tick={{ fill: chart.axis.tick.fill, fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} {...chart.axis} />
                <Tooltip {...chart.tooltip} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="totalValue" fill="#0891b2" radius={BAR_RADIUS} maxBarSize={40} name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <ListToolbar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        showDates={false}
        searchPlaceholder={searchPlaceholder}
        selects={toolbarSelects}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Current Stock" />
        <Tab label="Stock Ledger" />
        <Tab label="Overall Stock (All Locations)" />
      </Tabs>

      {tab === 0 && (
        <VirtualDataGrid
          columns={[
            { field: 'quality', headerName: 'Coal Quality', flex: 1.2 },
            { field: 'location', headerName: 'Location', flex: 1 },
            { field: 'totalWeight', headerName: 'Stock (MT)', flex: 1 },
            { field: 'totalValue', headerName: 'Value', flex: 1, valueFormatter: (v) => formatCurrency(v) },
            { field: 'batches', headerName: 'Batches', flex: 0.8 },
          ]}
          rows={stockRows}
          loading={isLoading}
        />
      )}
      {tab === 1 && (
        <VirtualDataGrid
          columns={[
            { field: 'createdAt', headerName: 'Date', flex: 1.2 },
            { field: 'quality', headerName: 'Quality', flex: 1 },
            { field: 'entryType', headerName: 'Type', flex: 0.8 },
            { field: 'referenceType', headerName: 'Ref', flex: 0.8 },
            { field: 'weightMT', headerName: 'Weight MT', flex: 0.8 },
            { field: 'balanceMT', headerName: 'Balance MT', flex: 0.8 },
          ]}
          rows={ledgerRows}
          loading={ledgerLoading}
          rowCount={ledger?.meta?.total}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
        />
      )}
      {tab === 2 && (
        <VirtualDataGrid
          columns={[
            { field: 'quality', headerName: 'Coal Quality', flex: 1.2 },
            { field: 'totalWeight', headerName: 'Total Stock (MT)', flex: 1 },
            { field: 'averageCostPerMT', headerName: 'Avg Cost/MT', flex: 1, valueFormatter: (v) => formatCurrency(v) },
            { field: 'totalValue', headerName: 'Value', flex: 1, valueFormatter: (v) => formatCurrency(v) },
            { field: 'locations', headerName: 'By Location', flex: 2 },
          ]}
          rows={overallRows}
          loading={overallLoading}
        />
      )}
    </ListPageLayout>
  );
}
