const express = require('express');
const controller = require('./lead.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema, updateSchema } = require('./lead.service');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.CRM_READ), controller.list);
router.get('/pipeline', authorize(PERMISSIONS.CRM_READ), controller.pipeline);
router.get('/:id', authorize(PERMISSIONS.CRM_READ), controller.get);
router.post('/', authorize(PERMISSIONS.CRM_WRITE), validate(createSchema), controller.create);
router.put('/:id', authorize(PERMISSIONS.CRM_WRITE), validate(updateSchema), controller.update);
router.delete('/:id', authorize(PERMISSIONS.CRM_WRITE), controller.remove);

module.exports = router;
