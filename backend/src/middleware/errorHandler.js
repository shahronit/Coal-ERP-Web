const { sendError } = require('../utils/response');
const logger = require('../config/logger');

const config = require('../config');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  if (err.isJoi) {
    return sendError(res, 'Validation error', 400, err.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
    })));
  }

  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  const message = config.nodeEnv === 'development' ? err.message : 'Internal server error';
  return sendError(res, message, 500);
};

module.exports = errorHandler;
