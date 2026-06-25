const express = require('express');
const controller = require('./accounting.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate, authorize(PERMISSIONS.REPORTS_READ));

router.get('/pl-statement', controller.plStatement);
router.get('/aging', controller.aging);
router.get('/day-book', controller.dayBook);
router.get('/gst-summary', controller.gstSummary);

module.exports = router;
