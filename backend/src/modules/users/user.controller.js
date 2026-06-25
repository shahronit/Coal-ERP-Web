const userService = require('./user.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await userService.listUsers(req.query);
    sendSuccess(res, result.data, 'Users retrieved', 200, result.meta);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user.id, req.user.role);
    sendSuccess(res, user, 'User created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user.role);
    sendSuccess(res, user, 'User updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.role);
    sendSuccess(res, null, 'User deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, get, create, update, remove };
