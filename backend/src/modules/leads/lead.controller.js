const service = require('./lead.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await service.list(req.query);
    sendSuccess(res, result.data, 'Leads retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await service.get(req.params.id), 'Lead retrieved');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await service.create(req.body, req.user.id), 'Lead created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    sendSuccess(res, await service.update(req.params.id, req.body, req.user.id), 'Lead updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.role);
    sendSuccess(res, null, 'Lead deleted');
  } catch (err) { next(err); }
};

const pipeline = async (req, res, next) => {
  try {
    sendSuccess(res, await service.pipeline(), 'Pipeline retrieved');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, remove, pipeline };
