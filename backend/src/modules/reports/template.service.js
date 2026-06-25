const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { hasPermission } = require('../../config/permissions');
const { parseJsonArray, parseReportTemplate, stringifyJson } = require('../../utils/jsonFields');
const { getReportDefinition, listReportDefinitions } = require('./report.registry');
const reportService = require('./report.service');

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'READ_ONLY'];

const isAdmin = (user) => ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);

const normalizeArray = (value) => Array.isArray(value) ? value : parseJsonArray(value);

const assertAdmin = (user) => {
  if (!isAdmin(user)) throw new AppError('Only admins can manage report templates', 403);
};

const assertTemplateVisible = (template, user) => {
  const allowedRoles = parseJsonArray(template.allowedRoles);
  if (!allowedRoles.includes(user.role)) throw new AppError('Template not available for this role', 403);
};

const validateTemplatePayload = (payload) => {
  const definition = getReportDefinition(payload.baseReportType);
  if (!definition) throw new AppError('Invalid base report type', 400);

  const allowedColumnKeys = new Set(definition.columns.map(column => column.key));
  const requestedColumns = normalizeArray(payload.columns);
  if (!requestedColumns.length) throw new AppError('Select at least one column', 400);
  requestedColumns.forEach((key) => {
    if (!allowedColumnKeys.has(key)) throw new AppError(`Invalid column: ${key}`, 400);
  });

  const allowedFilterKeys = new Set(definition.filters || []);
  const filters = normalizeArray(payload.filters);
  filters.forEach((key) => {
    if (!allowedFilterKeys.has(key)) throw new AppError(`Invalid filter: ${key}`, 400);
  });

  const roles = normalizeArray(payload.allowedRoles);
  if (!roles.length) throw new AppError('Select at least one allowed role', 400);
  roles.forEach((role) => {
    if (!ROLES.includes(role)) throw new AppError(`Invalid role: ${role}`, 400);
  });

  return { definition, columns: requestedColumns, filters, allowedRoles: roles };
};

const listOptions = (user) => {
  assertAdmin(user);
  return {
    roles: ROLES,
    baseReports: listReportDefinitions().map(definition => ({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      filters: definition.filters,
      columns: definition.columns.map(({ key, label, type }) => ({ key, label, type })),
    })),
  };
};

const listTemplates = async (user) => {
  const where = { deletedAt: null, isActive: true };
  const templates = await prisma.reportTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return templates
    .filter(template => isAdmin(user) || parseJsonArray(template.allowedRoles).includes(user.role))
    .map(parseReportTemplate);
};

const createTemplate = async (payload, user) => {
  assertAdmin(user);
  const validated = validateTemplatePayload(payload);
  const template = await prisma.reportTemplate.create({
    data: {
      name: payload.name,
      description: payload.description || null,
      baseReportType: payload.baseReportType,
      columns: stringifyJson(validated.columns),
      filters: stringifyJson(validated.filters),
      allowedRoles: stringifyJson(validated.allowedRoles),
      createdById: user.id,
      updatedById: user.id,
    },
  });
  return parseReportTemplate(template);
};

const updateTemplate = async (id, payload, user) => {
  assertAdmin(user);
  const existing = await prisma.reportTemplate.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError('Report template not found', 404);
  const merged = { ...existing, ...payload };
  const validated = validateTemplatePayload(merged);
  const template = await prisma.reportTemplate.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
      baseReportType: payload.baseReportType ?? existing.baseReportType,
      columns: stringifyJson(validated.columns),
      filters: stringifyJson(validated.filters),
      allowedRoles: stringifyJson(validated.allowedRoles),
      isActive: payload.isActive ?? existing.isActive,
      updatedById: user.id,
    },
  });
  return parseReportTemplate(template);
};

const deleteTemplate = async (id, user) => {
  assertAdmin(user);
  const existing = await prisma.reportTemplate.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError('Report template not found', 404);
  return prisma.reportTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, updatedById: user.id },
  });
};

const runTemplate = async (id, format, filters, user, res) => {
  const template = await prisma.reportTemplate.findFirst({ where: { id, deletedAt: null, isActive: true } });
  if (!template) throw new AppError('Report template not found', 404);
  assertTemplateVisible(template, user);

  const definition = getReportDefinition(template.baseReportType);
  if (!definition) throw new AppError('Invalid base report type', 400);
  if (!hasPermission(user.role, definition.requiredPermission)) {
    throw new AppError('Insufficient permissions for template source data', 403);
  }

  const selectedKeys = parseJsonArray(template.columns);
  const selectedColumns = definition.columns.filter(column => selectedKeys.includes(column.key));
  await prisma.reportRun.create({
    data: {
      templateId: template.id,
      runById: user.id,
      format,
      filters: stringifyJson(filters),
    },
  });

  await reportService.exportDefinition(
    { ...definition, columns: selectedColumns },
    format,
    filters,
    user,
    res,
    {
      title: template.name,
      filename: `custom-report-${template.name}`,
      metadata: { Template: template.name },
    }
  );
};

module.exports = {
  listOptions,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  runTemplate,
};
