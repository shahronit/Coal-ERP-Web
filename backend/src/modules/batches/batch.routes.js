const express = require('express');
const controller = require('./batch.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/purchase', authorize(PERMISSIONS.BATCHES_READ), controller.listPurchaseSummaries);
router.get('/purchase/:id', authorize(PERMISSIONS.BATCHES_READ), controller.getPurchaseSummary);
router.get('/sales', authorize(PERMISSIONS.BATCHES_READ), controller.listSalesSummaries);
router.get('/sales/:id', authorize(PERMISSIONS.BATCHES_READ), controller.getSalesSummary);

module.exports = router;
