const express = require('express');
const controller = require('./asset.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema, updateSchema } = require('./asset.service');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.ASSETS_READ), controller.list);
router.get('/:id', authorize(PERMISSIONS.ASSETS_READ), controller.get);
router.post('/', authorize(PERMISSIONS.ASSETS_WRITE), validate(createSchema), controller.create);
router.put('/:id', authorize(PERMISSIONS.ASSETS_WRITE), validate(updateSchema), controller.update);
router.delete('/:id', authorize(PERMISSIONS.ASSETS_WRITE), controller.remove);

module.exports = router;
