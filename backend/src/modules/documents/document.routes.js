const express = require('express');
const controller = require('./document.controller');
const upload = require('../../config/multer');
const validate = require('../../middleware/validate');
const { uploadSchema } = require('./document.validator');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.DOCUMENTS_READ), controller.list);
router.post('/upload', authorize(PERMISSIONS.DOCUMENTS_WRITE), validate(uploadSchema), upload.single('file'), controller.upload);
router.get('/:id/download', authorize(PERMISSIONS.DOCUMENTS_READ), controller.download);
router.delete('/:id', authorize(PERMISSIONS.DOCUMENTS_WRITE), controller.remove);

module.exports = router;
