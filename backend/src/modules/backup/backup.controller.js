const backupService = require('../../services/backup/backupService');
const { sendSuccess } = require('../../utils/response');

const getSettings = async (req, res, next) => {
  try {
    sendSuccess(res, await backupService.getSettings(), 'Backup settings retrieved');
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    sendSuccess(res, await backupService.updateSettings(req.body), 'Backup settings updated');
  } catch (err) { next(err); }
};

const runBackup = async (req, res, next) => {
  try {
    sendSuccess(res, await backupService.runBackup(req.user?.id), 'Backup completed');
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    sendSuccess(res, await backupService.getHistory(), 'Backup history retrieved');
  } catch (err) { next(err); }
};

const restoreBackup = async (req, res, next) => {
  try {
    sendSuccess(res, await backupService.restoreFromBackup(req.body.backupFilePath), 'Backup restored');
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings, runBackup, getHistory, restoreBackup };
