const prisma = require('../../config/database');
const { toNumber, round } = require('../../utils/calculations');
const { calculateDepreciation } = require('../assets/asset.service');
const { buildDateRange } = require('../../utils/listQuery');

const getPLStatement = async (query = {}) => {
  const saleWhere = { deletedAt: null, status: 'CONFIRMED', ...buildDateRange('saleDate', query.from, query.to) };
  const [directSalesAgg, indirectSalesAgg, expenseAggs, assets] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...saleWhere, saleType: 'DIRECT' },
      _sum: { netAmount: true, grossAmount: true, totalCost: true, profit: true },
    }),
    prisma.sale.aggregate({
      where: { ...saleWhere, saleType: 'INDIRECT' },
      _sum: { netAmount: true, grossAmount: true, totalCost: true, profit: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { deletedAt: null, ...buildDateRange('expenseDate', query.from, query.to) },
      _sum: { amount: true },
    }),
    prisma.asset.findMany({ where: { deletedAt: null }, include: { assetType: true } }),
  ]);

  const directSalesRevenue = toNumber(directSalesAgg._sum.netAmount);
  const indirectSalesRevenue = toNumber(indirectSalesAgg._sum.netAmount);
  const revenue = round(directSalesRevenue + indirectSalesRevenue);
  const taxableRevenue = round(
    toNumber(directSalesAgg._sum.grossAmount) + toNumber(indirectSalesAgg._sum.grossAmount)
  );
  const cogs = round(toNumber(directSalesAgg._sum.totalCost) + toNumber(indirectSalesAgg._sum.totalCost));
  const grossProfit = round(taxableRevenue - cogs);
  const directExpenses = toNumber(expenseAggs.find(e => e.category === 'DIRECT')?._sum.amount);
  const indirectExpenses = toNumber(expenseAggs.find(e => e.category === 'INDIRECT')?._sum.amount);
  const depreciation = round(assets.reduce((sum, asset) => sum + Math.max(0, toNumber(asset.currentValue) - calculateDepreciation(asset)), 0));
  const operatingProfit = round(grossProfit - directExpenses);
  const netProfit = round(operatingProfit - indirectExpenses - depreciation);

  return {
    period: { from: query.from || null, to: query.to || null },
    directSalesRevenue,
    indirectSalesRevenue,
    revenue,
    taxableRevenue,
    cogs,
    grossProfit,
    directExpenses,
    operatingProfit,
    indirectExpenses,
    depreciation,
    netProfit,
    grossMarginPercent: taxableRevenue > 0 ? round((grossProfit / taxableRevenue) * 100, 2) : 0,
    netMarginPercent: revenue > 0 ? round((netProfit / revenue) * 100, 2) : 0,
  };
};

const bucketName = (days) => {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
};

const getAging = async () => {
  const [sales, purchases] = await Promise.all([
    prisma.sale.findMany({ where: { deletedAt: null, outstanding: { gt: 0 } }, include: { customer: true } }),
    prisma.purchase.findMany({ where: { deletedAt: null, outstanding: { gt: 0 } }, include: { supplier: true } }),
  ]);
  const buckets = {
    receivables: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
    payables: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
  };
  const today = new Date();
  const detail = { receivables: [], payables: [] };

  sales.forEach((sale) => {
    const dueDate = sale.dueDate || sale.saleDate;
    const days = Math.max(0, Math.floor((today - new Date(dueDate)) / 86400000));
    const bucket = bucketName(days);
    buckets.receivables[bucket] += toNumber(sale.outstanding);
    detail.receivables.push({ id: sale.id, number: sale.saleNumber, party: sale.customer?.name, dueDate, days, bucket, amount: toNumber(sale.outstanding) });
  });

  purchases.forEach((purchase) => {
    const dueDate = purchase.dueDate || purchase.purchaseDate;
    const days = Math.max(0, Math.floor((today - new Date(dueDate)) / 86400000));
    const bucket = bucketName(days);
    buckets.payables[bucket] += toNumber(purchase.outstanding);
    detail.payables.push({ id: purchase.id, number: purchase.purchaseNumber, party: purchase.supplier?.name, dueDate, days, bucket, amount: toNumber(purchase.outstanding) });
  });

  return { buckets, detail };
};

const getDayBook = async (query = {}) => {
  const [sales, purchases, payments, expenses] = await Promise.all([
    prisma.sale.findMany({ where: { deletedAt: null, ...buildDateRange('saleDate', query.from, query.to) }, include: { customer: true } }),
    prisma.purchase.findMany({ where: { deletedAt: null, ...buildDateRange('purchaseDate', query.from, query.to) }, include: { supplier: true } }),
    prisma.payment.findMany({ where: { deletedAt: null, ...buildDateRange('paymentDate', query.from, query.to) } }),
    prisma.expense.findMany({ where: { deletedAt: null, ...buildDateRange('expenseDate', query.from, query.to) }, include: { expenseType: true } }),
  ]);

  return [
    ...sales.map(s => ({ date: s.saleDate, type: 'SALE', number: s.saleNumber, party: s.customer?.name, debit: toNumber(s.netAmount), credit: 0, amount: toNumber(s.netAmount) })),
    ...purchases.map(p => ({ date: p.purchaseDate, type: 'PURCHASE', number: p.purchaseNumber, party: p.supplier?.name, debit: 0, credit: toNumber(p.netAmount), amount: toNumber(p.netAmount) })),
    ...payments.map(p => ({ date: p.paymentDate, type: `PAYMENT_${p.paymentType}`, number: p.referenceNo, party: p.entityType, debit: p.paymentType === 'PAID' ? toNumber(p.amount) : 0, credit: p.paymentType === 'RECEIVED' ? toNumber(p.amount) : 0, amount: toNumber(p.amount) })),
    ...expenses.map(e => ({ date: e.expenseDate, type: 'EXPENSE', number: e.referenceNo, party: e.expenseType?.name, debit: toNumber(e.amount), credit: 0, amount: toNumber(e.amount) })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
};

const getGstSummary = async (query = {}) => {
  const [sales, purchases] = await Promise.all([
    prisma.sale.aggregate({ where: { deletedAt: null, status: 'CONFIRMED', ...buildDateRange('saleDate', query.from, query.to) }, _sum: { gstTotal: true } }),
    prisma.purchase.aggregate({ where: { deletedAt: null, status: 'CONFIRMED', ...buildDateRange('purchaseDate', query.from, query.to) }, _sum: { gstTotal: true } }),
  ]);
  const outputGst = toNumber(sales._sum.gstTotal);
  const inputGst = toNumber(purchases._sum.gstTotal);
  return { outputGst, inputGst, payable: round(outputGst - inputGst) };
};

module.exports = { getPLStatement, calculatePL: getPLStatement, getAging, getDayBook, getGstSummary };
