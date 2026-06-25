const investmentService = require('./investment.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await investmentService.listInvestments(req.query);
    sendSuccess(res, result.data, 'Investments retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await investmentService.getInvestment(req.params.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await investmentService.createInvestment(req.body, req.user.id), 'Investment created', 201);
  } catch (err) { next(err); }
};

const addReturn = async (req, res, next) => {
  try {
    sendSuccess(res, await investmentService.addReturn(req.params.id, req.body), 'Return recorded', 201);
  } catch (err) { next(err); }
};

const roiDashboard = async (req, res, next) => {
  try {
    sendSuccess(res, await investmentService.getROIDashboard());
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await investmentService.removeInvestment(req.params.id, req.user.role);
    sendSuccess(res, null, 'Investment deleted');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, addReturn, roiDashboard, remove };
