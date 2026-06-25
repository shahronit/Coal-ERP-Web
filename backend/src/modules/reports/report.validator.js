const Joi = require('joi');
const { listReportDefinitions } = require('./report.registry');
const {
  stringOptional,
  withMessages,
} = require('../../utils/joiFields');

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY'];
const BASE_REPORT_TYPES = () => listReportDefinitions().map((d) => d.id);

const createTemplateSchema = Joi.object({
  name: withMessages(Joi.string().trim().min(1).max(200).required().label('Template name')),
  description: stringOptional('Description'),
  baseReportType: withMessages(
    Joi.string()
      .valid(...BASE_REPORT_TYPES())
      .required()
      .label('Base report type')
  ),
  columns: withMessages(
    Joi.array().items(Joi.string()).min(1).required().label('Columns')
  ),
  filters: withMessages(Joi.array().items(Joi.string()).default([]).label('Filters')),
  allowedRoles: withMessages(
    Joi.array()
      .items(Joi.string().valid(...ROLES))
      .min(1)
      .required()
      .label('Allowed roles')
  ),
});

const updateTemplateSchema = createTemplateSchema.fork(
  ['name', 'baseReportType', 'columns', 'allowedRoles'],
  (s) => s.optional()
).keys({
  isActive: withMessages(Joi.boolean().label('Active status')),
}).min(1);

module.exports = { createTemplateSchema, updateTemplateSchema, ROLES };
