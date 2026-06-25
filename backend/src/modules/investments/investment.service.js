const Joi = require('joi');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate, findById, softDelete } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const { toNumber } = require('../../utils/calculations');
const { stringifyJson } = require('../../utils/jsonFields');
const {
  uuidField,
  positiveNumber,
  dateField,
  stringOptional,
  withMessages,
} = require('../../utils/joiFields');

const investmentSchema = Joi.object({
  partnerId: uuidField('Partner'),
  amount: positiveNumber('Amount'),
  investmentDate: dateField('Investment date'),
  terms: stringOptional('Terms'),
  expectedROI: withMessages(Joi.number().min(0).max(100).default(0).label('Expected ROI')),
  notes: stringOptional('Notes'),
});

const returnSchema = Joi.object({
  returnDate: dateField('Return date'),
  amount: positiveNumber('Amount'),
  profitShare: withMessages(Joi.number().min(0).default(0).label('Profit share')),
  roiPercent: withMessages(Joi.number().min(0).default(0).label('ROI percent')),
  notes: stringOptional('Notes'),
});

const listInvestments = (query) =>
  paginate('partnerInvestment', {
    ...mergeListQuery(query, { dateField: 'investmentDate', filterKeys: ['partnerId'] }),
    searchFields: ['terms', 'notes'],
    include: { partner: true, returns: true },
  });

const getInvestment = async (id) => {
  const inv = await findById('partnerInvestment', id, { partner: true, returns: true });
  if (!inv) throw new AppError('Investment not found', 404);
  return inv;
};

const createInvestment = async (data, userId) => {
  const investment = await prisma.partnerInvestment.create({
    data: { ...data, investmentDate: new Date(data.investmentDate), createdById: userId, updatedById: userId },
    include: { partner: true },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] }, deletedAt: null },
  });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'NEW_INVESTMENT',
        title: 'New Partner Investment',
        body: `Investment of ₹${data.amount} recorded for ${investment.partner.name}.`,
        metadata: stringifyJson({ investmentId: investment.id }),
      },
    });
  }

  return investment;
};

const addReturn = async (investmentId, data) => {
  const inv = await findById('partnerInvestment', investmentId);
  if (!inv) throw new AppError('Investment not found', 404);
  return prisma.investmentReturn.create({
    data: { ...data, investmentId, returnDate: new Date(data.returnDate) },
  });
};

const getROIDashboard = async () => {
  const investments = await prisma.partnerInvestment.findMany({
    where: { deletedAt: null },
    include: { partner: true, returns: true },
  });

  return investments.map(inv => {
    const totalInvested = toNumber(inv.amount);
    const totalReturns = inv.returns.reduce((s, r) => s + toNumber(r.amount), 0);
    const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : 0;
    return {
      id: inv.id,
      partner: inv.partner.name,
      invested: totalInvested,
      returns: totalReturns,
      roiPercent: parseFloat(roi),
      profitShare: toNumber(inv.partner.profitShare),
    };
  });
};

const removeInvestment = async (id, role) => {
  if (!canDelete(role)) throw new AppError('Not authorized', 403);
  return softDelete('partnerInvestment', id);
};

module.exports = {
  investmentSchema,
  returnSchema,
  listInvestments,
  getInvestment,
  createInvestment,
  addReturn,
  getROIDashboard,
  removeInvestment,
};
