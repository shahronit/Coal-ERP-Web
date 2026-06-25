const Joi = require('joi');
const {
  emailField,
  emailFieldOptional,
  nameField,
  nameFieldOptional,
  passwordField,
  passwordFieldOptional,
  phoneField,
  pincodeField,
  withMessages,
} = require('../../utils/joiFields');

const loginSchema = Joi.object({
  email: emailField,
  password: withMessages(Joi.string().min(6).required().label('Password')),
});

const refreshSchema = Joi.object({
  refreshToken: withMessages(Joi.string().required().label('Refresh token')),
});

const forgotPasswordSchema = Joi.object({
  email: emailField,
});

const resetPasswordSchema = Joi.object({
  token: withMessages(Joi.string().required().label('Token')),
  newPassword: passwordField(8, 'New password'),
});

const changePasswordSchema = Joi.object({
  currentPassword: withMessages(Joi.string().required().label('Current password')),
  newPassword: passwordField(8, 'New password'),
});

const updateProfileSchema = Joi.object({
  name: nameFieldOptional(),
  phone: phoneField,
  username: withMessages(Joi.string().min(2).max(50).allow('', null).label('Username')),
  department: withMessages(Joi.string().max(100).allow('', null).label('Department')),
  designation: withMessages(Joi.string().max(100).allow('', null).label('Designation')),
  address: withMessages(Joi.string().max(500).allow('', null).label('Address')),
  pincode: pincodeField,
}).min(1);

const createUserSchema = Joi.object({
  email: emailField,
  password: passwordField(),
  name: nameField(),
  role: withMessages(
    Joi.string()
      .valid('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY')
      .required()
      .label('Role')
  ),
  isActive: withMessages(Joi.boolean().default(true).label('Active status')),
});

const updateUserSchema = Joi.object({
  email: emailFieldOptional,
  name: nameFieldOptional(),
  role: withMessages(
    Joi.string()
      .valid('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY')
      .label('Role')
  ),
  isActive: withMessages(Joi.boolean().label('Active status')),
  password: passwordFieldOptional(),
}).min(1);

module.exports = {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  createUserSchema,
  updateUserSchema,
};
