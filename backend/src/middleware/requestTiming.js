const logger = require('../config/logger');

module.exports = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`Slow request ${req.method} ${req.path} ${duration}ms`);
    }
  });
  next();
};
