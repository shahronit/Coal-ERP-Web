import { validators, isEmpty } from './validation';

const lineStarted = (line) => line.qualityId || line.weight || line.rate;

const validateLineItems = (lineItems, t, prefix = 'lineItems') => {
  const errors = {};
  const validLines = [];

  if (!lineItems?.length) {
    errors[prefix] = t('validation.lineItemsRequired');
    return errors;
  }

  lineItems.forEach((line, idx) => {
    if (!lineStarted(line)) {
      if (lineItems.length === 1) {
        errors[`${prefix}.${idx}.qualityId`] = t('validation.selectRequired');
        errors[`${prefix}.${idx}.weight`] = t('validation.required');
        errors[`${prefix}.${idx}.rate`] = t('validation.required');
      }
      return;
    }

    if (!line.qualityId) errors[`${prefix}.${idx}.qualityId`] = t('validation.selectRequired');
    const weightErr = validators.positiveNumber(line.weight, t);
    if (weightErr) errors[`${prefix}.${idx}.weight`] = weightErr;
    const rateErr = validators.positiveNumber(line.rate, t);
    if (rateErr) errors[`${prefix}.${idx}.rate`] = rateErr;

    if (line.qualityId && Number(line.weight) > 0 && Number(line.rate) > 0) {
      validLines.push(line);
    }
  });

  if (!Object.keys(errors).length && !validLines.length) {
    errors[prefix] = t('validation.lineItemsRequired');
  }

  return errors;
};

const validateAdjustments = (items, t, prefix, typeKey) => {
  const errors = {};
  items.forEach((item, idx) => {
    const started = item[typeKey] || item.value || item.description;
    if (!started) return;
    if (!item[typeKey]) errors[`${prefix}.${idx}.${typeKey}`] = t('validation.selectRequired');
    const valueErr = validators.positiveNumber(item.value, t);
    if (valueErr) errors[`${prefix}.${idx}.value`] = valueErr;
  });
  return errors;
};

export const validatePurchaseForm = (form, t) => {
  const errors = {};

  const dateErr = validators.date(form.purchaseDate, t);
  if (dateErr) errors.purchaseDate = dateErr;

  const supplierErr = validators.uuid(form.supplierId, t);
  if (supplierErr) errors.supplierId = supplierErr;

  Object.assign(errors, validateLineItems(form.lineItems, t));
  Object.assign(errors, validateAdjustments(form.expenseAdjustments, t, 'expenseAdjustments', 'expenseTypeId'));
  Object.assign(errors, validateAdjustments(form.incomeAdjustments, t, 'incomeAdjustments', 'incomeTypeId'));

  return errors;
};

export const validateSaleForm = (form, t) => {
  const errors = {};

  const dateErr = validators.date(form.saleDate, t);
  if (dateErr) errors.saleDate = dateErr;

  const customerErr = validators.uuid(form.customerId, t);
  if (customerErr) errors.customerId = customerErr;

  Object.assign(errors, validateLineItems(form.lineItems, t));
  Object.assign(errors, validateAdjustments(form.expenseAdjustments, t, 'expenseAdjustments', 'expenseTypeId'));
  Object.assign(errors, validateAdjustments(form.incomeAdjustments, t, 'incomeAdjustments', 'incomeTypeId'));

  form.freightEntries?.forEach((entry, idx) => {
    const started = entry.description || entry.amount || entry.truckNumber;
    if (!started) return;
    const amountErr = validators.nonNegativeNumber(entry.amount, t);
    if (amountErr) errors[`freightEntries.${idx}.amount`] = amountErr;
  });

  return errors;
};

export { lineStarted, isEmpty };
