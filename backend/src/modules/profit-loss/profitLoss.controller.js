const service = require('./profitLoss.service');
const { sendSuccess } = require('../../utils/response');

const wrap = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req.query);
    if (result.data) {
      sendSuccess(res, result.data, 'Profit & loss data retrieved', 200, result.meta);
    } else {
      sendSuccess(res, result, 'Profit & loss data retrieved');
    }
  } catch (err) { next(err); }
};

module.exports = {
  getTransactions: wrap(service.getTransactions),
  getBatches: wrap(service.getBatches),
  getMonthly: (req, res, next) => {
    service.getMonthly(req.query).then((data) => sendSuccess(res, data, 'Monthly profit retrieved')).catch(next);
  },
  getPartners: (req, res, next) => {
    service.getPartners().then((data) => sendSuccess(res, data, 'Partner profit retrieved')).catch(next);
  },
  getQualities: (req, res, next) => {
    service.getQualities(req.query).then((data) => sendSuccess(res, data, 'Quality profit retrieved')).catch(next);
  },
  getAnalytics: (req, res, next) => {
    service.getAnalytics(req.query).then((data) => sendSuccess(res, data, 'P&L analytics retrieved')).catch(next);
  },
};
