import { useMemo } from 'react';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { formatCurrency, formatDate } from '../utils/constants';
import { groupBillRows } from '../utils/billPreviewGrouping';

/** GST-style invoice grid colours */
const INVOICE = {
  border: '1px solid #7eb3d4',
  headerBg: '#c8e0f4',
  highlightBg: '#e8f4fc',
  totalBg: '#d6eaf7',
  sectionBg: '#b8d9ef',
  text: '#1a3a52',
};

const gridTableSx = {
  borderCollapse: 'collapse',
  border: INVOICE.border,
  bgcolor: '#fff',
  '& .MuiTableCell-root': {
    border: INVOICE.border,
    px: 1.25,
    py: 0.85,
    fontSize: '0.8125rem',
    color: INVOICE.text,
    verticalAlign: 'middle',
  },
};

const headerCellSx = {
  fontWeight: 700,
  fontSize: '0.75rem',
  textAlign: 'center',
  bgcolor: INVOICE.headerBg,
  color: INVOICE.text,
  whiteSpace: 'nowrap',
  lineHeight: 1.3,
};

const amountColumnSx = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  textAlign: 'right',
  pr: 2.5,
};

const formatAmount = (row) => {
  if (row.amount === undefined || row.amount === null) return '—';
  const value = row.negative ? -Math.abs(row.amount) : row.amount;
  const formatted = row.negative
    ? `(${formatCurrency(Math.abs(row.amount))})`
    : formatCurrency(value);
  return `${formatted}${row.suffix || ''}`;
};

const formatQty = (row) => {
  if (row.weight === undefined || row.weight === null || row.weight === '') return '—';
  const qty = Number(row.weight);
  return Number.isFinite(qty) ? qty.toFixed(3) : '—';
};

const formatRateCell = (row) => {
  if (row.rate === undefined || row.rate === null || row.rate === '') return '—';
  const rate = Number(row.rate);
  return Number.isFinite(rate)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(rate)
    : '—';
};

const sectionHasRows = (section) =>
  section.groups.length > 0 || section.flatRows.length > 0;

const hasLineItems = (sections) => {
  const coal = sections.find((s) => s.key === 'sec-coal');
  return coal ? sectionHasRows(coal) : sections.some(sectionHasRows);
};

/** Flatten all bill sections into one sequential list for a single table. */
const flattenBillItems = (sections) => {
  const items = [];
  sections.filter(sectionHasRows).forEach((section) => {
    items.push({
      type: 'section-header',
      key: `header-${section.key}`,
      label: section.label,
      subtotal: section.sectionSubtotal,
    });
    if (section.grouped) {
      section.groups.forEach((group) => items.push({ type: 'group', key: group.key, data: group }));
    }
    section.flatRows.forEach((row) => items.push({ type: 'row', key: row.key, data: row }));
  });
  return items;
};

const ParticularsCell = ({ row, indent = 0 }) => (
  <TableCell sx={{ textAlign: 'left', pl: indent ? 3 : 1.25 }}>
    <Typography component="span" variant="body2" fontWeight={row.bold ? 700 : 600} sx={{ lineHeight: 1.35 }}>
      {row.label}
    </Typography>
  </TableCell>
);

const DetailCell = ({ row }) => (
  <TableCell
    sx={{
      color: 'text.secondary',
      fontSize: '0.75rem',
      textAlign: 'left',
      fontStyle: row.detail ? 'italic' : 'normal',
    }}
  >
    {row.detail || '—'}
  </TableCell>
);

const AmountCell = ({ row }) => (
  <TableCell
    align="right"
    sx={{
      ...amountColumnSx,
      fontWeight: row.bold ? 700 : 500,
      color: row.negative ? 'success.dark' : INVOICE.text,
    }}
  >
    {formatAmount(row)}
  </TableCell>
);

const QtyCell = ({ row, bold }) => (
  <TableCell
    align="right"
    sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: bold ? 700 : 400 }}
  >
    {formatQty(row)}
  </TableCell>
);

const RateCell = ({ row, bold }) => (
  <TableCell
    align="right"
    sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: bold ? 700 : 400 }}
  >
    {formatRateCell(row)}
  </TableCell>
);

const SrCell = ({ value, bold, section }) => (
  <TableCell
    align="center"
    sx={{
      width: 48,
      minWidth: 48,
      fontWeight: bold || section ? 700 : 500,
      bgcolor: section ? INVOICE.sectionBg : undefined,
      color: 'text.secondary',
    }}
  >
    {value ?? ''}
  </TableCell>
);

const SectionHeaderRow = ({ label, subtotal, highlighted }) => {
  const bg = highlighted ? INVOICE.sectionBg : '#fff';
  return (
    <TableRow sx={{ bgcolor: bg }}>
      <SrCell section={highlighted} />
      <TableCell colSpan={4} sx={{ fontWeight: 800, fontSize: '0.8125rem', bgcolor: bg, textAlign: 'left' }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={{ ...amountColumnSx, fontWeight: 700, bgcolor: bg }}>
        {subtotal !== undefined && subtotal !== 0 ? formatCurrency(subtotal) : ''}
      </TableCell>
    </TableRow>
  );
};

const DataRow = ({ row, srNo }) => {
  if (row.bold) {
    return (
      <TableRow>
        <SrCell bold />
        <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>
          {row.label}
        </TableCell>
        <QtyCell row={row} bold />
        <RateCell row={row} bold />
        <AmountCell row={row} />
      </TableRow>
    );
  }

  return (
    <TableRow>
      <SrCell value={srNo} />
      <ParticularsCell row={row} />
      <DetailCell row={row} />
      <QtyCell row={row} />
      <RateCell row={row} />
      <AmountCell row={row} />
    </TableRow>
  );
};

const GroupBlock = ({ group, srNo }) => (
  <>
    <TableRow>
      <SrCell value={srNo} bold />
      <TableCell colSpan={2} sx={{ fontWeight: 700, textAlign: 'left' }}>
        <Typography variant="body2" fontWeight={700}>{group.label}</Typography>
        {group.detail && (
          <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'block' }}>
            {group.detail}
          </Typography>
        )}
      </TableCell>
      <QtyCell row={group} bold />
      <RateCell row={group} bold />
      <TableCell align="right" sx={{ ...amountColumnSx, fontWeight: 700 }}>
        {formatCurrency(group.subtotal)}
      </TableCell>
    </TableRow>
    {group.rows.map((row, subIdx) => (
      <TableRow key={row.key}>
        <SrCell value={`${srNo}.${subIdx + 1}`} />
        <ParticularsCell row={row} indent />
        <DetailCell row={row} />
        <QtyCell row={row} />
        <RateCell row={row} />
        <AmountCell row={row} />
      </TableRow>
    ))}
  </>
);

const BillTableHead = () => (
  <TableHead>
    <TableRow>
      <TableCell sx={{ ...headerCellSx, width: 48 }}>Sr. No.</TableCell>
      <TableCell sx={{ ...headerCellSx, textAlign: 'left' }}>Particulars</TableCell>
      <TableCell sx={{ ...headerCellSx }}>Detail</TableCell>
      <TableCell sx={{ ...headerCellSx }}>Qty (MT)</TableCell>
      <TableCell sx={{ ...headerCellSx }}>Rate (₹/MT)</TableCell>
      <TableCell sx={{ ...headerCellSx, ...amountColumnSx, bgcolor: INVOICE.headerBg }}>Amount</TableCell>
    </TableRow>
  </TableHead>
);

const BillEmptyState = () => (
  <Box sx={{ px: 2, py: 4, textAlign: 'center', borderTop: INVOICE.border }}>
    <ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
    <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
      No items added yet
    </Typography>
    <Typography variant="body2" color="text.disabled">
      Add line items above to preview the bill
    </Typography>
  </Box>
);

const MetaItem = ({ label, value }) => {
  if (!value) return null;
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Grid>
  );
};

export default function PurchaseBillPreview({
  rows = [],
  title = 'Purchase Cost Bill (Preview)',
  purchaseType,
  purchaseDate,
  documentNumber,
  meta = {},
  footerNote = 'Loaded cost includes rate, freight, line expenses, and document expense/income heads.',
}) {
  const allSections = groupBillRows(rows);
  const showBillContent = hasLineItems(allSections);
  const billItems = useMemo(
    () => (showBillContent ? flattenBillItems(allSections) : []),
    [allSections, showBillContent],
  );

  let srNo = 0;

  const metaEntries = [
    ['Supplier', meta.supplier],
    ['Customer', meta.customer],
    ['Location', meta.location],
    ['Batch', meta.batch],
    ['Truck', meta.truckNumber],
    ['Status', meta.status],
    ['Notes', meta.notes],
  ].filter(([, value]) => value);

  const subtitleLine = [
    documentNumber,
    purchaseType || 'DIRECT',
    purchaseDate ? formatDate(purchaseDate) : null,
  ].filter(Boolean).join(' · ');

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        mt: 2,
        overflow: 'hidden',
        border: INVOICE.border,
        borderRadius: 0,
        boxShadow: '0 1px 4px rgba(30, 80, 120, 0.08)',
      }}
    >
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
              {title}
            </Typography>
            {subtitleLine && (
              <Typography variant="caption" sx={{ color: '#fff', opacity: 0.95, display: 'block', mt: 0.25 }}>
                {subtitleLine}
              </Typography>
            )}
          </Box>
          {meta.totalWeight > 0 && (
            <Chip
              size="small"
              label={`${Number(meta.totalWeight).toFixed(3)} MT total`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {metaEntries.length > 0 && (
        <Box sx={{ px: 2, py: 1.5, bgcolor: INVOICE.highlightBg, borderBottom: INVOICE.border }}>
          <Grid container spacing={1.5}>
            {metaEntries.map(([label, value]) => (
              <MetaItem key={label} label={label} value={value} />
            ))}
          </Grid>
        </Box>
      )}

      {!showBillContent ? (
        <BillEmptyState />
      ) : (
        <Box sx={{ px: 2, py: 2 }}>
          <TableContainer sx={{ border: INVOICE.border, borderRadius: 0, overflow: 'hidden' }}>
            <Table size="small" sx={gridTableSx}>
              <BillTableHead />
              <TableBody>
                {billItems.map((item) => {
                  if (item.type === 'section-header') {
                    return (
                      <SectionHeaderRow
                        key={item.key}
                        label={item.label}
                        subtotal={item.subtotal}
                        highlighted={item.key === 'header-sec-coal'}
                      />
                    );
                  }
                  srNo += 1;
                  if (item.type === 'group') {
                    return <GroupBlock key={item.key} group={item.data} srNo={srNo} />;
                  }
                  return <DataRow key={item.key} row={item.data} srNo={srNo} />;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box sx={{ px: 2, py: 1, bgcolor: '#fff', borderTop: INVOICE.border }}>
        <Typography variant="caption" color="text.secondary">
          {footerNote}
        </Typography>
      </Box>
    </Paper>
  );
}
