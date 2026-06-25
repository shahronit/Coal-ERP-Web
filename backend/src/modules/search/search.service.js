const prisma = require('../../config/database');

const LIMIT_PER_TYPE = 5;

const mapPurchase = (r) => ({
  type: 'purchase',
  id: r.id,
  label: r.purchaseNumber,
  subtitle: [r.supplier?.name, r.truckNumber].filter(Boolean).join(' · '),
  route: `/purchases/${r.id}`,
});

const mapSale = (r) => ({
  type: 'sale',
  id: r.id,
  label: r.saleNumber,
  subtitle: [r.customer?.name, r.truckNumber].filter(Boolean).join(' · '),
  route: `/sales/${r.id}`,
});

const mapCustomer = (r) => ({
  type: 'customer',
  id: r.id,
  label: r.name,
  subtitle: r.gstin || r.email || 'Customer',
  route: '/masters/customers',
});

const mapSupplier = (r) => ({
  type: 'supplier',
  id: r.id,
  label: r.name,
  subtitle: r.gstin || 'Supplier',
  route: '/masters/suppliers',
});

const mapPartner = (r) => ({
  type: 'partner',
  id: r.id,
  label: r.name,
  subtitle: 'Partner',
  route: '/masters/partners',
});

const mapPurchaseBatch = (r) => ({
  type: 'purchaseBatch',
  id: r.id,
  label: `${r.code} — ${r.name}`,
  subtitle: 'Purchase batch',
  route: '/batches',
});

const mapSalesBatch = (r) => ({
  type: 'salesBatch',
  id: r.id,
  label: `${r.code} — ${r.name}`,
  subtitle: 'Sales batch',
  route: '/batches',
});

const mapPayment = (r) => ({
  type: 'payment',
  id: r.id,
  label: r.referenceNo || r.id.slice(0, 8).toUpperCase(),
  subtitle: `${r.paymentType} · ${r.entityType}`,
  route: '/payments',
});

const globalSearch = async (q, limit = 20) => {
  const term = (q || '').trim();
  if (!term) return [];

  const perType = Math.max(2, Math.ceil(limit / 8));

  const [
    purchases,
    sales,
    customers,
    suppliers,
    partners,
    purchaseBatches,
    salesBatches,
    payments,
  ] = await Promise.all([
    prisma.purchase.findMany({
      where: {
        deletedAt: null,
        OR: [
          { purchaseNumber: { contains: term } },
          { truckNumber: { contains: term } },
          { notes: { contains: term } },
        ],
      },
      include: { supplier: true },
      take: perType,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.findMany({
      where: {
        deletedAt: null,
        OR: [
          { saleNumber: { contains: term } },
          { truckNumber: { contains: term } },
          { notes: { contains: term } },
        ],
      },
      include: { customer: true },
      take: perType,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.findMany({
      where: { deletedAt: null, name: { contains: term } },
      take: perType,
    }),
    prisma.supplier.findMany({
      where: { deletedAt: null, name: { contains: term } },
      take: perType,
    }),
    prisma.partner.findMany({
      where: { deletedAt: null, name: { contains: term } },
      take: perType,
    }),
    prisma.purchaseBatch.findMany({
      where: {
        deletedAt: null,
        OR: [{ code: { contains: term } }, { name: { contains: term } }],
      },
      take: perType,
    }),
    prisma.salesBatch.findMany({
      where: {
        deletedAt: null,
        OR: [{ code: { contains: term } }, { name: { contains: term } }],
      },
      take: perType,
    }),
    prisma.payment.findMany({
      where: {
        deletedAt: null,
        OR: [{ referenceNo: { contains: term } }, { notes: { contains: term } }],
      },
      take: perType,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return [
    ...purchases.map(mapPurchase),
    ...sales.map(mapSale),
    ...customers.map(mapCustomer),
    ...suppliers.map(mapSupplier),
    ...partners.map(mapPartner),
    ...purchaseBatches.map(mapPurchaseBatch),
    ...salesBatches.map(mapSalesBatch),
    ...payments.map(mapPayment),
  ].slice(0, limit);
};

module.exports = { globalSearch };
