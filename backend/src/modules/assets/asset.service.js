const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, findById, softDelete } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const { toNumber } = require('../../utils/calculations');
const {
  uuidField,
  positiveNumber,
  dateField,
  stringOptional,
  withMessages,
} = require('../../utils/joiFields');

const createSchema = Joi.object({
  name: withMessages(Joi.string().trim().required().label('Name')),
  assetTypeId: uuidField('Asset type'),
  purchaseDate: dateField('Purchase date'),
  purchaseValue: positiveNumber('Purchase value'),
  depreciationRate: withMessages(Joi.number().min(0).max(100).label('Depreciation rate')),
  serialNumber: stringOptional('Serial number'),
  location: stringOptional('Location'),
  notes: stringOptional('Notes'),
});

const updateSchema = createSchema.fork(['name', 'assetTypeId', 'purchaseDate', 'purchaseValue'], s => s.optional()).min(1);

const calculateDepreciation = (asset) => {
  const rate = toNumber(asset.depreciationRate) / 100 / 12;
  const monthsOwned = Math.max(1, Math.floor((Date.now() - new Date(asset.purchaseDate)) / (30 * 24 * 60 * 60 * 1000)));
  const purchaseValue = toNumber(asset.purchaseValue);
  const depreciated = purchaseValue * rate * monthsOwned;
  return Math.max(0, purchaseValue - depreciated);
};

const list = (query) =>
  paginate('asset', {
    ...mergeListQuery(query, { dateField: 'purchaseDate', filterKeys: ['assetTypeId'] }),
    searchFields: ['name', 'serialNumber'],
    include: { assetType: true },
  });

const get = async (id) => {
  const asset = await findById('asset', id, { assetType: true });
  if (!asset) throw new AppError('Asset not found', 404);
  return { ...asset, currentValue: calculateDepreciation(asset) };
};

const create = async (data, userId) => {
  const assetType = await prisma.assetType.findFirst({ where: { id: data.assetTypeId, deletedAt: null } });
  if (!assetType) throw new AppError('Asset type not found', 404);

  return prisma.asset.create({
    data: {
      ...data,
      purchaseDate: new Date(data.purchaseDate),
      depreciationRate: data.depreciationRate ?? assetType.depreciationRate,
      currentValue: data.purchaseValue,
      createdById: userId,
      updatedById: userId,
    },
    include: { assetType: true },
  });
};

const update = async (id, data, userId) => {
  const asset = await findById('asset', id);
  if (!asset) throw new AppError('Asset not found', 404);
  if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
  const updated = await prisma.asset.update({
    where: { id },
    data: { ...data, updatedById: userId },
    include: { assetType: true },
  });
  return { ...updated, currentValue: calculateDepreciation(updated) };
};

const remove = async (id, role) => {
  if (!canDelete(role)) throw new AppError('Not authorized', 403);
  return softDelete('asset', id);
};

module.exports = { createSchema, updateSchema, list, get, create, update, remove, calculateDepreciation };
