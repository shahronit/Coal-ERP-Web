import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DocumentExportCard from './DocumentExportCard';

export default function DocumentsTab({
  sales,
  purchases,
  payments,
  expenses,
  investments,
  onDownload,
}) {
  const { t } = useTranslation('pages');

  const documents = [
    {
      key: 'sales',
      title: t('reports.documents.salesInvoice'),
      rows: sales,
      label: (r) => `${r.saleNumber} - ${r.customer?.name || ''}`,
    },
    {
      key: 'purchases',
      title: t('reports.documents.purchaseBill'),
      rows: purchases,
      label: (r) => `${r.purchaseNumber} - ${r.supplier?.name || ''}`,
    },
    {
      key: 'payments',
      title: t('reports.documents.paymentReceipt'),
      rows: payments,
      label: (r) => `${r.paymentDate?.slice?.(0, 10) || ''} - ${r.paymentType} - ₹${r.amount}`,
    },
    {
      key: 'expenses',
      title: t('reports.documents.expenseVoucher'),
      rows: expenses,
      label: (r) => `${r.expenseDate?.slice?.(0, 10) || ''} - ₹${r.amount}`,
    },
    {
      key: 'investments',
      title: t('reports.documents.investmentStatement'),
      rows: investments,
      label: (r) => `${r.partner?.name || r.partnerId || ''} - ₹${r.amount}`,
    },
  ];

  return (
    <Grid container spacing={2}>
      {documents.map((doc, index) => (
        <Grid size={{ xs: 12, md: 6 }} key={doc.key}>
          <DocumentExportCard
            docKey={doc.key}
            title={doc.title}
            rows={doc.rows}
            getLabel={doc.label}
            index={index}
            onDownload={(id, format) => onDownload(doc.key, id, format)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
