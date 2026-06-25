const express = require('express');
const Joi = require('joi');
const controller = require('./backup.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { withMessages } = require('../../utils/joiFields');

const router = express.Router();
router.use(authenticate);

const restoreSchema = Joi.object({
  backupFilePath: withMessages(Joi.string().trim().min(1).required().label('Backup file path')),
});

const backupSettingsSchema = Joi.object({
  backupDir: withMessages(Joi.string().trim().min(1).required().label('Backup directory')),
});

router.get('/settings', authorize(PERMISSIONS.SETTINGS_READ), controller.getSettings);
router.put('/settings', authorize(PERMISSIONS.SETTINGS_WRITE), validate(backupSettingsSchema), controller.updateSettings);
router.post('/run', authorize(PERMISSIONS.SETTINGS_WRITE), controller.runBackup);
router.get('/history', authorize(PERMISSIONS.SETTINGS_READ), controller.getHistory);
router.post('/restore', authorize(PERMISSIONS.SETTINGS_WRITE), validate(restoreSchema), controller.restoreBackup);

module.exports = router;
