const service = require('./search.service');
const { sendSuccess } = require('../../utils/response');

const search = async (req, res, next) => {
  try {
    const results = await service.globalSearch(req.query.q, parseInt(req.query.limit || '20', 10));
    sendSuccess(res, results, 'Search results');
  } catch (err) {
    next(err);
  }
};

module.exports = { search };
