const express = require('express');
const controller = require('./payment.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema } = require('./payment.service');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.PAYMENTS_READ), controller.list);
router.get('/outstanding', authorize(PERMISSIONS.PAYMENTS_READ), controller.outstanding);
router.get('/:id', authorize(PERMISSIONS.PAYMENTS_READ), controller.get);
router.post('/', authorize(PERMISSIONS.PAYMENTS_WRITE), validate(createSchema), controller.create);

module.exports = router;
