const reportService = require('./report.service');
const documentService = require('./document.service');
const templateService = require('./template.service');
const { AppError } = require('../../utils/AppError');

const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const format = req.query.format || 'excel';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await reportService.exportReport(type, format, req.query, req.user, res);
  } catch (err) { next(err); }
};

const listTypes = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: reportService.listTypes(req.user),
      message: 'Report types retrieved',
    });
  } catch (err) { next(err); }
};

const exportSalesInvoice = async (req, res, next) => {
  try {
    const format = req.query.format || 'pdf';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await documentService.exportSalesInvoice(req.params.id, format, req.user, res);
  } catch (err) { next(err); }
};

const exportPurchaseBill = async (req, res, next) => {
  try {
    const format = req.query.format || 'pdf';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await documentService.exportPurchaseBill(req.params.id, format, req.user, res);
  } catch (err) { next(err); }
};

const exportPaymentReceipt = async (req, res, next) => {
  try {
    const format = req.query.format || 'pdf';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await documentService.exportPaymentReceipt(req.params.id, format, req.user, res);
  } catch (err) { next(err); }
};

const exportExpenseVoucher = async (req, res, next) => {
  try {
    const format = req.query.format || 'pdf';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await documentService.exportExpenseVoucher(req.params.id, format, req.user, res);
  } catch (err) { next(err); }
};

const exportInvestmentStatement = async (req, res, next) => {
  try {
    const format = req.query.format || 'pdf';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await documentService.exportInvestmentStatement(req.params.id, format, req.user, res);
  } catch (err) { next(err); }
};

const listTemplateOptions = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: templateService.listOptions(req.user),
      message: 'Report template options retrieved',
    });
  } catch (err) { next(err); }
};

const listTemplates = async (req, res, next) => {
  try {
    const data = await templateService.listTemplates(req.user);
    res.json({ success: true, data, message: 'Report templates retrieved' });
  } catch (err) { next(err); }
};

const createTemplate = async (req, res, next) => {
  try {
    const data = await templateService.createTemplate(req.body, req.user);
    res.status(201).json({ success: true, data, message: 'Report template created' });
  } catch (err) { next(err); }
};

const updateTemplate = async (req, res, next) => {
  try {
    const data = await templateService.updateTemplate(req.params.id, req.body, req.user);
    res.json({ success: true, data, message: 'Report template updated' });
  } catch (err) { next(err); }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await templateService.deleteTemplate(req.params.id, req.user);
    res.json({ success: true, message: 'Report template deleted' });
  } catch (err) { next(err); }
};

const runTemplate = async (req, res, next) => {
  try {
    const format = req.query.format || 'excel';
    if (!['excel', 'pdf', 'csv'].includes(format)) throw new AppError('Invalid format', 400);
    await templateService.runTemplate(req.params.id, format, req.body || {}, req.user, res);
  } catch (err) { next(err); }
};

module.exports = {
  exportReport,
  listTypes,
  exportSalesInvoice,
  exportPurchaseBill,
  exportPaymentReceipt,
  exportExpenseVoucher,
  exportInvestmentStatement,
  listTemplateOptions,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  runTemplate,
};
