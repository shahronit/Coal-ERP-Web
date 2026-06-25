export const mapPurchaseAdjustmentFromApi = (adj, lineItems, typeKey, lineItemIdKey, nameKey, typeNameKey) => {
  const lineIndex = adj[lineItemIdKey]
    ? lineItems.findIndex((line) => line.id === adj[lineItemIdKey])
    : -1;
  return {
    [typeKey]: adj[typeKey],
    [nameKey]: adj[typeNameKey]?.name,
    basisType: adj.basisType || 'FLAT',
    value: parseFloat(adj.value),
    lineIndex: lineIndex >= 0 ? lineIndex : '',
    description: adj.description || '',
  };
};

export const mapSaleAdjustmentFromApi = mapPurchaseAdjustmentFromApi;

export const serializeAdjustment = (adj) => ({
  ...adj,
  value: Number(adj.value),
  lineIndex: adj.basisType === 'PER_MT' && adj.lineIndex !== '' && adj.lineIndex != null
    ? Number(adj.lineIndex)
    : undefined,
});
