const matchesFilter = (record, where) => {
  if (!where || Object.keys(where).length === 0) return true;

  if (where.AND && Array.isArray(where.AND)) {
    return where.AND.every((clause) => matchesFilter(record, clause));
  }
  if (where.OR && Array.isArray(where.OR)) {
    return where.OR.some((clause) => matchesFilter(record, clause));
  }
  if (where.NOT) {
    return !matchesFilter(record, where.NOT);
  }

  return Object.entries(where).every(([key, value]) => {
    if (['AND', 'OR', 'NOT'].includes(key)) return true;
    const field = record[key];

    if (value === null) return field == null;

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if (value.equals !== undefined) return field === value.equals;
      if (value.in !== undefined) return value.in.includes(field);
      if (value.notIn !== undefined) return !value.notIn.includes(field);
      if (value.gt !== undefined) return field > value.gt;
      if (value.gte !== undefined) return field >= value.gte;
      if (value.lt !== undefined) return field < value.lt;
      if (value.lte !== undefined) return field <= value.lte;
      if (value.contains !== undefined) {
        return String(field || '').toLowerCase().includes(String(value.contains).toLowerCase());
      }
      if (value.startsWith !== undefined) {
        return String(field || '').toLowerCase().startsWith(String(value.startsWith).toLowerCase());
      }
      if (value.not !== undefined) return field !== value.not;
      // Nested relation filter handled upstream
      return true;
    }

    return field === value;
  });
};

const sortRecords = (records, orderBy) => {
  if (!orderBy) return records;
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...records].sort((a, b) => {
    for (const clause of entries) {
      const [field, dir] = Object.entries(clause)[0];
      const av = a[field];
      const bv = b[field];
      if (av === bv) continue;
      if (av == null) return dir === 'asc' ? -1 : 1;
      if (bv == null) return dir === 'asc' ? 1 : -1;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

const paginateRecords = (records, { skip = 0, take } = {}) => {
  const start = skip || 0;
  if (take === undefined) return records.slice(start);
  return records.slice(start, start + take);
};

const sumField = (records, field) =>
  records.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);

const groupRecords = (records, { by, _sum = {}, _count = {} }) => {
  const groups = new Map();
  records.forEach((row) => {
    const key = by.map((f) => row[f]).join('|');
    if (!groups.has(key)) {
      groups.set(key, { ...Object.fromEntries(by.map((f) => [f, row[f]])), _count: { _all: 0 } });
    }
    const g = groups.get(key);
    g._count._all += 1;
    Object.keys(_sum).forEach((field) => {
      g._sum = g._sum || {};
      g._sum[field] = (g._sum[field] || 0) + (Number(row[field]) || 0);
    });
  });
  return [...groups.values()];
};

module.exports = {
  matchesFilter,
  sortRecords,
  paginateRecords,
  sumField,
  groupRecords,
};
