const notificationService = require('./notification.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await notificationService.list(req.user.id, req.query);
    sendSuccess(res, result.data, 'Notifications retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await notificationService.markRead(req.params.id, req.user.id);
    sendSuccess(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    sendSuccess(res, { count });
  } catch (err) { next(err); }
};

module.exports = { list, markRead, markAllRead, unreadCount };
