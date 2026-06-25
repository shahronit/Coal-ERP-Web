import { validators } from './validation';

export const expenseRules = (t) => ({
  expenseTypeId: (values) => validators.uuid(values.expenseTypeId, t),
  category: (values) => validators.select(values.category, t),
  amount: (values) => validators.positiveNumber(values.amount, t),
  expenseDate: (values) => validators.date(values.expenseDate, t),
});

export const paymentRules = (t) => ({
  paymentType: (values) => validators.select(values.paymentType, t),
  paymentMode: (values) => validators.select(values.paymentMode, t),
  amount: (values) => validators.positiveNumber(values.amount, t),
  paymentDate: (values) => validators.date(values.paymentDate, t),
});

export const assetRules = (t) => ({
  name: (values) => validators.required(values.name, t),
  assetTypeId: (values) => validators.uuid(values.assetTypeId, t),
  purchaseValue: (values) => validators.positiveNumber(values.purchaseValue, t),
  purchaseDate: (values) => validators.date(values.purchaseDate, t),
});

export const investmentRules = (t) => ({
  partnerId: (values) => validators.uuid(values.partnerId, t),
  amount: (values) => validators.positiveNumber(values.amount, t),
  investmentDate: (values) => validators.date(values.investmentDate, t),
});

export const leadRules = (t) => ({
  name: (values) => validators.nameMin(values.name, t, { min: 2 }),
  email: (values) => validators.email(values.email, t, { required: false }),
  phone: (values) => validators.phone(values.phone, t, { required: false }),
});

export const activityRules = (t) => ({
  type: (values) => validators.select(values.type, t),
  subject: (values) => validators.nameMin(values.subject, t, { min: 2 }),
});
