const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, findById, softDelete } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const {
  emailFieldOptional,
  phoneField,
  uuidFieldOptional,
  stringOptional,
  enumField,
  withMessages,
} = require('../../utils/joiFields');

const createSchema = Joi.object({
  name: withMessages(Joi.string().trim().min(2).max(160).required().label('Name')),
  company: stringOptional('Company'),
  email: emailFieldOptional,
  phone: phoneField,
  source: stringOptional('Source'),
  stage: enumField('Stage', ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'], 'NEW'),
  estimatedValue: withMessages(Joi.number().min(0).default(0).label('Estimated value')),
  ownerId: uuidFieldOptional('Owner'),
  notes: stringOptional('Notes'),
});

const updateSchema = createSchema.fork(['name'], (s) => s.optional()).min(1);

const list = (query) =>
  paginate('lead', {
    ...mergeListQuery(query, { filterKeys: ['stage', 'ownerId'] }),
    searchFields: ['name', 'company', 'email', 'phone'],
    include: { owner: { select: { id: true, name: true, email: true } }, activities: true },
  });

const get = async (id) => {
  const lead = await findById('lead', id, {
    owner: { select: { id: true, name: true, email: true } },
    activities: { orderBy: { dueDate: 'asc' } },
  });
  if (!lead) throw new AppError('Lead not found', 404);
  return lead;
};

const create = (data, userId) =>
  prisma.lead.create({
    data: { ...data, ownerId: data.ownerId || userId, createdById: userId, updatedById: userId },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

const update = async (id, data, userId) => {
  const lead = await findById('lead', id);
  if (!lead) throw new AppError('Lead not found', 404);
  return prisma.lead.update({
    where: { id },
    data: { ...data, ownerId: data.ownerId || undefined, updatedById: userId },
    include: { owner: { select: { id: true, name: true, email: true } }, activities: true },
  });
};

const remove = async (id, role) => {
  if (!canDelete(role)) throw new AppError('Not authorized', 403);
  return softDelete('lead', id);
};

const pipeline = async () => {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    include: { owner: { select: { id: true, name: true } }, activities: true },
    orderBy: { updatedAt: 'desc' },
  });
  return ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'].map(stage => ({
    stage,
    leads: leads.filter(lead => lead.stage === stage),
    totalValue: leads.filter(lead => lead.stage === stage).reduce((sum, lead) => sum + parseFloat(lead.estimatedValue || 0), 0),
  }));
};

module.exports = { createSchema, updateSchema, list, get, create, update, remove, pipeline };
