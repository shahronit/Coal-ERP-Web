const prisma = require('../../config/database');
const { toNumber, saleProfitMetrics } = require('../../utils/calculations');
const { AppError } = require('../../utils/AppError');
const profitLoss = require('../profit-loss/profitLoss.service');

const getTransactions = profitLoss.getTransactions;
const getBatches = profitLoss.getBatches;

const getSaleProfitability = async (saleId) => {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, deletedAt: null },
    include: {
      customer: true,
      lineItems: {
        include: {
          quality: true,
          allocations: { include: { inventoryBatch: true } },
        },
      },
    },
  });
  if (!sale) throw new AppError('Sale not found', 404);

  const metrics = saleProfitMetrics(sale);

  return {
    sale,
    revenue: metrics.revenue,
    cost: metrics.cost,
    profit: metrics.profit,
    marginPercent: metrics.marginPercent,
    lineItems: sale.lineItems.map((line) => ({
      id: line.id,
      quality: line.quality,
      weight: toNumber(line.weight),
      rate: toNumber(line.rate),
      grossAmount: toNumber(line.grossAmount),
      netAmount: toNumber(line.netAmount),
      totalCost: toNumber(line.totalCost),
      profit: toNumber(line.profit),
    })),
  };
};

const getByProduct = profitLoss.getQualities;

const getByCustomer = async (query = {}) => {
  const result = await profitLoss.getTransactions({ ...query, limit: 10000, page: 1 });
  const map = new Map();

  result.data.forEach((row) => {
    const key = row.customer || 'Unknown';
    const current = map.get(key) || { customer: key, revenue: 0, cost: 0, profit: 0, saleCount: 0 };
    current.revenue += toNumber(row.revenue);
    current.cost += toNumber(row.cost);
    current.profit += toNumber(row.profit);
    current.saleCount += 1;
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
};

module.exports = {
  getTransactions,
  getSaleProfitability,
  getBatches,
  getByProduct,
  getByCustomer,
};
