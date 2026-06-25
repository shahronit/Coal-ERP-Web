const GROUPED_SECTION_KEYS = new Set(['sec-coal', 'sec-freight']);

/** Top-to-bottom bill flow: lines → freight → charges → credits → unit rates → totals. */
const SECTION_ORDER = [
  'sec-coal',
  'sec-freight',
  'sec-doc-exp',
  'sec-doc-inc',
  'sec-pmt',
  'sec-summary',
];

const sectionSortIndex = (key) => {
  const index = SECTION_ORDER.indexOf(key);
  return index === -1 ? SECTION_ORDER.length : index;
};

/** Primary content + final totals visible; detail sections collapsed by default. */
const DEFAULT_EXPANDED = new Set(['sec-coal', 'sec-summary']);

const isGroupHeader = (row) =>
  row.groupHeader === true
  || /^line-\d+-header$/.test(row.key || '')
  || (row.bold && !row.indent && !row.section && (row.key || '').startsWith('line-'));

const sumAmounts = (items) =>
  items.reduce((total, row) => {
    if (row.amount === undefined || row.amount === null) return total;
    const value = Number(row.amount) || 0;
    return total + (row.negative ? -Math.abs(value) : value);
  }, 0);

const finalizeSection = (section) => {
  if (!section) return null;

  if (GROUPED_SECTION_KEYS.has(section.key)) {
    const groups = [];
    let currentGroup = null;

    section.pending.forEach((row) => {
      if (isGroupHeader(row)) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          key: row.key,
          label: row.label,
          detail: row.detail || '',
          weight: row.weight,
          rate: row.rate,
          rows: [],
          subtotal: row.groupSubtotal,
        };
        return;
      }

      if (currentGroup) {
        currentGroup.rows.push(row);
      } else {
        section.flatRows.push(row);
      }
    });

    if (currentGroup) groups.push(currentGroup);

    groups.forEach((group) => {
      if (group.subtotal === undefined || group.subtotal === null) {
        const netRow = group.rows.find((r) => r.key?.endsWith('-net-inc'))
          || group.rows.find((r) => r.key?.endsWith('-net') && r.bold);
        group.subtotal = netRow?.amount ?? sumAmounts(group.rows);
      }
    });

    return {
      key: section.key,
      label: section.label,
      defaultExpanded: section.defaultExpanded,
      grouped: true,
      groups,
      flatRows: section.flatRows,
      sectionSubtotal: groups.reduce((s, g) => s + g.subtotal, 0),
    };
  }

  return {
    key: section.key,
    label: section.label,
    defaultExpanded: section.defaultExpanded,
    grouped: false,
    groups: [],
    flatRows: section.pending,
    sectionSubtotal: sumAmounts(section.pending),
  };
};

export const groupBillRows = (rows = []) => {
  const sections = [];
  let current = null;

  rows.forEach((row) => {
    if (row.section) {
      if (current) sections.push(finalizeSection(current));
      current = {
        key: row.key,
        label: row.label,
        defaultExpanded: DEFAULT_EXPANDED.has(row.key),
        pending: [],
        flatRows: [],
      };
      return;
    }

    if (!current) return;
    current.pending.push(row);
  });

  if (current) sections.push(finalizeSection(current));

  return sections
    .filter(Boolean)
    .sort((a, b) => sectionSortIndex(a.key) - sectionSortIndex(b.key));
};
