const express = require('express');
const controller = require('./sale.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema, previewSchema } = require('./sale.validator');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SALES_READ), controller.list);
router.post('/fifo-preview', authorize(PERMISSIONS.SALES_READ), validate(previewSchema), controller.previewFifo);
router.get('/:id', authorize(PERMISSIONS.SALES_READ), controller.get);
router.post('/', authorize(PERMISSIONS.SALES_WRITE), validate(createSchema), controller.create);
router.delete('/:id', authorize(PERMISSIONS.SALES_DELETE), controller.remove);

module.exports = router;
