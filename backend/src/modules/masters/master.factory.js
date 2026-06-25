const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, softDelete, findById } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const {
  emailFieldOptional,
  nameField,
  stringOptional,
  dateField,
  booleanField,
  withMessages,
} = require('../../utils/joiFields');

const createMasterService = (model, options = {}) => {
  const {
    searchFields = ['name'],
    uniqueFields = ['name'],
    include = {},
    beforeCreate,
    beforeUpdate,
  } = options;

  const list = (query) => {
    const merged = mergeListQuery(query, { filterKeys: ['isActive'] });
    return paginate(model, { ...merged, searchFields, filters: merged.filters || {}, include });
  };

  const get = async (id) => {
    const item = await findById(model, id, include);
    if (!item) throw new AppError(`${model} not found`, 404);
    return item;
  };

  const create = async (data, userId) => {
    for (const field of uniqueFields) {
      if (data[field]) {
        const existing = await prisma[model].findFirst({
          where: { [field]: data[field], deletedAt: null },
        });
        if (existing) throw new AppError(`${field} already exists`, 409);
      }
    }

    const payload = pickModelFields(model, beforeCreate ? await beforeCreate(data) : data);
    return prisma[model].create({
      data: { ...payload, createdById: userId, updatedById: userId },
      include: Object.keys(include).length ? include : undefined,
    });
  };

  const update = async (id, data, userId) => {
    const item = await findById(model, id);
    if (!item) throw new AppError(`${model} not found`, 404);

    for (const field of uniqueFields) {
      if (data[field] && data[field] !== item[field]) {
        const existing = await prisma[model].findFirst({
          where: { [field]: data[field], deletedAt: null, NOT: { id } },
        });
        if (existing) throw new AppError(`${field} already exists`, 409);
      }
    }

    const payload = pickModelFields(model, beforeUpdate ? await beforeUpdate(data, item) : data);
    return prisma[model].update({
      where: { id },
      data: { ...payload, updatedById: userId },
      include: Object.keys(include).length ? include : undefined,
    });
  };

  const remove = async (id, role) => {
    if (!canDelete(role)) throw new AppError('Not authorized to delete', 403);
    const item = await findById(model, id);
    if (!item) throw new AppError(`${model} not found`, 404);
    return softDelete(model, id);
  };

  return { list, get, create, update, remove };
};

const createMasterController = (service, label) => ({
  list: async (req, res, next) => {
    try {
      const result = await service.list(req.query);
      res.json({ success: true, data: result.data, message: `${label} retrieved`, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },
  get: async (req, res, next) => {
    try {
      const item = await service.get(req.params.id);
      res.json({ success: true, data: item, message: `${label} retrieved` });
    } catch (err) {
      next(err);
    }
  },
  create: async (req, res, next) => {
    try {
      const item = await service.create(req.body, req.user.id);
      res.status(201).json({ success: true, data: item, message: `${label} created` });
    } catch (err) {
      next(err);
    }
  },
  update: async (req, res, next) => {
    try {
      const item = await service.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, data: item, message: `${label} updated` });
    } catch (err) {
      next(err);
    }
  },
  remove: async (req, res, next) => {
    try {
      await service.remove(req.params.id, req.user.role);
      res.json({ success: true, data: null, message: `${label} deleted` });
    } catch (err) {
      next(err);
    }
  },
});

const createMasterRoutes = (controller, permissions) => {
  const router = require('express').Router();
  const { authenticate, authorize } = require('../../middleware/auth');
  const validate = require('../../middleware/validate');

  router.use(authenticate);
  router.get('/', authorize(permissions.read), controller.list);
  router.get('/:id', authorize(permissions.read), controller.get);
  if (permissions.write) {
    router.post('/', authorize(permissions.write), validate(permissions.schema.create), controller.create);
    router.put('/:id', authorize(permissions.write), validate(permissions.schema.update), controller.update);
  }
  if (permissions.delete) {
    router.delete('/:id', authorize(permissions.delete), controller.remove);
  }
  return router;
};

const baseSchema = Joi.object({
  name: withMessages(Joi.string().trim().min(1).max(200).required().label('Name')),
  description: stringOptional('Description'),
  isActive: booleanField('Active status', true),
});

const baseUpdateSchema = Joi.object({
  name: withMessages(Joi.string().trim().min(1).max(200).label('Name')),
  description: stringOptional('Description'),
  isActive: booleanField('Active status'),
}).min(1);

const nameActiveSchema = Joi.object({
  name: withMessages(Joi.string().trim().min(1).max(200).required().label('Name')),
  isActive: booleanField('Active status', true),
});

const MODEL_ALLOWED_FIELDS = {
  partner: ['name', 'email', 'phone', 'address', 'profitShare', 'isActive'],
  supplier: ['name', 'email', 'phone', 'address', 'gstin', 'isActive'],
  customer: ['name', 'email', 'phone', 'address', 'gstin', 'isActive'],
  coalQuality: ['name', 'description', 'gcv', 'ashPercent', 'moisturePercent', 'isActive'],
  purchaseBatch: ['code', 'name', 'description', 'startDate', 'endDate', 'isActive'],
  salesBatch: ['code', 'name', 'description', 'startDate', 'endDate', 'isActive'],
  location: ['name', 'address', 'isActive'],
  expenseType: ['name', 'description', 'isActive'],
  incomeType: ['name', 'description', 'isActive'],
  assetType: ['name', 'description', 'depreciationRate', 'isActive'],
  taxConfiguration: ['name', 'gstRate', 'effectiveFrom', 'effectiveTo', 'isActive'],
};

const pickModelFields = (model, data) => {
  const allowed = MODEL_ALLOWED_FIELDS[model];
  if (!allowed) return data;
  return Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
};

const partnerSchema = nameActiveSchema.keys({
  email: emailFieldOptional,
  phone: stringOptional('Phone'),
  address: stringOptional('Address'),
  profitShare: withMessages(Joi.number().min(0).max(100).default(0).label('Profit share')),
});

const partnerUpdateSchema = partnerSchema.fork(['name'], (s) => s.optional()).min(1);

const contactSchema = nameActiveSchema.keys({
  email: emailFieldOptional,
  phone: stringOptional('Phone'),
  address: stringOptional('Address'),
  gstin: stringOptional('GSTIN'),
});

const contactUpdateSchema = contactSchema.fork(['name'], (s) => s.optional()).min(1);

const productSchema = Joi.object({
  name: withMessages(Joi.string().trim().required().label('Name')),
  sku: withMessages(Joi.string().trim().required().label('SKU')),
  categoryId: withMessages(Joi.string().uuid().required().label('Category')),
  qualityId: withMessages(Joi.string().uuid().allow(null).label('Quality')),
  pricingType: withMessages(Joi.string().valid('WEIGHT', 'UNIT').default('UNIT').label('Pricing type')),
  unit: withMessages(Joi.string().default('pcs').label('Unit')),
  description: stringOptional('Description'),
  isActive: booleanField('Active status', true),
});

const productUpdateSchema = productSchema.fork(['name', 'sku', 'categoryId'], (s) => s.optional()).min(1);

const locationSchema = nameActiveSchema.keys({ address: stringOptional('Address') });
const locationUpdateSchema = locationSchema.fork(['name'], (s) => s.optional()).min(1);

const assetTypeSchema = baseSchema.keys({
  depreciationRate: withMessages(Joi.number().min(0).max(100).default(10).label('Depreciation rate')),
});
const assetTypeUpdateSchema = assetTypeSchema.fork(['name'], (s) => s.optional()).min(1);

const taxSchema = Joi.object({
  name: withMessages(Joi.string().trim().required().label('Name')),
  gstRate: withMessages(Joi.number().min(0).max(100).required().label('GST rate')),
  effectiveFrom: dateField('Effective from'),
  effectiveTo: withMessages(Joi.date().allow(null).label('Effective to')),
  isActive: booleanField('Active status', true),
});
const taxUpdateSchema = taxSchema.fork(['name', 'gstRate', 'effectiveFrom'], (s) => s.optional()).min(1);

module.exports = {
  createMasterService,
  createMasterController,
  createMasterRoutes,
  schemas: {
    base: { create: baseSchema, update: baseUpdateSchema },
    partner: { create: partnerSchema, update: partnerUpdateSchema },
    contact: { create: contactSchema, update: contactUpdateSchema },
    product: { create: productSchema, update: productUpdateSchema },
    location: { create: locationSchema, update: locationUpdateSchema },
    assetType: { create: assetTypeSchema, update: assetTypeUpdateSchema },
    tax: { create: taxSchema, update: taxUpdateSchema },
  },
};
