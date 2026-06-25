const express = require('express');
const controller = require('./expense.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema, updateSchema } = require('./expense.service');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.EXPENSES_READ), controller.list);
router.get('/monthly-report', authorize(PERMISSIONS.EXPENSES_READ), controller.monthlyReport);
router.get('/:id', authorize(PERMISSIONS.EXPENSES_READ), controller.get);
router.post('/', authorize(PERMISSIONS.EXPENSES_WRITE), validate(createSchema), controller.create);
router.put('/:id', authorize(PERMISSIONS.EXPENSES_WRITE), validate(updateSchema), controller.update);
router.delete('/:id', authorize(PERMISSIONS.EXPENSES_WRITE), controller.remove);

module.exports = router;
