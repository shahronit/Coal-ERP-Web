const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, findById } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { toNumber, round } = require('../../utils/calculations');
const {
  uuidFieldOptional,
  positiveNumber,
  dateField,
  stringOptional,
  enumField,
} = require('../../utils/joiFields');

const createSchema = Joi.object({
  paymentType: enumField('Payment type', ['RECEIVED', 'PAID']),
  paymentMode: enumField('Payment mode', ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
  amount: positiveNumber('Amount'),
  paymentDate: dateField('Payment date'),
  referenceNo: stringOptional('Reference number'),
  paidByName: stringOptional('Paid by'),
  entityType: enumField('Entity type', ['PURCHASE', 'SALE', 'PARTNER', 'EXPENSE', 'OTHER']),
  entityId: uuidFieldOptional('Entity'),
  notes: stringOptional('Notes'),
});

const updateOutstanding = async (entityType, entityId, amount, paymentType) => {
  if (!entityId) return;

  if (entityType === 'PURCHASE') {
    const purchase = await prisma.purchase.findUnique({ where: { id: entityId } });
    if (!purchase) throw new AppError('Purchase not found', 404);
    const paid = paymentType === 'PAID'
      ? toNumber(purchase.paidAmount) + toNumber(amount)
      : toNumber(purchase.paidAmount);
    await prisma.purchase.update({
      where: { id: entityId },
      data: {
        paidAmount: paid,
        outstanding: round(toNumber(purchase.netAmount) - paid),
      },
    });
  }

  if (entityType === 'SALE') {
    const sale = await prisma.sale.findUnique({ where: { id: entityId } });
    if (!sale) throw new AppError('Sale not found', 404);
    const paid = paymentType === 'RECEIVED'
      ? toNumber(sale.paidAmount) + toNumber(amount)
      : toNumber(sale.paidAmount);
    await prisma.sale.update({
      where: { id: entityId },
      data: {
        paidAmount: paid,
        outstanding: round(toNumber(sale.netAmount) - paid),
      },
    });
  }
};

const list = (query) =>
  paginate('payment', {
    ...mergeListQuery(query, { dateField: 'paymentDate', filterKeys: ['paymentType', 'entityType'] }),
    searchFields: ['referenceNo', 'notes', 'paidByName'],
  });

const get = async (id) => {
  const payment = await findById('payment', id);
  if (!payment) throw new AppError('Payment not found', 404);
  return payment;
};

const create = async (data, userId) => {
  const payment = await prisma.payment.create({
    data: { ...data, paymentDate: new Date(data.paymentDate), createdById: userId, updatedById: userId },
  });
  await updateOutstanding(data.entityType, data.entityId, data.amount, data.paymentType);
  return payment;
};

const getOutstanding = async () => {
  const [purchaseOutstanding, saleOutstanding] = await Promise.all([
    prisma.purchase.aggregate({ where: { deletedAt: null, outstanding: { gt: 0 } }, _sum: { outstanding: true } }),
    prisma.sale.aggregate({ where: { deletedAt: null, outstanding: { gt: 0 } }, _sum: { outstanding: true } }),
  ]);

  return {
    payable: toNumber(purchaseOutstanding._sum.outstanding),
    receivable: toNumber(saleOutstanding._sum.outstanding),
    net: toNumber(saleOutstanding._sum.outstanding) - toNumber(purchaseOutstanding._sum.outstanding),
  };
};

module.exports = { createSchema, list, get, create, getOutstanding };
