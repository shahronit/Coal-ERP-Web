const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, findById, softDelete } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const { parseJson, stringifyJson } = require('../../utils/jsonFields');
const {
  uuidFieldOptional,
  dateFieldOptional,
  stringOptional,
  enumField,
  withMessages,
} = require('../../utils/joiFields');

const createSchema = Joi.object({
  type: enumField('Type', ['CALL', 'EMAIL', 'MEETING', 'TASK']),
  subject: withMessages(Joi.string().trim().min(2).max(200).required().label('Subject')),
  dueDate: dateFieldOptional('Due date'),
  status: enumField('Status', ['OPEN', 'COMPLETED', 'CANCELLED'], 'OPEN'),
  notes: stringOptional('Notes'),
  leadId: uuidFieldOptional('Lead'),
  customerId: uuidFieldOptional('Customer'),
  ownerId: uuidFieldOptional('Owner'),
});

const updateSchema = createSchema.fork(['type', 'subject'], s => s.optional()).min(1);

const list = (query) =>
  paginate('activity', {
    ...mergeListQuery(query, { dateField: 'dueDate', filterKeys: ['status', 'type', 'ownerId'] }),
    searchFields: ['subject', 'notes'],
    include: {
      lead: true,
      customer: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

const get = async (id) => {
  const activity = await findById('activity', id, {
    lead: true,
    customer: true,
    owner: { select: { id: true, name: true, email: true } },
  });
  if (!activity) throw new AppError('Activity not found', 404);
  return activity;
};

const create = (data, userId) =>
  prisma.activity.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ownerId: data.ownerId || userId,
      leadId: data.leadId || null,
      customerId: data.customerId || null,
      createdById: userId,
      updatedById: userId,
    },
    include: { lead: true, customer: true, owner: { select: { id: true, name: true } } },
  });

const update = async (id, data, userId) => {
  const activity = await findById('activity', id);
  if (!activity) throw new AppError('Activity not found', 404);
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  return prisma.activity.update({
    where: { id },
    data: { ...data, ownerId: data.ownerId || undefined, updatedById: userId },
    include: { lead: true, customer: true, owner: { select: { id: true, name: true } } },
  });
};

const remove = async (id, role) => {
  if (!canDelete(role)) throw new AppError('Not authorized', 403);
  return softDelete('activity', id);
};

const upcoming = async (ownerId) => {
  const now = new Date();
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return prisma.activity.findMany({
    where: {
      deletedAt: null,
      status: 'OPEN',
      ownerId,
      dueDate: { gte: now, lte: soon },
    },
    include: { lead: true, customer: true },
    orderBy: { dueDate: 'asc' },
  });
};

const createDueNotifications = async () => {
  const overdue = await prisma.activity.findMany({
    where: { deletedAt: null, status: 'OPEN', dueDate: { lt: new Date() }, ownerId: { not: null } },
    take: 100,
  });

  for (const activity of overdue) {
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: activity.ownerId,
        type: 'GENERAL',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    const exists = recentNotifications.some(notification =>
      parseJson(notification.metadata, {})?.activityId === activity.id
    );
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: activity.ownerId,
          type: 'GENERAL',
          title: 'Follow-up overdue',
          body: activity.subject,
          metadata: stringifyJson({ activityId: activity.id }),
        },
      });
    }
  }
};

module.exports = { createSchema, updateSchema, list, get, create, update, remove, upcoming, createDueNotifications };
