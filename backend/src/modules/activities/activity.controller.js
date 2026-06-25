const service = require('./activity.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await service.list(req.query);
    sendSuccess(res, result.data, 'Activities retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await service.get(req.params.id), 'Activity retrieved');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await service.create(req.body, req.user.id), 'Activity created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    sendSuccess(res, await service.update(req.params.id, req.body, req.user.id), 'Activity updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.role);
    sendSuccess(res, null, 'Activity deleted');
  } catch (err) { next(err); }
};

const upcoming = async (req, res, next) => {
  try {
    sendSuccess(res, await service.upcoming(req.user.id), 'Upcoming activities retrieved');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, remove, upcoming };
