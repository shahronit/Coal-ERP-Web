const ADJUSTMENT_BASIS = {
  FLAT: 'FLAT',
  PERCENT: 'PERCENT',
  PER_MT: 'PER_MT',
};

const ADJUSTMENT_BASIS_VALUES = Object.values(ADJUSTMENT_BASIS);

const resolveLineIndex = (adj, lineItems = []) => {
  if (adj.lineIndex != null && adj.lineIndex !== '') {
    return parseInt(adj.lineIndex, 10);
  }
  const lineItemId = adj.purchaseLineItemId || adj.saleLineItemId;
  if (lineItemId && lineItems.length) {
    const idx = lineItems.findIndex((line) => line.id === lineItemId);
    return idx >= 0 ? idx : null;
  }
  return null;
};

const lineItemIdAtIndex = (lineIds, lineIndex) => {
  if (lineIndex == null || lineIndex === '') return null;
  const idx = parseInt(lineIndex, 10);
  return lineIds[idx] || null;
};

module.exports = {
  ADJUSTMENT_BASIS,
  ADJUSTMENT_BASIS_VALUES,
  resolveLineIndex,
  lineItemIdAtIndex,
};
