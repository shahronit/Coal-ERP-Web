const cron = require('node-cron');
const prisma = require('../config/database');
const config = require('../config');
const logger = require('../config/logger');
const { createDueNotifications } = require('../modules/activities/activity.service');
const { parseJson, stringifyJson } = require('../utils/jsonFields');
const { ensureMonthlyBackup, runBackup } = require('../services/backup/backupService');

const checkPaymentDue = async () => {
  const overdue = await prisma.purchase.findMany({
    where: {
      deletedAt: null,
      outstanding: { gt: 0 },
      dueDate: { lt: new Date() },
    },
    take: 50,
  });

  const users = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] }, deletedAt: null },
  });

  for (const purchase of overdue) {
    for (const user of users) {
        const recentNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          type: 'PAYMENT_DUE',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
        const exists = recentNotifications.some(notification =>
          parseJson(notification.metadata, {})?.purchaseId === purchase.id
        );
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'PAYMENT_DUE',
            title: 'Payment Due',
            body: `Purchase ${purchase.purchaseNumber} has outstanding ₹${purchase.outstanding}.`,
              metadata: stringifyJson({ purchaseId: purchase.id }),
          },
        });
      }
    }
  }
};

const checkLowInventory = async () => {
  const batches = await prisma.inventoryBatch.findMany({
    include: { quality: true },
  });

  const stockByQuality = {};
  for (const batch of batches) {
    if (!stockByQuality[batch.qualityId]) {
      stockByQuality[batch.qualityId] = { quality: batch.quality, remaining: 0, original: 0 };
    }
    stockByQuality[batch.qualityId].remaining += parseFloat(batch.remainingWeight || 0);
    stockByQuality[batch.qualityId].original += parseFloat(batch.originalWeight || 0);
  }

  const opsUsers = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS'] }, deletedAt: null },
  });

  for (const { quality, remaining, original } of Object.values(stockByQuality)) {
    if (!quality || original <= 0) continue;
    if ((remaining / original) * 100 >= config.lowStockThresholdPercent) continue;

    for (const user of opsUsers) {
      const recentNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          type: 'LOW_INVENTORY',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      const exists = recentNotifications.some((notification) =>
        parseJson(notification.metadata, {})?.qualityId === quality.id
      );
      if (exists) continue;

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'LOW_INVENTORY',
          title: 'Low Inventory Alert',
          body: `${quality.name} stock is below ${config.lowStockThresholdPercent}% threshold.`,
          metadata: stringifyJson({ qualityId: quality.id, remaining }),
        },
      });
    }
  }
};

const startCronJobs = () => {
  ensureMonthlyBackup();

  cron.schedule('0 8 * * *', async () => {
    try {
      await checkPaymentDue();
      await checkLowInventory();
      await createDueNotifications();
      logger.info('Scheduled notification checks completed');
    } catch (err) {
      logger.error('Cron job failed', { error: err.message });
    }
  });
  cron.schedule('0 2 1 * *', async () => {
    try {
      await runBackup();
      logger.info('Monthly local backup completed');
    } catch (err) {
      logger.error('Monthly backup failed', { error: err.message });
    }
  });
  logger.info('Cron jobs scheduled');
};

module.exports = { startCronJobs, checkPaymentDue, checkLowInventory };
