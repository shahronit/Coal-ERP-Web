const express = require('express');
const controller = require('./investment.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { investmentSchema, returnSchema } = require('./investment.service');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.INVESTMENTS_READ), controller.list);
router.get('/roi-dashboard', authorize(PERMISSIONS.INVESTMENTS_READ), controller.roiDashboard);
router.get('/:id', authorize(PERMISSIONS.INVESTMENTS_READ), controller.get);
router.post('/', authorize(PERMISSIONS.INVESTMENTS_WRITE), validate(investmentSchema), controller.create);
router.post('/:id/returns', authorize(PERMISSIONS.INVESTMENTS_WRITE), validate(returnSchema), controller.addReturn);
router.delete('/:id', authorize(PERMISSIONS.INVESTMENTS_WRITE), controller.remove);

module.exports = router;
