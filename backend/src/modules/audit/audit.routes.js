const express = require('express');
const controller = require('./audit.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate, authorize(PERMISSIONS.AUDIT_READ));
router.get('/', controller.list);

module.exports = router;
