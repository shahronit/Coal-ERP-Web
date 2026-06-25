const auditService = require('./audit.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await auditService.list(req.query);
    sendSuccess(res, result.data, 'Audit logs retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

module.exports = { list };
