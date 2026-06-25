import { calcSalePreview, formatAdjustmentBasisLabel, formatCurrency, resolveAdjustmentPreview } from './constants';

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

export const buildSaleBillLines = ({
  lineItems = [],
  freightEntries = [],
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

  const preview = calcSalePreview(
    lineItems,
    freightEntries,
    expenseAdjustments,
    incomeAdjustments,
    isIndirect,
  );

  const normalizedFreight = isIndirect ? [] : freightEntries;
  const grossSubtotal = lineItems.reduce(
    (s, l) => s + (Number(l.weight) || 0) * (Number(l.rate) || 0),
    0,
  );
  const expenseTotal = expenseAdjustments.reduce(
    (s, a) => s + resolveAdjustmentPreview(a, grossSubtotal, lineItems),
    0,
  );
  const incomeTotal = incomeAdjustments.reduce(
    (s, a) => s + resolveAdjustmentPreview(a, grossSubtotal, lineItems),
    0,
  );
  const freightTotal = normalizedFreight.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const perLineFreight = lineItems.length ? freightTotal / lineItems.length : 0;
  const netAdjustment = incomeTotal - expenseTotal;
  const totalWeight = lineItems.reduce((s, l) => s + (Number(l.weight) || 0), 0);

  const rows = [];
  const push = (row) => rows.push(row);

  push({ key: 'sec-coal', label: 'Sale Entries', section: true });

  lineItems.forEach((line, idx) => {
    const weight = Number(line.weight) || 0;
    const rate = Number(line.rate) || 0;
    const gstRate = isIndirect || line.applyGst === false ? 0 : (Number(line.gstRate) || 0);
    const qualityName = resolveQualityName(line, qualityMap);
    const baseAmount = weight * rate;
    const lineAdjustment = grossSubtotal > 0 ? netAdjustment * (baseAmount / grossSubtotal) : 0;
    const lineGross = baseAmount + lineAdjustment + perLineFreight;
    const lineGst = lineGross * (gstRate / 100);
    const lineNet = lineGross + lineGst;
    const truckDetail = line.truckNumber ? `Truck: ${line.truckNumber}` : '';
    const rateDetail = weight > 0 ? `${formatCurrency(lineNet / weight)}/MT net` : '';

    push({
      key: `line-${idx}-header`,
      label: `Entry ${idx + 1} — ${qualityName}`,
      detail: [truckDetail, rateDetail].filter(Boolean).join(' · '),
      weight,
      rate,
      bold: true,
      groupHeader: true,
      groupSubtotal: isIndirect ? baseAmount + lineAdjustment : lineNet,
    });

    push({
      key: `line-${idx}-base`,
      label: 'Base amount',
      detail: `${weight} MT × ₹${formatRate(rate)}/MT`,
      weight,
      rate,
      amount: baseAmount,
      indent: true,
    });

    if (lineAdjustment !== 0) {
      push({
        key: `line-${idx}-adj`,
        label: 'Doc. adjustment share',
        detail: lineAdjustment >= 0 ? 'Income/expense head allocation' : 'Income/expense head credit',
        amount: lineAdjustment,
        negative: lineAdjustment < 0,
        indent: true,
      });
    }

    if (!isIndirect) {
      push({
        key: `line-${idx}-freight-share`,
        label: 'Freight share',
        detail: freightTotal > 0 ? `Allocated from ₹${formatRate(freightTotal)} total freight` : 'No freight',
        amount: perLineFreight,
        indent: true,
      });
      push({
        key: `line-${idx}-gross`,
        label: 'Line gross',
        detail: 'Base + adjustments + freight share',
        amount: lineGross,
        indent: true,
      });
      push({
        key: `line-${idx}-gst`,
        label: `GST @ ${gstRate}%`,
        detail: 'On line gross amount',
        amount: lineGst,
        indent: true,
      });
      push({
        key: `line-${idx}-net`,
        label: 'Line net',
        detail: 'Gross + GST',
        amount: lineNet,
        indent: true,
        bold: true,
      });
    }
  });

  if (!isIndirect) {
    push({ key: 'sec-freight', label: 'Freight Entries', section: true });
    if (normalizedFreight.length) {
      normalizedFreight.forEach((entry, idx) => {
        const amount = Number(entry.amount) || 0;
        const label = entry.description?.trim()
          ? entry.description
          : `Freight entry ${idx + 1}`;
        push({
          key: `freight-${idx}`,
          label,
          detail: entry.truckNumber ? `Truck: ${entry.truckNumber}` : 'Document freight',
          amount,
          indent: true,
        });
      });
    } else {
      push({
        key: 'freight-none',
        label: 'No freight entries',
        detail: '—',
        amount: 0,
        indent: true,
      });
    }
  }

  const filledExpenses = activeAdjustments(expenseAdjustments, 'expenseTypeId');
  if (filledExpenses.length) {
    push({ key: 'sec-doc-exp', label: 'Document Expenses', section: true });
    filledExpenses.forEach((adj, idx) => {
      const amount = resolveAdjustmentPreview(adj, grossSubtotal, lineItems);
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
      const amount = resolveAdjustmentPreview(adj, grossSubtotal, lineItems);
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
    detail: 'Sum of all sale entries',
    weight: totalWeight,
    amount: totalWeight,
    suffix: ' MT',
  });
  push({
    key: 'gross-sub',
    label: 'Base subtotal',
    detail: 'Weight × rate before adjustments',
    amount: preview.grossSubtotal,
  });
  if (expenseTotal > 0) {
    push({
      key: 'sum-doc-exp',
      label: 'Document expenses total',
      amount: expenseTotal,
    });
  }
  if (incomeTotal > 0) {
    push({
      key: 'sum-doc-inc',
      label: 'Document income total',
      amount: incomeTotal,
      negative: true,
    });
  }
  if (!isIndirect && freightTotal > 0) {
    push({
      key: 'sum-freight',
      label: 'Total freight',
      detail: `${normalizedFreight.length} freight entry/entries`,
      amount: freightTotal,
    });
  }
  push({
    key: 'gross',
    label: 'Gross amount',
    detail: 'After adjustments and freight',
    amount: preview.grossAmount,
  });
  if (!isIndirect) {
    push({
      key: 'gst',
      label: 'GST total',
      amount: preview.gstAmount,
    });
  }
  push({
    key: 'total',
    label: 'Net total',
    detail: 'Final invoice amount',
    amount: preview.netAmount,
    bold: true,
  });

  push({ key: 'sec-pmt', label: 'Unit Rate (Per MT)', section: true });
  push({
    key: 'avg-pmt',
    label: 'Avg rate (incl. all expenses)',
    detail: 'Net total ÷ total MT',
    weight: totalWeight,
    amount: preview.averageRatePerMT,
    suffix: '/MT',
    bold: true,
  });

  return {
    rows,
    preview: {
      ...preview,
      totalWeight,
      expenseTotal,
      incomeTotal,
      freightTotal,
    },
  };
};
