const express = require('express');
const controller = require('./activity.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createSchema, updateSchema } = require('./activity.service');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.CRM_READ), controller.list);
router.get('/upcoming', authorize(PERMISSIONS.CRM_READ), controller.upcoming);
router.get('/:id', authorize(PERMISSIONS.CRM_READ), controller.get);
router.post('/', authorize(PERMISSIONS.CRM_WRITE), validate(createSchema), controller.create);
router.put('/:id', authorize(PERMISSIONS.CRM_WRITE), validate(updateSchema), controller.update);
router.delete('/:id', authorize(PERMISSIONS.CRM_WRITE), controller.remove);

module.exports = router;
