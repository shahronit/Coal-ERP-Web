const {
  createMasterService,
  createMasterController,
  createMasterRoutes,
  schemas,
} = require('./master.factory');
const { PERMISSIONS } = require('../../config/permissions');
const Joi = require('joi');

const batchSchema = Joi.object({
  code: Joi.string().min(1).max(50).required(),
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('', null),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  isActive: Joi.boolean().default(true),
});

const batchUpdateSchema = batchSchema.fork(['code', 'name', 'startDate'], (s) => s.optional()).min(1);

const coalQualitySchema = schemas.base.create.keys({
  gcv: Joi.number().min(0).allow(null),
  ashPercent: Joi.number().min(0).max(100).allow(null),
  moisturePercent: Joi.number().min(0).max(100).allow(null),
});

const coalQualityUpdateSchema = coalQualitySchema.fork(['name'], (s) => s.optional()).min(1);

const masters = [
  { path: 'partners', model: 'partner', label: 'Partner', schema: schemas.partner },
  { path: 'suppliers', model: 'supplier', label: 'Supplier', schema: schemas.contact },
  { path: 'customers', model: 'customer', label: 'Customer', schema: schemas.contact },
  { path: 'coal-qualities', model: 'coalQuality', label: 'Coal Quality', schema: { create: coalQualitySchema, update: coalQualityUpdateSchema } },
  { path: 'purchase-batches', model: 'purchaseBatch', label: 'Purchase Batch', schema: { create: batchSchema, update: batchUpdateSchema }, options: { uniqueFields: ['code', 'name'], searchFields: ['name', 'code'] } },
  { path: 'sales-batches', model: 'salesBatch', label: 'Sales Batch', schema: { create: batchSchema, update: batchUpdateSchema }, options: { uniqueFields: ['code', 'name'], searchFields: ['name', 'code'] } },
  { path: 'locations', model: 'location', label: 'Location', schema: schemas.location },
  { path: 'expense-types', model: 'expenseType', label: 'Expense Type', schema: schemas.base },
  { path: 'income-types', model: 'incomeType', label: 'Income Type', schema: schemas.base },
  { path: 'asset-types', model: 'assetType', label: 'Asset Type', schema: schemas.assetType },
  { path: 'tax-configurations', model: 'taxConfiguration', label: 'Tax Configuration', schema: schemas.tax, options: { uniqueFields: [] } },
];

const createMastersRouter = () => {
  const router = require('express').Router();

  masters.forEach(({ path, model, label, schema, options = {} }) => {
    const service = createMasterService(model, options);
    const controller = createMasterController(service, label);
    const routes = createMasterRoutes(controller, {
      read: PERMISSIONS.MASTERS_READ,
      write: PERMISSIONS.MASTERS_WRITE,
      delete: PERMISSIONS.MASTERS_DELETE,
      schema,
    });
    router.use(`/${path}`, routes);
  });

  return router;
};

module.exports = createMastersRouter;
