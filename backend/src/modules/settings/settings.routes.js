const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { CONFIGURABLE_ROLES, MODULE_KEYS } = require('../../config/roles');
const { getAppSettings, getPublicBranding, updateAppSettings } = require('../../services/appSettings');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const validate = require('../../middleware/validate');
const Joi = require('joi');

const router = express.Router();

const roleModulesSchema = Joi.object()
  .pattern(
    Joi.string().valid(...CONFIGURABLE_ROLES),
    Joi.array().items(Joi.string().valid(...MODULE_KEYS))
  )
  .min(1);

const appSettingsSchema = Joi.object({
  companyName: Joi.string().allow('', null),
  appName: Joi.string().max(120).allow('', null),
  companyLogo: Joi.string().allow('', null).max(750000),
  setupCompleted: Joi.boolean(),
  crmEnabled: Joi.boolean(),
  autoBackupEnabled: Joi.boolean(),
  fifoCostBasis: Joi.string().valid('EX_GST', 'INC_GST'),
  customDatabasePath: Joi.string().allow('', null).max(1024),
  roleModules: roleModulesSchema,
}).min(1).unknown(true);

const setupSchema = Joi.object({
  companyName: Joi.string().min(1).required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(1),
});

router.get('/branding', async (req, res, next) => {
  try {
    sendSuccess(res, await getPublicBranding(), 'Branding retrieved');
  } catch (err) { next(err); }
});

router.get('/app', authenticate, async (req, res, next) => {
  try {
    sendSuccess(res, await getAppSettings(), 'App settings retrieved');
  } catch (err) { next(err); }
});

router.put('/app', authenticate, authorize(PERMISSIONS.SETTINGS_WRITE), validate(appSettingsSchema), async (req, res, next) => {
  try {
    if (req.body.appName !== undefined && req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Only Super Admin can change the app display name', 403);
    }
    if (req.body.fifoCostBasis !== undefined && req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Only Super Admin can change the FIFO cost basis', 403);
    }
    sendSuccess(res, await updateAppSettings(req.body), 'App settings updated');
  } catch (err) { next(err); }
});

router.put('/role-modules', authenticate, authorize(PERMISSIONS.SETTINGS_WRITE), validate(roleModulesSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await updateAppSettings({ roleModules: req.body }), 'Role module access updated');
  } catch (err) { next(err); }
});

router.post('/setup', authenticate, validate(setupSchema), async (req, res, next) => {
  try {
    const settings = await getAppSettings();
    if (settings.setupCompleted) throw new AppError('Setup already completed', 400);

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash,
        name: req.body.name || req.user.name,
      },
    });

    const updated = await updateAppSettings({
      companyName: req.body.companyName,
      setupCompleted: true,
    });

    sendSuccess(res, updated, 'Setup completed');
  } catch (err) { next(err); }
});

router.get('/setup-status', authenticate, async (req, res, next) => {
  try {
    const settings = await getAppSettings();
    sendSuccess(res, {
      setupCompleted: settings.setupCompleted,
      companyName: settings.companyName,
      appName: settings.appName,
    }, 'Setup status retrieved');
  } catch (err) { next(err); }
});

module.exports = router;
