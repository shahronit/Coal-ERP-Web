const express = require('express');
const controller = require('./report.controller');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/permissions');
const { createTemplateSchema, updateTemplateSchema } = require('./report.validator');

const router = express.Router();
router.use(authenticate, authorize(PERMISSIONS.REPORTS_READ));

router.get('/types', controller.listTypes);
router.get('/templates/options', controller.listTemplateOptions);
router.get('/templates', controller.listTemplates);
router.post('/templates', validate(createTemplateSchema), controller.createTemplate);
router.put('/templates/:id', validate(updateTemplateSchema), controller.updateTemplate);
router.delete('/templates/:id', controller.deleteTemplate);
router.post('/templates/:id/run', controller.runTemplate);
router.get('/documents/sales/:id/invoice', controller.exportSalesInvoice);
router.get('/documents/purchases/:id/bill', controller.exportPurchaseBill);
router.get('/documents/payments/:id/receipt', controller.exportPaymentReceipt);
router.get('/documents/expenses/:id/voucher', controller.exportExpenseVoucher);
router.get('/documents/investments/:id/statement', controller.exportInvestmentStatement);
router.get('/:type/export', controller.exportReport);

module.exports = router;
