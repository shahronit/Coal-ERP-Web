const stringifyJson = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
};

const parseJson = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseJsonArray = (value) => {
  const parsed = parseJson(value, []);
  return Array.isArray(parsed) ? parsed : [];
};

const parseNotification = (notification) => notification && ({
  ...notification,
  metadata: parseJson(notification.metadata, null),
});

const parseAuditLog = (log) => log && ({
  ...log,
  previousValue: parseJson(log.previousValue, null),
  newValue: parseJson(log.newValue, null),
});

const parseReportTemplate = (template) => template && ({
  ...template,
  columns: parseJsonArray(template.columns),
  filters: parseJsonArray(template.filters),
  allowedRoles: parseJsonArray(template.allowedRoles),
});

const parseReportRun = (run) => run && ({
  ...run,
  filters: parseJson(run.filters, null),
});

module.exports = {
  stringifyJson,
  parseJson,
  parseJsonArray,
  parseNotification,
  parseAuditLog,
  parseReportTemplate,
  parseReportRun,
};
