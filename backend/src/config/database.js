const config = require('./index');
const { isPostgresUrl, isSqliteUrl } = require('../utils/databaseUrl');
const {
  getDb,
  connectDatabase,
  disconnectDatabase,
  isFirestore,
  isPostgres: isPostgresProvider,
} = require('../db');

const handler = {
  get(_target, prop) {
    if (prop === 'connectDatabase') return connectDatabase;
    if (prop === 'disconnectDatabase') return disconnectDatabase;
    if (prop === 'isPostgres') {
      return () => (isPostgresProvider() ? isPostgresUrl(config.databaseUrl) : false);
    }
    if (prop === 'isSqlite') {
      return () => (isPostgresProvider() ? isSqliteUrl(config.databaseUrl) : false);
    }
    if (prop === 'isFirestore') return isFirestore;

    const db = getDb();
    const value = db[prop];
    if (typeof value === 'function') return value.bind(db);
    return value;
  },
};

module.exports = new Proxy({}, handler);
