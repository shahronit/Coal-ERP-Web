const prisma = require('../../config/database');
const { paginate } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { parseNotification } = require('../../utils/jsonFields');

const list = async (userId, query) => {
  const merged = mergeListQuery(query, { filterKeys: ['type'] });
  const result = await paginate('notification', {
    ...merged,
    searchFields: ['title', 'body'],
    filters: { userId, ...(merged.filters || {}) },
  });
  return { ...result, data: result.data.map(parseNotification) };
};

const markRead = (id, userId) =>
  prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });

const markAllRead = (userId) =>
  prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

const getUnreadCount = (userId) =>
  prisma.notification.count({ where: { userId, readAt: null } });

module.exports = { list, markRead, markAllRead, getUnreadCount };
