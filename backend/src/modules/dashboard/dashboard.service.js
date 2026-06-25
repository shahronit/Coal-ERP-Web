const prisma = require('../../config/database');
const { getInventoryValue, getTotalStockMT } = require('../../services/inventory/fifoEngine');
const { toNumber, round } = require('../../utils/calculations');
const { calculateDepreciation } = require('../assets/asset.service');

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30000;

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
};

const getSummary = async () => {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  const today = todayRange();

  const [
    purchaseAgg,
    saleAgg,
    todayPurchases,
    todaySales,
    expenseAgg,
    investmentAgg,
    assets,
    payables,
    receivables,
    inventoryValue,
    stockMT,
  ] = await Promise.all([
    prisma.purchase.aggregate({ where: { deletedAt: null, status: 'CONFIRMED' }, _sum: { netAmount: true } }),
    prisma.sale.aggregate({ where: { deletedAt: null, status: 'CONFIRMED' }, _sum: { netAmount: true, profit: true } }),
    prisma.purchase.aggregate({
      where: { deletedAt: null, status: 'CONFIRMED', purchaseDate: today },
      _sum: { netAmount: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { deletedAt: null, status: 'CONFIRMED', saleDate: today },
      _sum: { netAmount: true, profit: true },
      _count: true,
    }),
    prisma.expense.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
    prisma.partnerInvestment.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
    prisma.asset.findMany({ where: { deletedAt: null }, include: { assetType: true } }),
    prisma.purchase.aggregate({ where: { deletedAt: null, outstanding: { gt: 0 } }, _sum: { outstanding: true } }),
    prisma.sale.aggregate({ where: { deletedAt: null, outstanding: { gt: 0 } }, _sum: { outstanding: true } }),
    getInventoryValue(),
    getTotalStockMT(),
  ]);

  const assetValue = assets.reduce((s, a) => s + calculateDepreciation(a), 0);

  cache = {
    currentStockMT: round(stockMT, 3),
    inventoryValue: round(inventoryValue),
    todayPurchases: toNumber(todayPurchases._sum.netAmount),
    todayPurchaseCount: todayPurchases._count,
    todaySales: toNumber(todaySales._sum.netAmount),
    todayProfit: toNumber(todaySales._sum.profit),
    todaySaleCount: todaySales._count,
    totalPurchases: toNumber(purchaseAgg._sum.netAmount),
    totalSales: toNumber(saleAgg._sum.netAmount),
    netProfit: toNumber(saleAgg._sum.profit),
    outstandingPayables: toNumber(payables._sum.outstanding),
    outstandingReceivables: toNumber(receivables._sum.outstanding),
    partnerInvestments: toNumber(investmentAgg._sum.amount),
    expenses: toNumber(expenseAgg._sum.amount),
    assets: round(assetValue),
  };
  cacheTime = now;
  return cache;
};

const groupByMonth = (records, dateField, sums) => {
  const groups = new Map();
  records.forEach((row) => {
    const d = row[dateField] instanceof Date ? row[dateField] : new Date(row[dateField]);
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    if (!groups.has(key)) {
      groups.set(key, { year, month, total: 0, cost: 0, profit: 0 });
    }
    const g = groups.get(key);
    if (sums.netAmount) g.total += Number(row.netAmount) || 0;
    if (sums.subtotal) g.cost += Number(row.subtotal) || 0;
    if (sums.totalCost) g.cost += Number(row.totalCost) || 0;
    if (sums.profit) g.profit += Number(row.profit) || 0;
  });
  return groups;
};

const getMonthlyTrends = async () => {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
    });
  }

  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({
      where: { deletedAt: null, status: 'CONFIRMED' },
      select: { purchaseDate: true, netAmount: true, subtotal: true },
    }),
    prisma.sale.findMany({
      where: { deletedAt: null, status: 'CONFIRMED' },
      select: { saleDate: true, netAmount: true, totalCost: true, profit: true },
    }),
  ]);

  const pMap = groupByMonth(purchases, 'purchaseDate', { netAmount: true, subtotal: true });
  const sMap = groupByMonth(sales, 'saleDate', { netAmount: true, totalCost: true, profit: true });

  return months.map((m) => {
    const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
    const p = pMap.get(key);
    const s = sMap.get(key);
    return {
      label: m.label,
      purchases: toNumber(p?.total),
      purchaseCost: toNumber(p?.cost),
      sales: toNumber(s?.total),
      cost: toNumber(s?.cost),
      profit: toNumber(s?.profit),
      revenue: toNumber(s?.total),
    };
  });
};

const getTopCustomers = async (limit = 10) => {
  const sales = await prisma.sale.groupBy({
    by: ['customerId'],
    where: { deletedAt: null, status: 'CONFIRMED' },
    _sum: { netAmount: true },
    orderBy: { _sum: { netAmount: 'desc' } },
    take: limit,
  });
  const customers = await prisma.customer.findMany({ where: { id: { in: sales.map((s) => s.customerId) } } });
  return sales.map((s) => ({
    customerId: s.customerId,
    name: customers.find((c) => c.id === s.customerId)?.name || 'Unknown',
    total: toNumber(s._sum.netAmount),
  }));
};

const getTopSuppliers = async (limit = 10) => {
  const purchases = await prisma.purchase.groupBy({
    by: ['supplierId'],
    where: { deletedAt: null, status: 'CONFIRMED' },
    _sum: { netAmount: true },
    orderBy: { _sum: { netAmount: 'desc' } },
    take: limit,
  });
  const suppliers = await prisma.supplier.findMany({ where: { id: { in: purchases.map((p) => p.supplierId) } } });
  return purchases.map((p) => ({
    supplierId: p.supplierId,
    name: suppliers.find((s) => s.id === p.supplierId)?.name || 'Unknown',
    total: toNumber(p._sum.netAmount),
  }));
};

const getQualityStock = async () => {
  const batches = await prisma.inventoryBatch.findMany({
    where: { remainingWeight: { gt: 0 } },
    include: { quality: true },
  });
  const map = new Map();
  batches.forEach((b) => {
    const row = map.get(b.qualityId) || { quality: b.quality, weightMT: 0, value: 0 };
    row.weightMT += toNumber(b.remainingWeight);
    row.value += toNumber(b.remainingWeight) * toNumber(b.costPerMT);
    map.set(b.qualityId, row);
  });
  return Array.from(map.values()).map((r) => ({
    name: r.quality?.name || 'Unknown',
    weightMT: round(r.weightMT, 3),
    value: round(r.value),
  }));
};

const invalidateCache = () => { cache = null; };

module.exports = {
  getSummary,
  getKPIs: getSummary,
  getMonthlyTrends,
  getTopCustomers,
  getTopSuppliers,
  getQualityStock,
  invalidateCache,
};
