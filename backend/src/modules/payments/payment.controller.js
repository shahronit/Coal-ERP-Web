const paymentService = require('./payment.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await paymentService.list(req.query);
    sendSuccess(res, result.data, 'Payments retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await paymentService.get(req.params.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await paymentService.create(req.body, req.user.id), 'Payment recorded', 201);
  } catch (err) { next(err); }
};

const outstanding = async (req, res, next) => {
  try {
    sendSuccess(res, await paymentService.getOutstanding());
  } catch (err) { next(err); }
};

module.exports = { list, get, create, outstanding };
