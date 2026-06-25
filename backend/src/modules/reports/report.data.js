const prisma = require('../../config/database');
const { toNumber } = require('../../services/export/formatters');
const { getAvailableStock } = require('../../services/inventory/fifoEngine');
const { getROIDashboard } = require('../investments/investment.service');
const { buildDateRange } = require('../../utils/listQuery');

const purchaseReport = async (query) => {
  const where = {
    deletedAt: null,
    status: query.status || 'CONFIRMED',
    ...buildDateRange('purchaseDate', query.from, query.to),
  };
  if (query.supplierId) where.supplierId = query.supplierId;
  return prisma.purchase.findMany({
    where,
    include: { supplier: true, location: true, purchaseBatch: true },
    orderBy: { purchaseDate: 'desc' },
  });
};

const salesReport = async (query) => {
  const where = {
    deletedAt: null,
    status: query.status || 'CONFIRMED',
    ...buildDateRange('saleDate', query.from, query.to),
  };
  if (query.customerId) where.customerId = query.customerId;
  return prisma.sale.findMany({
    where,
    include: { customer: true, salesBatch: true },
    orderBy: { saleDate: 'desc' },
  });
};

const profitReport = async (query) => {
  const sales = await salesReport(query);
  return sales.map(s => ({
    saleNumber: s.saleNumber,
    date: s.saleDate,
    customer: s.customer?.name,
    revenue: toNumber(s.netAmount),
    cost: toNumber(s.totalCost),
    profit: toNumber(s.profit),
  }));
};

const inventoryReport = async (query) => getAvailableStock(query || {});

const partnerROIReport = async () => getROIDashboard();

const expensesReport = async (query) => {
  const where = {
    deletedAt: null,
    ...buildDateRange('expenseDate', query.from, query.to),
  };
  if (query.category) where.category = query.category;
  return prisma.expense.findMany({
    where,
    include: { expenseType: true },
    orderBy: { expenseDate: 'desc' },
  });
};

const paymentsReport = async (query) => {
  const where = {
    deletedAt: null,
    ...buildDateRange('paymentDate', query.from, query.to),
  };
  if (query.paymentType) where.paymentType = query.paymentType;
  if (query.entityType) where.entityType = query.entityType;
  return prisma.payment.findMany({
    where,
    orderBy: { paymentDate: 'desc' },
  });
};

module.exports = {
  purchaseReport,
  salesReport,
  profitReport,
  inventoryReport,
  partnerROIReport,
  expensesReport,
  paymentsReport,
};
