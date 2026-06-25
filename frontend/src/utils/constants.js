export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['all'],
  ADMIN: ['all'],
  FINANCE: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'payments', 'expenses', 'investments', 'assets', 'reports', 'documents', 'audit', 'notifications', 'batches', 'profit-loss', 'crm'],
  OPERATIONS: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'documents', 'notifications', 'batches', 'profit-loss', 'crm'],
  READ_ONLY: ['dashboard', 'masters', 'purchases', 'sales', 'inventory', 'payments', 'expenses', 'investments', 'assets', 'reports', 'documents', 'audit', 'notifications', 'batches', 'profit-loss', 'crm'],
};

export { buildCanAccess, canAccess, ROLES, ROLE_HIERARCHY, ROLE_LABELS, getAssignableRoles } from './roles';

export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

/** MUI DataGrid valueFormatter — accepts raw value or formatter params object */
export const gridCurrencyFormatter = (value) => {
  const raw = value != null && typeof value === 'object' && 'value' in value ? value.value : value;
  return formatCurrency(raw);
};

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

export const MASTER_CONFIGS = {
  partners: { title: 'Partners', fields: ['name', 'email', 'phone', 'profitShare'], api: 'partners' },
  suppliers: { title: 'Suppliers', fields: ['name', 'email', 'phone', 'gstin'], api: 'suppliers' },
  customers: { title: 'Customers', fields: ['name', 'email', 'phone', 'gstin'], api: 'customers' },
  'coal-qualities': { title: 'Coal Qualities', fields: ['name', 'description', 'gcv', 'ashPercent', 'moisturePercent'], api: 'coal-qualities' },
  'purchase-batches': { title: 'Purchase Batches', fields: ['code', 'name', 'startDate', 'endDate'], api: 'purchase-batches' },
  'sales-batches': { title: 'Sales Batches', fields: ['code', 'name', 'startDate', 'endDate'], api: 'sales-batches' },
  locations: { title: 'Locations', fields: ['name', 'address'], api: 'locations' },
  'expense-types': { title: 'Expense Types', fields: ['name', 'description'], api: 'expense-types' },
  'income-types': { title: 'Income Types', fields: ['name', 'description'], api: 'income-types' },
  'asset-types': { title: 'Asset Types', fields: ['name', 'depreciationRate'], api: 'asset-types' },
  'tax-configurations': { title: 'GST Rates', fields: ['name', 'gstRate', 'effectiveFrom'], api: 'tax-configurations' },
};

export const resolveAdjustmentPreview = (adj, grossSubtotal, lineItems = []) => {
  const value = Number(adj.value) || 0;
  if (adj.basisType === 'PERCENT') {
    return grossSubtotal * (value / 100);
  }
  if (adj.basisType === 'PER_MT') {
    const lineIndex = adj.lineIndex != null && adj.lineIndex !== '' ? Number(adj.lineIndex) : null;
    const line = lineIndex != null ? lineItems[lineIndex] : null;
    const weight = Number(line?.weight) || 0;
    return value * weight;
  }
  return value;
};

export const formatAdjustmentBasisLabel = (adj, lineItems = []) => {
  if (adj.basisType === 'PERCENT') {
    return `${adj.value}% of gross subtotal`;
  }
  if (adj.basisType === 'PER_MT') {
    const lineIndex = Number(adj.lineIndex);
    const line = lineItems[lineIndex];
    const weight = Number(line?.weight) || 0;
    const lineLabel = line?.qualityName || line?.quality?.name || `Line ${lineIndex + 1}`;
    return `${formatCurrency(Number(adj.value))}/MT × ${weight} MT (${lineLabel})`;
  }
  return 'Flat amount';
};

export const calcPurchasePreview = (lineItems, expenseAdjustments = [], incomeAdjustments = [], isIndirect = false) => {
  const normalizedLines = isIndirect
    ? lineItems.map((line) => ({ ...line, freight: 0, additionalExpenses: 0, applyGst: false, gstRate: 0 }))
    : lineItems.map((line) => (line.applyGst === false ? { ...line, gstRate: 0 } : line));

  const grossSubtotal = normalizedLines.reduce((s, line) => {
    const weight = Number(line.weight) || 0;
    const rate = Number(line.rate) || 0;
    const freight = Number(line.freight) || 0;
    const additionalExpenses = Number(line.additionalExpenses) || 0;
    return s + weight * rate + freight + additionalExpenses;
  }, 0);

  const expenseTotal = expenseAdjustments.reduce((s, a) => s + resolveAdjustmentPreview(a, grossSubtotal, normalizedLines), 0);
  const incomeTotal = incomeAdjustments.reduce((s, a) => s + resolveAdjustmentPreview(a, grossSubtotal, normalizedLines), 0);
  const netDocumentCost = grossSubtotal - incomeTotal + expenseTotal;
  const totalWeight = normalizedLines.reduce((s, l) => s + (Number(l.weight) || 0), 0);

  let netCost = 0;
  let gstAmount = 0;
  let netAmount = 0;
  const linePreviews = [];

  normalizedLines.forEach((line) => {
    const weight = Number(line.weight) || 0;
    const gstRate = isIndirect ? 0 : (Number(line.gstRate) || 0);
    const lineNetCost = totalWeight > 0 ? netDocumentCost * (weight / totalWeight) : 0;
    const lineGst = lineNetCost * (gstRate / 100);
    const lineNet = lineNetCost + lineGst;
    const costPerMT = weight > 0 ? lineNetCost / weight : 0;
    const costPerMTIncGst = weight > 0 ? lineNet / weight : 0;
    netCost += lineNetCost;
    gstAmount += lineGst;
    netAmount += lineNet;
    linePreviews.push({ costPerMT, costPerMTIncGst, lineNetCost: lineNetCost, gstAmount: lineGst });
  });

  return {
    grossSubtotal,
    netCost,
    gstAmount,
    netAmount,
    averageCostPerMT: totalWeight > 0 ? netAmount / totalWeight : 0,
    linePreviews,
  };
};

export const calcSalePreview = (lineItems, freightEntries = [], expenseAdjustments = [], incomeAdjustments = [], isIndirect = false) => {
  const normalizedFreight = isIndirect ? [] : freightEntries;
  const normalizedLines = isIndirect
    ? lineItems.map((line) => ({ ...line, applyGst: false, gstRate: 0 }))
    : lineItems.map((line) => (line.applyGst === false ? { ...line, gstRate: 0 } : line));
  const grossSubtotal = normalizedLines.reduce((s, l) => s + (Number(l.weight) || 0) * (Number(l.rate) || 0), 0);
  const expenseTotal = expenseAdjustments.reduce((s, a) => s + resolveAdjustmentPreview(a, grossSubtotal, normalizedLines), 0);
  const incomeTotal = incomeAdjustments.reduce((s, a) => s + resolveAdjustmentPreview(a, grossSubtotal, normalizedLines), 0);
  const freightTotal = normalizedFreight.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const perLineFreight = normalizedLines.length ? freightTotal / normalizedLines.length : 0;
  const netAdjustment = incomeTotal - expenseTotal;

  let grossAmount = 0;
  let gstAmount = 0;
  let netAmount = 0;
  let totalWeight = 0;
  const linePreviews = [];

  normalizedLines.forEach((line) => {
    const weight = Number(line.weight) || 0;
    const rate = Number(line.rate) || 0;
    const gstRate = isIndirect ? 0 : (Number(line.gstRate) || 0);
    const baseAmount = weight * rate;
    const lineAdjustment = grossSubtotal > 0 ? netAdjustment * (baseAmount / grossSubtotal) : 0;
    const lineGross = baseAmount + lineAdjustment + perLineFreight;
    const lineGst = lineGross * (gstRate / 100);
    grossAmount += lineGross;
    gstAmount += lineGst;
    netAmount += lineGross + lineGst;
    totalWeight += weight;
    linePreviews.push({ grossAmount: lineGross, gstAmount: lineGst, netAmount: lineGross + lineGst });
  });

  return {
    grossSubtotal,
    grossAmount,
    gstAmount,
    netAmount,
    averageRatePerMT: totalWeight > 0 ? netAmount / totalWeight : 0,
    linePreviews,
  };
};

/** @deprecated use calcSalePreview with full args */
export const calcSaleLinePreview = (line, freightTotal = 0) => {
  const weight = Number(line.weight) || 0;
  const rate = Number(line.rate) || 0;
  const gstRate = Number(line.gstRate) || 0;
  const baseAmount = weight * rate;
  const grossAmount = baseAmount + freightTotal;
  const gstAmount = grossAmount * (gstRate / 100);
  return { baseAmount, grossAmount, gstAmount, netAmount: grossAmount + gstAmount };
};
