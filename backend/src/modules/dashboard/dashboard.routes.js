const express = require('express');
const controller = require('./dashboard.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate, authorize(PERMISSIONS.DASHBOARD_READ));

router.get('/summary', controller.summary);
router.get('/quality-stock', controller.qualityStock);
router.get('/kpis', controller.kpis);
router.get('/trends', controller.trends);
router.get('/top-customers', controller.topCustomers);
router.get('/top-suppliers', controller.topSuppliers);

module.exports = router;
