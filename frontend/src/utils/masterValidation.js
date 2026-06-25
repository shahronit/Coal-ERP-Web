import { validators, isEmpty } from './validation';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export const validateMasterField = (field, value, t) => {
  const { key, type, required } = field;

  if (key === 'email') return validators.email(value, t, { required: false });
  if (key === 'phone') return validators.phone(value, t, { required: false });

  if (required || (type === 'number' && !isEmpty(value))) {
    if (isEmpty(value)) return t('validation.required');
  }

  if (key === 'name') {
    if (!isEmpty(value) && String(value).trim().length < 1) return t('validation.required');
    if (required && String(value).trim().length < 1) return t('validation.required');
  }

  if (key === 'gstin' && !isEmpty(value) && !GSTIN_RE.test(String(value).trim())) {
    return 'Enter a valid GSTIN (15 characters)';
  }

  if (type === 'number' && !isEmpty(value)) {
    const num = Number(value);
    if (Number.isNaN(num)) return t('validation.numberInvalid');
    if (num < 0) return t('validation.numberMin', { min: 0 });
    if ((key === 'gstRate' || key === 'depreciationRate' || key === 'profitShare'
      || key === 'ashPercent' || key === 'moisturePercent') && num > 100) {
      return t('validation.numberMax', { max: 100 });
    }
  }

  if (type === 'date' && required) {
    return validators.date(value, t);
  }

  return null;
};

export const validateMasterForm = (fields, form, t) => {
  const errors = {};
  fields.forEach((field) => {
    const message = validateMasterField(field, form[field.key], t);
    if (message) errors[field.key] = message;
  });
  return errors;
};

export const masterFieldsForType = (type, t) => {
  const extraFields = {
    partners: [
      { key: 'email', label: t('fields.email') },
      { key: 'phone', label: t('fields.phone') },
      { key: 'address', label: t('fields.address') },
      { key: 'profitShare', label: t('fields.profitShare'), type: 'number' },
    ],
    suppliers: [
      { key: 'gstin', label: t('fields.gstin') },
      { key: 'email', label: t('fields.email') },
      { key: 'phone', label: t('fields.phone') },
    ],
    customers: [
      { key: 'gstin', label: t('fields.gstin') },
      { key: 'email', label: t('fields.email') },
      { key: 'phone', label: t('fields.phone') },
    ],
    locations: [
      { key: 'address', label: t('fields.address') },
    ],
    'coal-qualities': [
      { key: 'gcv', label: 'GCV', type: 'number' },
      { key: 'ashPercent', label: 'Ash %', type: 'number' },
      { key: 'moisturePercent', label: 'Moisture %', type: 'number' },
      { key: 'description', label: t('fields.description') },
    ],
    'purchase-batches': [
      { key: 'code', label: 'Batch Code', required: true },
      { key: 'name', label: 'Name', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'description', label: t('fields.description') },
    ],
    'sales-batches': [
      { key: 'code', label: 'Batch Code', required: true },
      { key: 'name', label: 'Name', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'description', label: t('fields.description') },
    ],
    'asset-types': [{ key: 'depreciationRate', label: t('fields.depreciationRate'), type: 'number' }],
    'tax-configurations': [
      { key: 'gstRate', label: t('fields.gstRate'), type: 'number', required: true },
      { key: 'effectiveFrom', label: t('fields.effectiveFrom'), type: 'date', required: true },
    ],
  };

  const batchTypes = ['purchase-batches', 'sales-batches'];
  if (batchTypes.includes(type)) return extraFields[type];

  return [
    { key: 'name', label: t('fields.name'), required: true },
    ...(extraFields[type] || [{ key: 'description', label: t('fields.description') }]),
  ];
};
