const express = require('express');
const controller = require('./profitLoss.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate);
router.use(authorize(PERMISSIONS.PROFIT_LOSS_READ));

router.get('/transactions', controller.getTransactions);
router.get('/batches', controller.getBatches);
router.get('/monthly', controller.getMonthly);
router.get('/partners', controller.getPartners);
router.get('/qualities', controller.getQualities);
router.get('/analytics', controller.getAnalytics);

module.exports = router;
