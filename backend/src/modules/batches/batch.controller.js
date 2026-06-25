const batchService = require('./batch.service');
const { sendSuccess } = require('../../utils/response');

const listPurchaseSummaries = async (req, res, next) => {
  try {
    const data = await batchService.listSummaries('purchase');
    sendSuccess(res, data, 'Purchase batch summaries retrieved');
  } catch (err) { next(err); }
};

const listSalesSummaries = async (req, res, next) => {
  try {
    const data = await batchService.listSummaries('sales');
    sendSuccess(res, data, 'Sales batch summaries retrieved');
  } catch (err) { next(err); }
};

const getPurchaseSummary = async (req, res, next) => {
  try {
    const data = await batchService.getPurchaseBatchSummary(req.params.id);
    sendSuccess(res, data, 'Purchase batch summary retrieved');
  } catch (err) { next(err); }
};

const getSalesSummary = async (req, res, next) => {
  try {
    const data = await batchService.getSalesBatchSummary(req.params.id);
    sendSuccess(res, data, 'Sales batch summary retrieved');
  } catch (err) { next(err); }
};

module.exports = {
  listPurchaseSummaries,
  listSalesSummaries,
  getPurchaseSummary,
  getSalesSummary,
};
