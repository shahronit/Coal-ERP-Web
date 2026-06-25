const Joi = require('joi');
const { uuidField, enumField } = require('../../utils/joiFields');

const uploadSchema = Joi.object({
  entityType: enumField('Entity type', ['PURCHASE', 'SALE', 'EXPENSE', 'PAYMENT', 'INVESTMENT', 'LEAD', 'OTHER']),
  entityId: uuidField('Entity'),
});

module.exports = { uploadSchema };
