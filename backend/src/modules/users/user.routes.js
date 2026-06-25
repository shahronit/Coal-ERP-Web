const express = require('express');
const userController = require('./user.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createUserSchema, updateUserSchema } = require('../auth/auth.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.USERS_READ), userController.list);
router.get('/:id', authorize(PERMISSIONS.USERS_READ), userController.get);
router.post('/', authorize(PERMISSIONS.USERS_WRITE), validate(createUserSchema), userController.create);
router.put('/:id', authorize(PERMISSIONS.USERS_WRITE), validate(updateUserSchema), userController.update);
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), userController.remove);

module.exports = router;
