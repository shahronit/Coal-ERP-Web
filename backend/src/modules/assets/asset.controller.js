const assetService = require('./asset.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await assetService.list(req.query);
    sendSuccess(res, result.data, 'Assets retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await assetService.get(req.params.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await assetService.create(req.body, req.user.id), 'Asset created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    sendSuccess(res, await assetService.update(req.params.id, req.body, req.user.id), 'Asset updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await assetService.remove(req.params.id, req.user.role);
    sendSuccess(res, null, 'Asset deleted');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, remove };
