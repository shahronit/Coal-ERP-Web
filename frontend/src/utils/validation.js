const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
};

export const validators = {
  required: (value, t) => (isEmpty(value) ? t('validation.required') : null),

  email: (value, t, { required = true } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    return EMAIL_RE.test(String(value).trim()) ? null : t('validation.emailInvalid');
  },

  passwordMin: (value, t, { min = 8, required = true } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    return String(value).length >= min ? null : t('validation.passwordMin');
  },

  nameMin: (value, t, { min = 2 } = {}) => {
    if (isEmpty(value)) return t('validation.required');
    return String(value).trim().length >= min ? null : t('validation.nameMin');
  },

  phone: (value, t, { required = false } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    return PHONE_RE.test(String(value).trim()) ? null : t('validation.phoneInvalid');
  },

  pincode: (value, t, { required = false } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    return PINCODE_RE.test(String(value).trim()) ? null : t('validation.pincodeInvalid');
  },

  uuid: (value, t, { required = true } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    return UUID_RE.test(String(value).trim()) ? null : t('validation.uuidInvalid');
  },

  positiveNumber: (value, t, { required = true } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    const num = Number(value);
    if (Number.isNaN(num)) return t('validation.numberInvalid');
    return num > 0 ? null : t('validation.numberPositive');
  },

  nonNegativeNumber: (value, t, { required = true } = {}) => {
    if (isEmpty(value)) return required ? t('validation.required') : null;
    const num = Number(value);
    if (Number.isNaN(num)) return t('validation.numberInvalid');
    return num >= 0 ? null : t('validation.numberMin', { min: 0 });
  },

  date: (value, t, { required = true } = {}) => {
    if (isEmpty(value)) return required ? t('validation.dateRequired') : null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? t('validation.dateInvalid') : null;
  },

  select: (value, t) => (isEmpty(value) ? t('validation.selectRequired') : null),

  arrayMin: (value, t, { min = 1 } = {}) => {
    if (!Array.isArray(value) || value.length < min) {
      return min === 1 ? t('validation.lineItemsRequired') : t('validation.arrayMin', { min });
    }
    return null;
  },

  match: (value, other, t) => {
    if (isEmpty(value) && isEmpty(other)) return null;
    return value === other ? null : t('validation.passwordMismatch');
  },
};

export default validators;
