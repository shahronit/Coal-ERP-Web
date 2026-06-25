const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendError } = require('../utils/response');
const prisma = require('../config/database');
const { hasPermission } = require('../config/permissions');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, deletedAt: null, isActive: true },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return sendError(res, 'User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  const allowed = permissions.some(p => hasPermission(req.user.role, p));
  if (!allowed) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, deletedAt: null, isActive: true },
        select: { id: true, email: true, name: true, role: true },
      });
      if (user) req.user = user;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
