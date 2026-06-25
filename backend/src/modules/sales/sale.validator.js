const Joi = require('joi');
const { ADJUSTMENT_BASIS_VALUES } = require('../../utils/adjustmentBasis');
const {
  uuidField,
  uuidFieldOptional,
  positiveNumber,
  nonNegativeNumber,
  dateField,
  dateFieldOptional,
  stringOptional,
  enumField,
  withMessages,
} = require('../../utils/joiFields');

const lineItemSchema = Joi.object({
  qualityId: uuidField('Coal quality'),
  truckNumber: stringOptional('Truck number'),
  weight: positiveNumber('Weight'),
  rate: positiveNumber('Rate'),
  gstRate: withMessages(Joi.number().min(0).max(100).default(0).label('GST rate')),
  applyGst: Joi.boolean().default(false),
  taxConfigurationId: uuidFieldOptional('GST rate'),
});

const freightEntrySchema = Joi.object({
  description: stringOptional('Description'),
  amount: nonNegativeNumber('Amount'),
  truckNumber: stringOptional('Truck number'),
});

const adjustmentBaseSchema = Joi.object({
  basisType: enumField('Basis', ADJUSTMENT_BASIS_VALUES, 'FLAT'),
  value: positiveNumber('Amount'),
  lineIndex: Joi.number().integer().min(0).optional().label('Coal line'),
  description: stringOptional('Description'),
}).custom((value, helpers) => {
  if (value.basisType === 'PER_MT' && (value.lineIndex === undefined || value.lineIndex === null)) {
    return helpers.message('Coal line is required for Per Metric Tonne basis');
  }
  return value;
});

const expenseAdjustmentSchema = adjustmentBaseSchema.keys({
  expenseTypeId: uuidField('Expense type'),
});

const incomeAdjustmentSchema = adjustmentBaseSchema.keys({
  incomeTypeId: uuidField('Income type'),
});

const createSchema = Joi.object({
  saleDate: dateField('Sale date'),
  saleType: enumField('Sale type', ['DIRECT', 'INDIRECT'], 'DIRECT'),
  salesBatchId: uuidFieldOptional('Sales batch'),
  customerId: uuidField('Customer'),
  locationId: uuidFieldOptional('Location'),
  truckNumber: stringOptional('Truck number'),
  dueDate: dateFieldOptional('Due date'),
  notes: stringOptional('Notes'),
  lineItems: withMessages(
    Joi.array().items(lineItemSchema).min(1).required().label('Line items')
  ),
  freightEntries: withMessages(
    Joi.array().items(freightEntrySchema).default([]).label('Freight entries')
  ),
  expenseAdjustments: withMessages(
    Joi.array().items(expenseAdjustmentSchema).default([]).label('Expense adjustments')
  ),
  incomeAdjustments: withMessages(
    Joi.array().items(incomeAdjustmentSchema).default([]).label('Income adjustments')
  ),
});

const previewSchema = Joi.object({
  locationId: uuidFieldOptional('Location'),
  lineItems: withMessages(
    Joi.array()
      .items(
        Joi.object({
          qualityId: uuidField('Coal quality'),
          weight: positiveNumber('Weight'),
        })
      )
      .min(1)
      .required()
      .label('Line items')
  ),
});

module.exports = { createSchema, previewSchema };
