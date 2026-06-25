const saleService = require('./sale.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await saleService.list(req.query);
    sendSuccess(res, result.data, 'Sales retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    sendSuccess(res, await saleService.get(req.params.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    sendSuccess(res, await saleService.create(req.body, req.user.id), 'Sale created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    sendSuccess(res, await saleService.update(req.params.id, req.body, req.user.id), 'Sale updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await saleService.remove(req.params.id, req.user.role);
    sendSuccess(res, null, 'Sale deleted');
  } catch (err) { next(err); }
};

const previewFifo = async (req, res, next) => {
  try {
    sendSuccess(res, await saleService.getFifoPreview(req.body), 'FIFO preview generated');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, remove, previewFifo };
