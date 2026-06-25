const config = require('../config');
const logger = require('../config/logger');
const prisma = require('../config/prismaClient');
const { ensureDemoUsers } = require('../services/demoSeed/demoSeedService');

/** Create demo login users when the database is empty (first deploy on Render, etc.) */
const bootstrapCloudDatabase = async () => {
  if (config.isFirestoreProvider) return;

  const userCount = await prisma.user.count({ where: { deletedAt: null } });
  if (userCount > 0) return;

  await ensureDemoUsers();
  logger.info('Initial demo users created (empty database bootstrap)');
};

module.exports = { bootstrapCloudDatabase };
