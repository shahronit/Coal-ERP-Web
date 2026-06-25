const express = require('express');
const controller = require('./inventory.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/ledger', authorize(PERMISSIONS.INVENTORY_READ), controller.getLedger);
router.get('/stock', authorize(PERMISSIONS.INVENTORY_READ), controller.getStock);
router.get('/stock/overall', authorize(PERMISSIONS.INVENTORY_READ), controller.getOverallStock);
router.get('/value', authorize(PERMISSIONS.INVENTORY_READ), controller.getValue);
router.get('/movements', authorize(PERMISSIONS.INVENTORY_READ), controller.getMovementLog);

module.exports = router;
