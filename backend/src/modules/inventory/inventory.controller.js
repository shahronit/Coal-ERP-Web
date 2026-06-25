const { getAvailableStock, getOverallStockByQuality, getInventoryValue, getMovements } = require('../../services/inventory/fifoEngine');
const { sendSuccess } = require('../../utils/response');

const getStock = async (req, res, next) => {
  try {
    const stock = await getAvailableStock(req.query);
    sendSuccess(res, stock, 'Stock retrieved');
  } catch (err) { next(err); }
};

const getOverallStock = async (req, res, next) => {
  try {
    const summary = await getOverallStockByQuality(req.query);
    sendSuccess(res, summary, 'Overall stock retrieved');
  } catch (err) { next(err); }
};

const getValue = async (req, res, next) => {
  try {
    const value = await getInventoryValue();
    sendSuccess(res, { inventoryValue: value });
  } catch (err) { next(err); }
};

const getMovementLog = async (req, res, next) => {
  try {
    const result = await getMovements(req.query);
    sendSuccess(res, result.data, 'Movements retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const getLedger = async (req, res, next) => {
  try {
    const result = await getMovements(req.query);
    sendSuccess(res, result.data, 'Stock ledger retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

module.exports = { getStock, getOverallStock, getValue, getMovementLog, getLedger };
