import validators, { isEmpty } from './validation';

/**
 * rules: { fieldName: (values, t) => errorMessage | null }
 * Supports dot paths for nested values via getValue().
 */
export const getValue = (obj, path) => {
  if (!path.includes('.')) return obj?.[path];
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

export const validateFields = (rules, values, t) => {
  const errors = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const message = typeof rule === 'function' ? rule(values, t) : null;
    if (message) errors[field] = message;
  });
  return errors;
};

export const mapApiErrorsToFields = (apiErrors = []) => {
  const errors = {};
  apiErrors.forEach(({ field, message }) => {
    if (field) errors[field] = message;
  });
  return errors;
};

export const getFieldError = (errors, field) => errors?.[field] || '';

export const clearFieldError = (setErrors, field) => {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
};

export const mergeErrors = (...errorObjects) => Object.assign({}, ...errorObjects);

export { validators, isEmpty };
