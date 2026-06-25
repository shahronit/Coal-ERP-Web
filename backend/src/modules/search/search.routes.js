const express = require('express');
const controller = require('./search.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.search);

module.exports = router;
