const express = require('express');
const controller = require('./purchase.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema, updateSchema } = require('./purchase.validator');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.PURCHASES_READ), controller.list);
router.get('/:id', authorize(PERMISSIONS.PURCHASES_READ), controller.get);
router.post('/', authorize(PERMISSIONS.PURCHASES_WRITE), validate(createSchema), controller.create);
router.put('/:id', authorize(PERMISSIONS.PURCHASES_WRITE), validate(updateSchema), controller.update);
router.post('/:id/confirm', authorize(PERMISSIONS.PURCHASES_WRITE), controller.confirm);
router.delete('/:id', authorize(PERMISSIONS.PURCHASES_DELETE), controller.remove);

module.exports = router;
