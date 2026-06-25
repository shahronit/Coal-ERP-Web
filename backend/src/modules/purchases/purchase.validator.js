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
  freight: nonNegativeNumber('Freight', 0),
  additionalExpenses: nonNegativeNumber('Additional expenses', 0),
  gstRate: withMessages(Joi.number().min(0).max(100).default(0).label('GST rate')),
  applyGst: Joi.boolean().default(false),
  taxConfigurationId: uuidFieldOptional('GST rate'),
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
  purchaseDate: dateField('Purchase date'),
  purchaseType: enumField('Purchase type', ['DIRECT', 'INDIRECT'], 'DIRECT'),
  purchaseBatchId: uuidFieldOptional('Purchase batch'),
  supplierId: uuidField('Supplier'),
  locationId: uuidFieldOptional('Location'),
  truckNumber: stringOptional('Truck number'),
  dueDate: dateFieldOptional('Due date'),
  notes: stringOptional('Notes'),
  lineItems: withMessages(
    Joi.array().items(lineItemSchema).min(1).required().label('Line items')
  ),
  expenseAdjustments: withMessages(
    Joi.array().items(expenseAdjustmentSchema).default([]).label('Expense adjustments')
  ),
  incomeAdjustments: withMessages(
    Joi.array().items(incomeAdjustmentSchema).default([]).label('Income adjustments')
  ),
});

const updateSchema = createSchema.fork(
  ['purchaseDate', 'supplierId', 'lineItems'],
  (s) => s.optional()
).min(1);

module.exports = { createSchema, updateSchema };
