export const toNumber = (val: unknown): number => {
  if (val === null || val === undefined) return 0;
  return parseFloat(String(val));
};

export const round = (val: unknown, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(toNumber(val) * factor) / factor;
};

export interface PurchaseLineInput {
  weight?: number;
  rate?: number;
  freight?: number;
  additionalExpenses?: number;
  gstRate?: number;
}

export interface IncomeAdjustment {
  amount?: number;
}

export const calculatePurchaseLine = (
  line: PurchaseLineInput,
  billStockPercent = 100,
  incomeAdjustments: IncomeAdjustment[] = []
) => {
  const rate = toNumber(line.rate);
  const freight = toNumber(line.freight);
  const additionalExpenses = toNumber(line.additionalExpenses);
  const gstRate = toNumber(line.gstRate);
  const weight = toNumber(line.weight);

  const baseCost = round(weight * rate);
  const freightCost = round(freight + additionalExpenses);
  const grossCost = round(baseCost + freightCost);
  const stockCost = round(grossCost * (toNumber(billStockPercent) / 100));
  const incomeAdjustmentTotal = round(
    incomeAdjustments.reduce((sum, adj) => sum + toNumber(adj.amount), 0)
  );
  const netCost = round(stockCost - incomeAdjustmentTotal);
  const costPerMT = weight > 0 ? round(netCost / weight, 4) : 0;
  const gstAmount = round(netCost * (gstRate / 100));
  const netAmount = round(netCost + gstAmount);

  return { baseCost, freightCost, grossCost, stockCost, incomeAdjustmentTotal, totalCost: netCost, costPerMT, gstAmount, netAmount };
};
