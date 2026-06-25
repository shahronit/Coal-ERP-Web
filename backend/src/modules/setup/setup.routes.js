const express = require('express');
const Joi = require('joi');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { sendSuccess } = require('../../utils/response');
const demoSeed = require('../../services/demoSeed/demoSeedService');

const router = express.Router();

const demoSeedSchema = Joi.object({
  reset: Joi.boolean().default(false),
});

router.post(
  '/demo-seed',
  authenticate,
  authorize(PERMISSIONS.SETTINGS_WRITE),
  validate(demoSeedSchema),
  async (req, res, next) => {
    try {
      const result = await demoSeed.loadDemoData({ reset: req.body.reset });
      sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
