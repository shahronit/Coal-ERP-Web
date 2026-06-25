const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value) || 0;
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(toNumber(value));

const formatPercent = (value) => `${formatNumber(value, 2)}%`;

const safeText = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const formatByType = (value, type) => {
  if (type === 'currency') return formatCurrency(value);
  if (type === 'date') return formatDate(value);
  if (type === 'datetime') return formatDateTime(value);
  if (type === 'number') return formatNumber(value);
  if (type === 'percent') return formatPercent(value);
  return safeText(value);
};

module.exports = {
  toNumber,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercent,
  safeText,
  formatByType,
};
