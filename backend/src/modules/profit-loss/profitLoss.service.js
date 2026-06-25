const prisma = require('../../config/database');
const { toNumber, round, saleProfitMetrics } = require('../../utils/calculations');
const { calculatePL } = require('../accounting/accounting.service');
const batchService = require('../batches/batch.service');
const { buildDateRange, applyTextSearch } = require('../../utils/listQuery');

const paginateArray = (items, page = 1, limit = 20) => {
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);
  const start = (p - 1) * l;
  return {
    data: items.slice(start, start + l),
    meta: { page: p, limit: l, total: items.length, totalPages: Math.ceil(items.length / l) },
  };
};

const getTransactions = async (query = {}) => {
  const where = {
    deletedAt: null,
    status: 'CONFIRMED',
    ...buildDateRange('saleDate', query.from, query.to),
  };
  if (query.customerId) where.customerId = query.customerId;

  const sales = await prisma.sale.findMany({
    where,
    include: { customer: true, lineItems: { include: { quality: true } } },
    orderBy: { saleDate: 'desc' },
  });

  let rows = sales.map((sale) => {
    const metrics = saleProfitMetrics(sale);
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate,
      saleType: sale.saleType,
      customer: sale.customer?.name,
      revenue: metrics.revenue,
      cost: metrics.cost,
      profit: metrics.profit,
      marginPercent: metrics.marginPercent,
    };
  });

  rows = applyTextSearch(rows, query.search, (r) => [r.saleNumber, r.customer, r.saleType]);

  return paginateArray(rows, query.page, query.limit);
};

const getBatches = async (query = {}) => {
  const purchaseSummaries = await batchService.listSummaries('purchase');
  const salesSummaries = await batchService.listSummaries('sales');
  let rows = [
    ...purchaseSummaries.map((s) => ({
      type: 'PURCHASE',
      batch: s.batch,
      volumeMT: s.totalPurchasedMT,
      remainingMT: s.remainingMT,
      revenue: s.realizedRevenue,
      cost: s.totalCost,
      profit: s.realizedProfit,
    })),
    ...salesSummaries.map((s) => ({
      type: 'SALES',
      batch: s.batch,
      volumeMT: s.totalSoldMT,
      remainingMT: 0,
      revenue: s.totalRevenue,
      cost: s.totalCost,
      profit: s.totalProfit,
    })),
  ];

  rows = applyTextSearch(rows, query.search, (r) => [
    r.batch?.code,
    r.batch?.name,
    r.type,
  ]);

  return paginateArray(rows, query.page, query.limit);
};

const getMonthly = async (query = {}) => {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'short', year: '2-digit' }) });
  }

  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({
      where: { deletedAt: null, status: 'CONFIRMED', ...buildDateRange('purchaseDate', query.from, query.to) },
      select: { purchaseDate: true, subtotal: true, netAmount: true },
    }),
    prisma.sale.findMany({
      where: { deletedAt: null, status: 'CONFIRMED', ...buildDateRange('saleDate', query.from, query.to) },
      select: { saleDate: true, grossAmount: true, totalCost: true, profit: true },
    }),
  ]);

  return months.map((m) => {
    const monthPurchases = purchases.filter((p) => {
      const d = new Date(p.purchaseDate);
      return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
    });
    const monthSales = sales.filter((s) => {
      const d = new Date(s.saleDate);
      return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
    });
    const revenue = monthSales.reduce((s, x) => s + toNumber(x.grossAmount), 0);
    const cost = monthSales.reduce((s, x) => s + toNumber(x.totalCost), 0)
      + monthPurchases.reduce((s, x) => s + toNumber(x.subtotal), 0);
    const profit = monthSales.reduce((s, x) => s + toNumber(x.profit), 0);
    return { label: m.label, revenue: round(revenue), cost: round(cost), profit: round(profit) };
  });
};

const getPartners = async () => {
  const partners = await prisma.partner.findMany({ where: { deletedAt: null } });
  const totalProfit = toNumber((await prisma.sale.aggregate({
    where: { deletedAt: null, status: 'CONFIRMED' },
    _sum: { profit: true },
  }))._sum.profit);

  return partners.map((p) => ({
    partner: p,
    profitShare: toNumber(p.profitShare),
    allocatedProfit: round(totalProfit * (toNumber(p.profitShare) / 100)),
  }));
};

const getQualities = async (query = {}) => {
  const allocations = await prisma.inventoryAllocation.findMany({
    where: {
      saleLineItem: {
        sale: { deletedAt: null, status: 'CONFIRMED', ...buildDateRange('saleDate', query.from, query.to) },
      },
    },
    include: { saleLineItem: { include: { quality: true } } },
  });

  const map = new Map();
  allocations.forEach((a) => {
    const quality = a.saleLineItem.quality;
    if (!quality) return;
    const row = map.get(quality.id) || { quality, revenue: 0, cost: 0, profit: 0, weightMT: 0 };
    row.revenue += toNumber(a.allocatedRevenue);
    row.cost += toNumber(a.allocatedCost);
    row.profit += toNumber(a.profit);
    row.weightMT += toNumber(a.weight);
    map.set(quality.id, row);
  });

  return Array.from(map.values()).map((row) => ({
    ...row,
    revenue: round(row.revenue),
    cost: round(row.cost),
    profit: round(row.profit),
    marginPercent: row.revenue > 0 ? round((row.profit / row.revenue) * 100, 2) : 0,
  })).sort((a, b) => b.profit - a.profit);
};

const getAnalytics = async (query = {}) => calculatePL({ from: query.from, to: query.to });

module.exports = {
  getTransactions,
  getBatches,
  getMonthly,
  getPartners,
  getQualities,
  getAnalytics,
};
