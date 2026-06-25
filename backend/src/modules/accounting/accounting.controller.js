const service = require('./accounting.service');
const { sendSuccess } = require('../../utils/response');

const plStatement = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getPLStatement(req.query), 'P&L statement retrieved');
  } catch (err) { next(err); }
};

const aging = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getAging(), 'Aging analysis retrieved');
  } catch (err) { next(err); }
};

const dayBook = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getDayBook(req.query), 'Day book retrieved');
  } catch (err) { next(err); }
};

const gstSummary = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getGstSummary(req.query), 'GST summary retrieved');
  } catch (err) { next(err); }
};

module.exports = { plStatement, aging, dayBook, gstSummary };
