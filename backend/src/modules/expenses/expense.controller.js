const expenseService = require('./expense.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await expenseService.list(req.query);
    sendSuccess(res, result.data, 'Expenses retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await expenseService.get(req.params.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await expenseService.create(req.body, req.user.id), 'Expense created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    sendSuccess(res, await expenseService.update(req.params.id, req.body, req.user.id), 'Expense updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await expenseService.remove(req.params.id, req.user.role);
    sendSuccess(res, null, 'Expense deleted');
  } catch (err) { next(err); }
};

const monthlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth() + 1);
    sendSuccess(res, await expenseService.monthlyReport(year, month));
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, remove, monthlyReport };
