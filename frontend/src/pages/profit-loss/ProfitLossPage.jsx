import { useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import ListToolbar from '../../components/ListToolbar';
import ListPageLayout from '../../components/ListPageLayout';
import VirtualDataGrid from '../../components/VirtualDataGrid';
import ChartCard from '../../components/ChartCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  useGetPLTransactionsQuery, useGetPLBatchesQuery, useGetPLMonthlyQuery,
  useGetPLPartnersQuery, useGetPLQualitiesQuery, useListCustomersQuery,
} from '../../store/api/services';
import { formatCurrency, gridCurrencyFormatter } from '../../utils/constants';

export default function ProfitLossPage() {
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data: customersData } = useListCustomersQuery({ limit: 200 }, { skip: tab !== 0 });
  const { data: tx, isLoading: txLoading } = useGetPLTransactionsQuery({ limit: 100, ...query }, { skip: tab !== 0 });
  const { data: batches, isLoading: batchesLoading } = useGetPLBatchesQuery({ limit: 100, ...query }, { skip: tab !== 1 });
  const { data: monthly, isLoading: monthlyLoading } = useGetPLMonthlyQuery(query, { skip: tab !== 2 && tab !== 5 });
  const { data: partners, isLoading: partnersLoading } = useGetPLPartnersQuery(undefined, { skip: tab !== 3 });
  const { data: qualities, isLoading: qualitiesLoading } = useGetPLQualitiesQuery(query, { skip: tab !== 4 });

  const txRows = (tx?.data || []).map((r) => ({ id: r.id, ...r }));
  const batchRows = (batches?.data || []).map((r, i) => ({
    id: `${r.type}-${r.batch?.id || i}`,
    type: r.type,
    name: r.batch?.name,
    volumeMT: r.volumeMT,
    cost: r.cost,
    profit: r.profit,
    revenue: r.revenue,
  }));
  const partnerRows = (partners?.data || []).map((r, i) => ({ id: r.partner?.id || i, name: r.partner?.name, profitShare: r.profitShare, allocatedProfit: r.allocatedProfit }));
  const qualityRows = (qualities?.data || []).map((r, i) => ({ id: r.quality?.id || i, name: r.quality?.name, weightMT: r.weightMT, profit: r.profit, marginPercent: r.marginPercent }));

  const applyFilters = () => setQuery(filters);
  const resetFilters = () => { setFilters({}); setQuery({}); };

  return (
    <ListPageLayout>
      <PageHeader title="Profit & Loss" subtitle="Transaction, batch, monthly, partner and quality-wise profitability" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Transactions" />
        <Tab label="Batches" />
        <Tab label="Monthly" />
        <Tab label="Partners" />
        <Tab label="Qualities" />
        <Tab label="Analytics" />
      </Tabs>

      {(tab === 0 || tab === 1 || tab === 2 || tab === 4) && (
        <ListToolbar
          filters={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onReset={resetFilters}
          searchPlaceholder={tab === 1 ? 'Search batch code or name…' : undefined}
          selects={tab === 0 ? [{
            key: 'customerId',
            label: 'Customer',
            options: (customersData?.data || []).map((c) => ({ value: c.id, label: c.name })),
          }] : []}
        />
      )}

      {tab === 0 && (
        <VirtualDataGrid
          columns={[
            { field: 'saleNumber', headerName: 'Sale', flex: 1 },
            { field: 'saleType', headerName: 'Type', flex: 0.7 },
            { field: 'customer', headerName: 'Customer', flex: 1.2 },
            { field: 'revenue', headerName: 'Revenue (ex-GST)', flex: 1, valueFormatter: gridCurrencyFormatter },
            { field: 'cost', headerName: 'Cost', flex: 1, valueFormatter: gridCurrencyFormatter },
            { field: 'profit', headerName: 'Gross Profit', flex: 1, valueFormatter: gridCurrencyFormatter },
          ]}
          rows={txRows}
          loading={txLoading}
        />
      )}
      {tab === 1 && (
        <VirtualDataGrid
          columns={[
            { field: 'type', headerName: 'Type', flex: 0.8 },
            { field: 'name', headerName: 'Batch', flex: 1.5 },
            { field: 'volumeMT', headerName: 'Volume MT', flex: 1 },
            { field: 'cost', headerName: 'Cost', flex: 1, valueFormatter: gridCurrencyFormatter },
            { field: 'revenue', headerName: 'Revenue (ex-GST)', flex: 1.2, valueFormatter: gridCurrencyFormatter },
            { field: 'profit', headerName: 'Gross Profit', flex: 1, valueFormatter: gridCurrencyFormatter },
          ]}
          rows={batchRows}
          loading={batchesLoading}
        />
      )}
      {tab === 2 && (
        <ChartCard title="Monthly Profit" subtitle="Revenue vs cost (ex-GST)" loading={monthlyLoading}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthly?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#2563eb" name="Revenue" />
              <Bar dataKey="cost" fill="#f59e0b" name="Cost" />
              <Bar dataKey="profit" fill="#16a34a" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      {tab === 3 && (
        <VirtualDataGrid
          columns={[
            { field: 'name', headerName: 'Partner', flex: 1.5 },
            { field: 'profitShare', headerName: 'Share %', flex: 1 },
            { field: 'allocatedProfit', headerName: 'Allocated Profit', flex: 1, valueFormatter: gridCurrencyFormatter },
          ]}
          rows={partnerRows}
          loading={partnersLoading}
        />
      )}
      {tab === 4 && (
        <VirtualDataGrid
          columns={[
            { field: 'name', headerName: 'Quality', flex: 1.5 },
            { field: 'weightMT', headerName: 'Sold MT', flex: 1 },
            { field: 'profit', headerName: 'Gross Profit', flex: 1, valueFormatter: gridCurrencyFormatter },
            { field: 'marginPercent', headerName: 'Margin %', flex: 1 },
          ]}
          rows={qualityRows}
          loading={qualitiesLoading}
        />
      )}
      {tab === 5 && (
        <ChartCard title="Revenue vs Cost Analytics" subtitle="12-month trend (ex-GST)" loading={monthlyLoading}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthly?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#1d4ed8" name="Revenue" />
              <Bar dataKey="cost" fill="#dc2626" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </ListPageLayout>
  );
}
