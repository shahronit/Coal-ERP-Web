const { ADJUSTMENT_BASIS, resolveLineIndex } = require('./adjustmentBasis');

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  return parseFloat(val.toString());
};

const round = (val, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(toNumber(val) * factor) / factor;
};

const FIFO_COST_BASIS = {
  EX_GST: 'EX_GST',
  INC_GST: 'INC_GST',
};

const resolveFifoCostPerMT = (batch, fifoCostBasis = FIFO_COST_BASIS.EX_GST) => {
  const exGst = toNumber(batch?.costPerMT);
  const incGst = toNumber(batch?.costPerMTIncGst);
  if (fifoCostBasis === FIFO_COST_BASIS.INC_GST) {
    return incGst > 0 ? incGst : exGst;
  }
  return exGst;
};

const weightedAverageCostPerMT = (items, rateKey) => {
  const totalWeight = items.reduce((s, item) => s + toNumber(item.weight), 0);
  if (totalWeight <= 0) return 0;
  const totalCost = items.reduce(
    (s, item) => s + toNumber(item.weight) * toNumber(item[rateKey]),
    0
  );
  return round(totalCost / totalWeight, 4);
};

const normalizeLineGst = (line, isIndirect = false) => {
  if (isIndirect || line.applyGst === false) {
    return { ...line, gstRate: 0 };
  }
  return { ...line, gstRate: toNumber(line.gstRate || 0) };
};

/** Gross profit = sale value (ex-GST) − purchase/FIFO cost (ex-GST) */
const calculateGrossProfit = (saleValueExGst, purchaseCostExGst) =>
  round(toNumber(saleValueExGst) - toNumber(purchaseCostExGst));

const lineGrossCost = (line) => {
  const weight = toNumber(line.weight);
  const rate = toNumber(line.rate);
  const freight = toNumber(line.freight || 0);
  const additionalExpenses = toNumber(line.additionalExpenses || 0);
  return round(weight * rate + freight + additionalExpenses);
};

const resolveAdjustment = (adj, grossSubtotal, lineItems = []) => {
  const value = toNumber(adj.value);
  const basisType = adj.basisType || ADJUSTMENT_BASIS.FLAT;
  if (basisType === ADJUSTMENT_BASIS.PERCENT) {
    return round(grossSubtotal * (value / 100));
  }
  if (basisType === ADJUSTMENT_BASIS.PER_MT) {
    const lineIndex = resolveLineIndex(adj, lineItems);
    const line = lineIndex != null ? lineItems[lineIndex] : null;
    const weight = toNumber(line?.weight);
    return round(value * weight);
  }
  return round(value);
};

const resolveAdjustments = (adjustments = [], grossSubtotal, lineItems = []) => {
  const items = adjustments.map((adj) => ({
    ...adj,
    resolvedAmount: resolveAdjustment(adj, grossSubtotal, lineItems),
  }));
  const total = round(items.reduce((s, a) => s + a.resolvedAmount, 0));
  return { items, total };
};

const calculatePurchaseDocument = ({
  lineItems,
  billStockPercent = 100,
  expenseAdjustments = [],
  incomeAdjustments = [],
  isIndirect = false,
}) => {
  const normalizedLines = isIndirect
    ? lineItems.map((line) => ({ ...line, freight: 0, additionalExpenses: 0, applyGst: false, gstRate: 0 }))
    : lineItems.map((line) => normalizeLineGst(line, isIndirect));
  const grossSubtotal = round(normalizedLines.reduce((s, l) => s + lineGrossCost(l), 0));
  const stockSubtotal = round(grossSubtotal * (toNumber(billStockPercent) / 100));
  const expenseResolved = resolveAdjustments(expenseAdjustments, grossSubtotal, normalizedLines);
  const incomeResolved = resolveAdjustments(incomeAdjustments, grossSubtotal, normalizedLines);
  const netDocumentCost = round(stockSubtotal - incomeResolved.total + expenseResolved.total);
  const totalWeight = normalizedLines.reduce((s, l) => s + toNumber(l.weight), 0);

  let freightTotal = 0;
  let expenseTotal = 0;
  let subtotal = 0;
  let gstTotal = 0;

  const results = normalizedLines.map((line) => {
    const weight = toNumber(line.weight);
    const rate = toNumber(line.rate);
    const gstRate = isIndirect ? 0 : toNumber(line.gstRate || 0);
    freightTotal += toNumber(line.freight);
    expenseTotal += toNumber(line.additionalExpenses);

    const lineNetCost = totalWeight > 0
      ? round(netDocumentCost * (weight / totalWeight))
      : 0;
    const costPerMT = weight > 0 ? round(lineNetCost / weight, 4) : 0;
    const gstAmount = isIndirect ? 0 : round(lineNetCost * (gstRate / 100));
    const netAmount = round(lineNetCost + gstAmount);
    const costPerMTIncGst = weight > 0 ? round(netAmount / weight, 4) : 0;

    subtotal += lineNetCost;
    gstTotal += gstAmount;

    return {
      ...line,
      baseCost: round(weight * rate),
      grossCost: lineGrossCost(line),
      stockCost: round(lineGrossCost(line) * (toNumber(billStockPercent) / 100)),
      totalCost: lineNetCost,
      costPerMT,
      costPerMTIncGst,
      gstAmount,
      netAmount,
    };
  });

  return {
    lineItems: results,
    grossSubtotal,
    subtotal: round(subtotal),
    freightTotal: round(freightTotal),
    expenseTotal: round(expenseTotal),
    expenseAdjustmentTotal: expenseResolved.total,
    incomeAdjustmentTotal: incomeResolved.total,
    expenseAdjustments: expenseResolved.items,
    incomeAdjustments: incomeResolved.items,
    gstTotal: round(gstTotal),
    netAmount: round(subtotal + gstTotal),
    outstanding: round(subtotal + gstTotal),
    averageCostPerMT: totalWeight > 0 ? round(netDocumentCost / totalWeight, 4) : 0,
  };
};

/** @deprecated Use calculatePurchaseDocument */
const calculatePurchaseLine = (line, billStockPercent = 100, incomeAdjustments = []) =>
  calculatePurchaseDocument({
    lineItems: [line],
    billStockPercent,
    incomeAdjustments,
  }).lineItems[0];

const calculateSaleDocument = ({
  lineItems,
  freightEntries = [],
  expenseAdjustments = [],
  incomeAdjustments = [],
  isIndirect = false,
}) => {
  const normalizedFreight = isIndirect ? [] : freightEntries;
  const normalizedLines = isIndirect
    ? lineItems.map((line) => ({ ...line, applyGst: false, gstRate: 0 }))
    : lineItems.map((line) => normalizeLineGst(line, isIndirect));
  const grossSubtotal = round(
    normalizedLines.reduce((s, l) => s + round(toNumber(l.weight) * toNumber(l.rate)), 0)
  );
  const expenseResolved = resolveAdjustments(expenseAdjustments, grossSubtotal, normalizedLines);
  const incomeResolved = resolveAdjustments(incomeAdjustments, grossSubtotal, normalizedLines);
  const freightTotal = round(normalizedFreight.reduce((s, f) => s + toNumber(f.amount), 0));
  const perLineFreight = normalizedLines.length > 0 ? freightTotal / normalizedLines.length : 0;
  const netAdjustment = round(incomeResolved.total - expenseResolved.total);

  let subtotal = 0;
  let grossAmount = 0;
  let gstTotal = 0;
  let netAmount = 0;

  const results = normalizedLines.map((line) => {
    const weight = toNumber(line.weight);
    const rate = toNumber(line.rate);
    const gstRate = isIndirect ? 0 : toNumber(line.gstRate || 0);
    const baseAmount = round(weight * rate);
    const lineAdjustment = grossSubtotal > 0
      ? round(netAdjustment * (baseAmount / grossSubtotal))
      : 0;
    const adjustedBase = round(baseAmount + lineAdjustment);
    const lineGross = round(adjustedBase + perLineFreight);
    const gstAmount = isIndirect ? 0 : round(lineGross * (gstRate / 100));
    const lineNet = round(lineGross + gstAmount);

    subtotal += baseAmount;
    grossAmount += lineGross;
    gstTotal += gstAmount;
    netAmount += lineNet;

    return {
      ...line,
      baseAmount,
      grossAmount: lineGross,
      gstAmount,
      netAmount: lineNet,
    };
  });

  const totalWeight = normalizedLines.reduce((s, l) => s + toNumber(l.weight), 0);

  return {
    lineItems: results,
    grossSubtotal,
    subtotal: round(subtotal),
    freightTotal,
    expenseAdjustmentTotal: expenseResolved.total,
    incomeAdjustmentTotal: incomeResolved.total,
    expenseAdjustments: expenseResolved.items,
    incomeAdjustments: incomeResolved.items,
    grossAmount: round(grossAmount),
    gstTotal: round(gstTotal),
    netAmount: round(netAmount),
    averageRatePerMT: totalWeight > 0 ? round(netAmount / totalWeight, 4) : 0,
  };
};

/** @deprecated Use calculateSaleDocument */
const calculateSaleLine = (line, freightTotal = 0) => {
  const rate = toNumber(line.rate);
  const gstRate = toNumber(line.gstRate || 0);
  const weight = toNumber(line.weight || 0);
  const baseAmount = round(weight * rate);
  const grossAmount = round(baseAmount + toNumber(freightTotal));
  const gstAmount = round(grossAmount * (gstRate / 100));
  const netAmount = round(grossAmount + gstAmount);
  return { baseAmount, grossAmount, gstAmount, netAmount };
};

const calculateSaleTotals = (lineItems, freightEntries = []) =>
  calculateSaleDocument({ lineItems, freightEntries });

/** Profit is always ex-GST: gross sale value − FIFO/purchase cost */
const grossMarginPercent = (revenueExGst, profit) => {
  const revenue = toNumber(revenueExGst);
  return revenue > 0 ? round((toNumber(profit) / revenue) * 100, 2) : 0;
};

const saleProfitMetrics = (sale) => {
  const revenue = toNumber(sale.grossAmount);
  const cost = toNumber(sale.totalCost);
  const profit = toNumber(sale.profit);
  return {
    revenue,
    cost,
    profit,
    marginPercent: grossMarginPercent(revenue, profit),
  };
};

module.exports = {
  toNumber,
  round,
  FIFO_COST_BASIS,
  ADJUSTMENT_BASIS,
  normalizeLineGst,
  calculateGrossProfit,
  grossMarginPercent,
  saleProfitMetrics,
  lineGrossCost,
  resolveAdjustment,
  resolveAdjustments,
  resolveFifoCostPerMT,
  weightedAverageCostPerMT,
  calculatePurchaseDocument,
  calculatePurchaseLine,
  calculateSaleDocument,
  calculateSaleLine,
  calculateSaleTotals,
};
