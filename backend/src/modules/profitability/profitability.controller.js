const service = require('./profitability.service');
const { sendSuccess } = require('../../utils/response');

const transactions = async (req, res, next) => {
  try {
    const result = await service.getTransactions(req.query);
    sendSuccess(res, result.data, 'Transaction profitability retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const saleDetail = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getSaleProfitability(req.params.id), 'Sale profitability retrieved');
  } catch (err) { next(err); }
};

const batches = async (req, res, next) => {
  try {
    const result = await service.getBatches(req.query);
    sendSuccess(res, result.data, 'Batch profitability retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const byProduct = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getByProduct(req.query), 'Product profitability retrieved');
  } catch (err) { next(err); }
};

const byCustomer = async (req, res, next) => {
  try {
    sendSuccess(res, await service.getByCustomer(req.query), 'Customer profitability retrieved');
  } catch (err) { next(err); }
};

module.exports = { transactions, saleDetail, batches, byProduct, byCustomer };
