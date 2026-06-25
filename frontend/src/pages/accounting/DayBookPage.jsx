import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import FilterBar from '../../components/FilterBar';
import SectionCard from '../../components/SectionCard';
import PageHeader from '../../components/PageHeader';
import PageLayout from '../../components/PageLayout';
import { useGetDayBookQuery } from '../../store/api/services';
import { formatCurrency, formatDate } from '../../utils/constants';

export default function DayBookPage() {
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState({});
  const { data } = useGetDayBookQuery(query);
  const rows = data?.data || [];

  return (
    <PageLayout>
      <PageHeader
        title="Day Book"
        subtitle="A unified chronological register of sales, purchases, payments, and expenses."
      />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={() => setQuery(filters)}
        onReset={() => { setFilters({}); setQuery({}); }}
      />
      <SectionCard title="Voucher Register" noDivider>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>No.</TableCell>
              <TableCell>Party</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.type}-${row.number}-${index}`} hover>
                <TableCell>{formatDate(row.date)}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.number || '-'}</TableCell>
                <TableCell>{row.party || '-'}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(row.debit)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(row.credit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </PageLayout>
  );
}
