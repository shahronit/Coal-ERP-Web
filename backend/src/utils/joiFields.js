const Joi = require('joi');

const messages = {
  required: '{{#label}} is required',
  stringMin: '{{#label}} must be at least {{#limit}} characters',
  stringMax: '{{#label}} must be at most {{#limit}} characters',
  stringPattern: '{{#label}} is invalid',
  stringEmail: '{{#label}} must be a valid email address',
  numberPositive: '{{#label}} must be a positive number',
  numberMin: '{{#label}} must be at least {{#limit}}',
  numberMax: '{{#label}} must be at most {{#limit}}',
  dateBase: '{{#label}} must be a valid date',
  uuid: '{{#label}} must be a valid ID',
  arrayMin: '{{#label}} must contain at least {{#limit}} item(s)',
  anyOnly: '{{#label}} must be one of {{#valids}}',
};

const withMessages = (schema) => schema.messages(messages);

const emailField = withMessages(
  Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .required()
    .label('Email')
    .messages({ 'string.pattern.base': messages.stringEmail })
);

const emailFieldOptional = withMessages(
  Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .allow('', null)
    .label('Email')
    .messages({ 'string.pattern.base': messages.stringEmail })
);

const uuidField = (label = 'ID') =>
  withMessages(Joi.string().uuid().required().label(label));

const uuidFieldOptional = (label = 'ID') =>
  withMessages(Joi.string().uuid().allow(null, '').label(label));

const nameField = (min = 2, max = 100) =>
  withMessages(Joi.string().trim().min(min).max(max).required().label('Name'));

const nameFieldOptional = (min = 2, max = 100) =>
  withMessages(Joi.string().trim().min(min).max(max).label('Name'));

const passwordField = (min = 8, label = 'Password') =>
  withMessages(Joi.string().min(min).required().label(label));

const passwordFieldOptional = (min = 8, label = 'Password') =>
  withMessages(Joi.string().min(min).label(label));

const phoneField = withMessages(
  Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .allow('', null)
    .label('Phone')
    .messages({ 'string.pattern.base': 'Phone must be a valid 10-digit number' })
);

const pincodeField = withMessages(
  Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .allow('', null)
    .label('PIN code')
    .messages({ 'string.pattern.base': 'PIN code must be a valid 6-digit number' })
);

const positiveNumber = (label) =>
  withMessages(Joi.number().positive().required().label(label));

const nonNegativeNumber = (label, defaultVal) => {
  let schema = withMessages(Joi.number().min(0).required().label(label));
  if (defaultVal !== undefined) schema = schema.default(defaultVal);
  return schema;
};

const dateField = (label) =>
  withMessages(Joi.date().required().label(label));

const dateFieldOptional = (label) =>
  withMessages(Joi.date().allow(null).label(label));

const stringOptional = (label, max) => {
  let schema = Joi.string().allow('', null).label(label);
  if (max) schema = schema.max(max);
  return withMessages(schema);
};

const enumField = (label, values, defaultVal) => {
  let schema = withMessages(Joi.string().valid(...values).required().label(label));
  if (defaultVal !== undefined) schema = schema.default(defaultVal);
  return schema;
};

const booleanField = (label, defaultVal) => {
  let schema = withMessages(Joi.boolean().label(label));
  if (defaultVal !== undefined) schema = schema.default(defaultVal);
  return schema;
};

module.exports = {
  messages,
  withMessages,
  emailField,
  emailFieldOptional,
  uuidField,
  uuidFieldOptional,
  nameField,
  nameFieldOptional,
  passwordField,
  passwordFieldOptional,
  phoneField,
  pincodeField,
  positiveNumber,
  nonNegativeNumber,
  dateField,
  dateFieldOptional,
  stringOptional,
  enumField,
  booleanField,
};
