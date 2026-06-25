const express = require('express');
const controller = require('./profitability.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate, authorize(PERMISSIONS.REPORTS_READ));

router.get('/transactions', controller.transactions);
router.get('/sales/:id', controller.saleDetail);
router.get('/batches', controller.batches);
router.get('/by-product', controller.byProduct);
router.get('/by-customer', controller.byCustomer);

module.exports = router;
