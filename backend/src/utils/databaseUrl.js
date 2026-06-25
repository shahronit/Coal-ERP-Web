const { toSqliteDatabaseUrl } = require('./sqliteUrl');

const isPostgresUrl = (url = process.env.DATABASE_URL) =>
  typeof url === 'string' && /^postgres(ql)?:\/\//i.test(url);

const isSqliteUrl = (url = process.env.DATABASE_URL) =>
  typeof url === 'string' && url.startsWith('file:');

const resolveDatabaseUrl = ({ databasePath, databaseUrlEnv } = {}) => {
  if (databaseUrlEnv && (isPostgresUrl(databaseUrlEnv) || isSqliteUrl(databaseUrlEnv))) {
    return databaseUrlEnv;
  }
  if (databasePath) {
    return toSqliteDatabaseUrl(databasePath);
  }
  return databaseUrlEnv || '';
};

module.exports = {
  isPostgresUrl,
  isSqliteUrl,
  resolveDatabaseUrl,
  toSqliteDatabaseUrl,
};
