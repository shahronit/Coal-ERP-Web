const path = require('path');

const toSqliteDatabaseUrl = (filePath) => {
  const normalized = path.resolve(filePath).replace(/\\/g, '/');
  return `file:${normalized}`;
};

module.exports = { toSqliteDatabaseUrl };
