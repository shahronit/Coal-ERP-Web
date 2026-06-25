const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, findById, softDelete } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const {
  uuidField,
  positiveNumber,
  dateField,
  stringOptional,
  enumField,
  withMessages,
} = require('../../utils/joiFields');

const createSchema = Joi.object({
  expenseTypeId: uuidField('Expense type'),
  category: enumField('Category', ['DIRECT', 'INDIRECT']),
  amount: positiveNumber('Amount'),
  expenseDate: dateField('Expense date'),
  description: stringOptional('Description'),
  referenceNo: stringOptional('Reference number'),
});

const updateSchema = createSchema.fork(['expenseTypeId', 'category', 'amount', 'expenseDate'], s => s.optional()).min(1);

const list = (query) =>
  paginate('expense', {
    ...mergeListQuery(query, { dateField: 'expenseDate', filterKeys: ['category', 'expenseTypeId'] }),
    searchFields: ['description', 'referenceNo'],
    include: { expenseType: true },
  });

const get = async (id) => {
  const expense = await findById('expense', id, { expenseType: true });
  if (!expense) throw new AppError('Expense not found', 404);
  return expense;
};

const create = (data, userId) =>
  prisma.expense.create({
    data: { ...data, expenseDate: new Date(data.expenseDate), createdById: userId, updatedById: userId },
    include: { expenseType: true },
  });

const update = async (id, data, userId) => {
  const expense = await findById('expense', id);
  if (!expense) throw new AppError('Expense not found', 404);
  if (data.expenseDate) data.expenseDate = new Date(data.expenseDate);
  return prisma.expense.update({
    where: { id },
    data: { ...data, updatedById: userId },
    include: { expenseType: true },
  });
};

const remove = async (id, role) => {
  if (!canDelete(role)) throw new AppError('Not authorized', 403);
  return softDelete('expense', id);
};

const monthlyReport = async (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: start, lte: end }, deletedAt: null },
    include: { expenseType: true },
  });

  const direct = expenses.filter(e => e.category === 'DIRECT').reduce((s, e) => s + parseFloat(e.amount), 0);
  const indirect = expenses.filter(e => e.category === 'INDIRECT').reduce((s, e) => s + parseFloat(e.amount), 0);

  return { direct, indirect, total: direct + indirect, expenses };
};

module.exports = { createSchema, updateSchema, list, get, create, update, remove, monthlyReport };
