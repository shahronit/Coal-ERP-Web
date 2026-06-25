const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { startCronJobs } = require('./jobs/notificationCron');
const { bootstrapCloudDatabase } = require('./bootstrap/cloudBootstrap');

let server;
let cronStarted = false;

const startServer = async ({ port = config.port, host = config.host } = {}) => {
  if (server) return server;

  await connectDatabase();
  await bootstrapCloudDatabase();

  return new Promise((resolve, reject) => {
    server = app.listen(port, host, () => {
      const address = server.address();
      if (!cronStarted) {
        startCronJobs();
        cronStarted = true;
      }
      logger.info(`TradeCRM Pro API running on http://${host}:${address.port} (${config.isFirestoreProvider ? 'Firestore' : 'PostgreSQL'})`);
      resolve(server);
    });

    server.on('error', reject);
  });
};

const stopServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }
  await disconnectDatabase();
};

if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down');
    await stopServer();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down');
    await stopServer();
    process.exit(0);
  });
}

module.exports = { startServer, stopServer, app };
