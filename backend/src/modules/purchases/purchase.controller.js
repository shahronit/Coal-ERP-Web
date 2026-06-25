const purchaseService = require('./purchase.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await purchaseService.list(req.query);
    sendSuccess(res, result.data, 'Purchases retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    const item = await purchaseService.get(req.params.id);
    sendSuccess(res, item);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const item = await purchaseService.create(req.body, req.user.id);
    sendSuccess(res, item, 'Purchase created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const item = await purchaseService.update(req.params.id, req.body, req.user.id);
    sendSuccess(res, item, 'Purchase updated');
  } catch (err) { next(err); }
};

const confirm = async (req, res, next) => {
  try {
    const item = await purchaseService.confirm(req.params.id, req.user.id);
    sendSuccess(res, item, 'Purchase confirmed');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await purchaseService.remove(req.params.id, req.user.role);
    sendSuccess(res, null, 'Purchase deleted');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, confirm, remove };
