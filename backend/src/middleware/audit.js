const prisma = require('../config/database');
const { stringifyJson } = require('../utils/jsonFields');

const logAudit = async ({ userId, action, entity, entityId, previousValue, newValue }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        previousValue: stringifyJson(previousValue) || undefined,
        newValue: stringifyJson(newValue) || undefined,
      },
    });
  } catch {
    // Audit failures should not break main flow
  }
};

const auditMiddleware = (entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body?.success && req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const action = req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE';
      const entityId = body.data?.id || req.params.id || 'unknown';
      logAudit({
        userId: req.user.id,
        action,
        entity,
        entityId,
        previousValue: req._previousValue || null,
        newValue: body.data || req.body,
      });
    }
    return originalJson(body);
  };
  next();
};

module.exports = { logAudit, auditMiddleware };
