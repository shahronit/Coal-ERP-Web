const buildDateRange = (field, from, to) => {
  if (!from && !to) return {};
  const value = {};
  if (from) value.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    value.lte = end;
  }
  return { [field]: value };
};

const pickFilters = (query, keys) => {
  const filters = {};
  keys.forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') filters[key] = value;
  });
  return filters;
};

const mergeListQuery = (query, { dateField, filterKeys = [] }) => {
  const { from, to, search, page, limit, sort, order, ...rest } = query;
  return {
    page,
    limit,
    sort,
    order,
    search,
    filters: {
      ...pickFilters({ ...query, ...rest }, filterKeys),
      ...buildDateRange(dateField, from, to),
    },
  };
};

const applyTextSearch = (rows, search, getFields) => {
  const q = String(search || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    getFields(row).some((v) => String(v ?? '').toLowerCase().includes(q))
  );
};

module.exports = { buildDateRange, pickFilters, mergeListQuery, applyTextSearch };
