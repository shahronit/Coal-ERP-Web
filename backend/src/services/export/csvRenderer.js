const { formatRows } = require('./formatters');

const writeCSV = (res, { title, filename, columns, rows, totals = {} }) => {
  const lines = [];
  lines.push(columns.map((c) => `"${c.label}"`).join(','));
  rows.forEach((row) => {
    lines.push(columns.map((c) => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(','));
  });
  if (Object.keys(totals).length) {
    lines.push('');
    lines.push(columns.map((c) => {
      if (totals[c.key] !== undefined) return `"${totals[c.key]}"`;
      return '""';
    }).join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(lines.join('\n'));
};

module.exports = { writeCSV, formatRows };
