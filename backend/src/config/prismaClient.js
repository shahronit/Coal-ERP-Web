const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const config = require('./index');
const logger = require('./logger');
const { isPostgresUrl, isSqliteUrl } = require('../utils/databaseUrl');

fs.mkdirSync(config.dataDir, { recursive: true });

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

let connected = false;

const connectDatabase = async () => {
  if (connected) return prisma;

  await prisma.$connect();

  if (isSqliteUrl(config.databaseUrl)) {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout=10000;');
  } else if (isPostgresUrl(config.databaseUrl)) {
    logger.info('Connected to PostgreSQL database');
  }

  connected = true;
  return prisma;
};

const disconnectDatabase = async () => {
  if (!connected) return;
  await prisma.$disconnect();
  connected = false;
};

module.exports = prisma;
module.exports.connectDatabase = connectDatabase;
module.exports.disconnectDatabase = disconnectDatabase;
module.exports.isPostgres = () => isPostgresUrl(config.databaseUrl);
module.exports.isSqlite = () => isSqliteUrl(config.databaseUrl);
