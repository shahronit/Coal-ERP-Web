import { calcPurchasePreview, formatAdjustmentBasisLabel, formatCurrency, resolveAdjustmentPreview } from './constants';

const toNameMap = (items = []) => new Map(items.map((item) => [item.id, item.name]));

const formatRate = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(val) || 0);

const resolveQualityName = (line, qualityMap) =>
  line.qualityName || line.quality?.name || qualityMap.get(line.qualityId) || 'Coal quality';

const resolveExpenseName = (adj, map) =>
  adj.expenseTypeName || adj.expenseType?.name || map.get(adj.expenseTypeId) || 'Expense';

const resolveIncomeName = (adj, map) =>
  adj.incomeTypeName || adj.incomeType?.name || map.get(adj.incomeTypeId) || 'Income';

const activeAdjustments = (items, typeKey) =>
  (items || []).filter((item) => item[typeKey] && item.value !== '' && item.value !== null && item.value !== undefined);

const sumLineField = (lines, field) =>
  lines.reduce((s, line) => s + (Number(line[field]) || 0), 0);

export const buildPurchaseBillLines = ({
  lineItems = [],
  expenseAdjustments = [],
  incomeAdjustments = [],
  isIndirect = false,
  qualities = [],
  expenseTypes = [],
  incomeTypes = [],
}) => {
  const qualityMap = toNameMap(qualities);
  const expenseTypeMap = toNameMap(expenseTypes);
  const incomeTypeMap = toNameMap(incomeTypes);

  const preview = calcPurchasePreview(
    lineItems,
    expenseAdjustments,
    incomeAdjustments,
    isIndirect,
  );

  const normalizedLines = isIndirect
    ? lineItems.map((line) => ({ ...line, freight: 0, additionalExpenses: 0, gstRate: 0 }))
    : lineItems;

  const expenseAdjustmentTotal = expenseAdjustments.reduce(
    (s, a) => s + resolveAdjustmentPreview(a, preview.grossSubtotal, lineItems),
    0,
  );
  const incomeAdjustmentTotal = incomeAdjustments.reduce(
    (s, a) => s + resolveAdjustmentPreview(a, preview.grossSubtotal, lineItems),
    0,
  );
  const totalFreight = sumLineField(normalizedLines, 'freight');
  const totalLineExpenses = sumLineField(normalizedLines, 'additionalExpenses');
  const totalWeight = normalizedLines.reduce((s, l) => s + (Number(l.weight) || 0), 0);

  const rows = [];
  const push = (row) => rows.push(row);

  push({ key: 'sec-coal', label: 'Coal Lines', section: true });

  normalizedLines.forEach((line, idx) => {
    const weight = Number(line.weight) || 0;
    const rate = Number(line.rate) || 0;
    const freight = Number(line.freight) || 0;
    const additionalExpenses = Number(line.additionalExpenses) || 0;
    const qualityName = resolveQualityName(line, qualityMap);
    const linePreview = preview.linePreviews[idx];
    const gstRate = isIndirect || line.applyGst === false ? 0 : (Number(line.gstRate) || 0);
    const lineGst = linePreview ? (linePreview.lineNetCost || 0) * (gstRate / 100) : 0;
    const lineNetIncGst = linePreview ? (linePreview.lineNetCost || 0) + lineGst : 0;
    const truckDetail = line.truckNumber ? `Truck: ${line.truckNumber}` : '';
    const costDetail = linePreview
      ? `${formatCurrency(linePreview.costPerMT)}/MT ex-GST · ${formatCurrency(linePreview.costPerMTIncGst)}/MT inc-GST`
      : '';

    push({
      key: `line-${idx}-header`,
      label: `Line ${idx + 1} — ${qualityName}`,
      detail: [truckDetail, costDetail].filter(Boolean).join(' · '),
      weight,
      rate,
      bold: true,
      groupHeader: true,
      groupSubtotal: isIndirect ? (linePreview?.lineNetCost || 0) : lineNetIncGst,
    });

    push({
      key: `line-${idx}-base`,
      label: 'Base amount',
      detail: `${weight} MT × ₹${formatRate(rate)}/MT`,
      weight,
      rate,
      amount: weight * rate,
      indent: true,
    });

    if (!isIndirect) {
      push({
        key: `line-${idx}-freight`,
        label: 'Freight',
        detail: 'Line-level freight',
        amount: freight,
        indent: true,
      });
      push({
        key: `line-${idx}-expenses`,
        label: 'Line expenses',
        detail: 'Additional line expenses',
        amount: additionalExpenses,
        indent: true,
      });
      push({
        key: `line-${idx}-gst`,
        label: `GST @ ${gstRate}%`,
        detail: 'On loaded line cost (ex-GST)',
        amount: lineGst,
        indent: true,
      });
    }

    if (linePreview) {
      push({
        key: `line-${idx}-net`,
        label: 'Line loaded cost',
        detail: 'After document expense/income allocation',
        amount: linePreview.lineNetCost,
        indent: true,
        bold: true,
      });
      if (!isIndirect) {
        push({
          key: `line-${idx}-net-inc`,
          label: 'Line total (inc-GST)',
          detail: 'Loaded cost including GST',
          amount: lineNetIncGst,
          indent: true,
        });
      }
    }
  });

  const filledExpenses = activeAdjustments(expenseAdjustments, 'expenseTypeId');
  if (filledExpenses.length) {
    push({ key: 'sec-doc-exp', label: 'Document Expenses', section: true });
    filledExpenses.forEach((adj, idx) => {
      const amount = resolveAdjustmentPreview(adj, preview.grossSubtotal, lineItems);
      const typeName = resolveExpenseName(adj, expenseTypeMap);
      const basisLabel = formatAdjustmentBasisLabel(adj, lineItems);
      push({
        key: `doc-exp-${idx}`,
        label: typeName,
        detail: [adj.description, basisLabel].filter(Boolean).join(' · '),
        amount,
        indent: true,
      });
    });
  }

  const filledIncome = activeAdjustments(incomeAdjustments, 'incomeTypeId');
  if (filledIncome.length) {
    push({ key: 'sec-doc-inc', label: 'Document Income', section: true });
    filledIncome.forEach((adj, idx) => {
      const amount = resolveAdjustmentPreview(adj, preview.grossSubtotal, lineItems);
      const typeName = resolveIncomeName(adj, incomeTypeMap);
      const basisLabel = formatAdjustmentBasisLabel(adj, lineItems);
      push({
        key: `doc-inc-${idx}`,
        label: typeName,
        detail: [adj.description, basisLabel].filter(Boolean).join(' · '),
        amount,
        negative: true,
        indent: true,
      });
    });
  }

  push({ key: 'sec-summary', label: 'Bill Summary', section: true });
  push({
    key: 'total-weight',
    label: 'Total quantity',
    detail: 'Sum of all coal lines',
    weight: totalWeight,
    amount: totalWeight,
    suffix: ' MT',
  });
  push({
    key: 'gross',
    label: 'Gross subtotal',
    detail: 'Rate + freight + line expenses (before document heads)',
    amount: preview.grossSubtotal,
  });
  if (!isIndirect && totalFreight > 0) {
    push({
      key: 'sum-freight',
      label: 'Total freight',
      detail: 'All line freight combined',
      amount: totalFreight,
    });
  }
  if (!isIndirect && totalLineExpenses > 0) {
    push({
      key: 'sum-line-exp',
      label: 'Total line expenses',
      detail: 'All line-level expenses combined',
      amount: totalLineExpenses,
    });
  }
  if (expenseAdjustmentTotal > 0) {
    push({
      key: 'sum-doc-exp',
      label: 'Document expenses total',
      detail: 'Expense heads applied to bill',
      amount: expenseAdjustmentTotal,
    });
  }
  if (incomeAdjustmentTotal > 0) {
    push({
      key: 'sum-doc-inc',
      label: 'Document income total',
      detail: 'Income heads applied to bill',
      amount: incomeAdjustmentTotal,
      negative: true,
    });
  }
  push({
    key: 'net-cost',
    label: 'Net cost (ex-GST)',
    detail: 'Loaded cost before GST',
    amount: preview.netCost,
  });
  if (!isIndirect) {
    push({
      key: 'gst',
      label: 'GST total',
      detail: 'Sum of line GST',
      amount: preview.gstAmount,
    });
  }
  push({
    key: 'total',
    label: 'Grand total',
    detail: 'Final bill amount',
    amount: preview.netAmount,
    bold: true,
  });

  push({ key: 'sec-pmt', label: 'Unit Cost (Per MT)', section: true });
  preview.linePreviews.forEach((linePreview, idx) => {
    if (!normalizedLines[idx]) return;
    const weight = Number(normalizedLines[idx].weight) || 0;
    push({
      key: `pmt-${idx}`,
      label: `Line ${idx + 1} loaded cost`,
      detail: `ex-GST ${formatCurrency(linePreview.costPerMT)}/MT · inc-GST ${formatCurrency(linePreview.costPerMTIncGst)}/MT`,
      weight,
      amount: linePreview.costPerMTIncGst,
      suffix: '/MT',
      indent: true,
    });
  });
  push({
    key: 'avg-pmt',
    label: 'Avg loaded cost (incl. all expenses)',
    detail: 'Grand total ÷ total MT',
    weight: totalWeight,
    amount: preview.averageCostPerMT,
    suffix: '/MT',
    bold: true,
  });

  return {
    rows,
    preview: {
      ...preview,
      totalWeight,
      expenseAdjustmentTotal,
      incomeAdjustmentTotal,
      totalFreight,
      totalLineExpenses,
    },
  };
};
