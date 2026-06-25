const { PERMISSIONS } = require('../../config/permissions');
const data = require('./report.data');
const { toNumber } = require('../../services/export/formatters');
const { getPLStatement } = require('../accounting/accounting.service');
const { getGstSummary } = require('../accounting/accounting.service');

const sum = (rows, key) => rows.reduce((total, row) => total + toNumber(row[key]), 0);

const definitions = {
  purchases: {
    id: 'purchases',
    title: 'Purchase Register',
    description: 'Confirmed coal purchases by supplier and date.',
    requiredPermission: PERMISSIONS.PURCHASES_READ,
    fetch: data.purchaseReport,
    filters: ['from', 'to', 'supplierId', 'status'],
    columns: [
      { key: 'purchaseNumber', label: 'Number', pdfWidth: 70 },
      { key: 'purchaseDate', label: 'Date', type: 'date', pdfWidth: 70 },
      { key: 'purchaseType', label: 'Type', pdfWidth: 60 },
      { key: 'supplier', label: 'Supplier', pdfWidth: 130 },
      { key: 'location', label: 'Location', pdfWidth: 90 },
      { key: 'truckNumber', label: 'Truck', pdfWidth: 70 },
      { key: 'netAmount', label: 'Amount', type: 'currency', align: 'right', pdfWidth: 80 },
      { key: 'outstanding', label: 'Outstanding', type: 'currency', align: 'right', pdfWidth: 80 },
    ],
    map: (r) => ({
      purchaseNumber: r.purchaseNumber,
      purchaseDate: r.purchaseDate,
      purchaseType: r.purchaseType,
      supplier: r.supplier?.name,
      location: r.location?.name,
      truckNumber: r.truckNumber,
      netAmount: r.netAmount,
      outstanding: r.outstanding,
    }),
    totals: (rows) => ({ netAmount: sum(rows, 'netAmount'), outstanding: sum(rows, 'outstanding') }),
  },
  sales: {
    id: 'sales',
    title: 'Sales Register',
    description: 'Confirmed coal sales by customer and date.',
    requiredPermission: PERMISSIONS.SALES_READ,
    fetch: data.salesReport,
    filters: ['from', 'to', 'customerId', 'status'],
    columns: [
      { key: 'saleNumber', label: 'Number', pdfWidth: 70 },
      { key: 'saleDate', label: 'Date', type: 'date', pdfWidth: 70 },
      { key: 'saleType', label: 'Type', pdfWidth: 60 },
      { key: 'customer', label: 'Customer', pdfWidth: 150 },
      { key: 'truckNumber', label: 'Truck', pdfWidth: 70 },
      { key: 'netAmount', label: 'Amount', type: 'currency', align: 'right', pdfWidth: 85 },
      { key: 'profit', label: 'Profit', type: 'currency', align: 'right', pdfWidth: 85 },
      { key: 'outstanding', label: 'Outstanding', type: 'currency', align: 'right', pdfWidth: 85 },
    ],
    map: (r) => ({
      saleNumber: r.saleNumber,
      saleDate: r.saleDate,
      saleType: r.saleType,
      customer: r.customer?.name,
      truckNumber: r.truckNumber,
      netAmount: r.netAmount,
      profit: r.profit,
      outstanding: r.outstanding,
    }),
    totals: (rows) => ({
      netAmount: sum(rows, 'netAmount'),
      profit: sum(rows, 'profit'),
      outstanding: sum(rows, 'outstanding'),
    }),
  },
  inventory: {
    id: 'inventory',
    title: 'Inventory Report',
    description: 'Quality-wise stock, batches, and valuation.',
    requiredPermission: PERMISSIONS.INVENTORY_READ,
    fetch: data.inventoryReport,
    filters: [],
    columns: [
      { key: 'quality', label: 'Coal Quality', pdfWidth: 160 },
      { key: 'location', label: 'Location', pdfWidth: 100 },
      { key: 'totalWeight', label: 'Stock (MT)', type: 'number', align: 'right', pdfWidth: 80 },
      { key: 'totalValue', label: 'Value', type: 'currency', align: 'right', pdfWidth: 90 },
      { key: 'batches', label: 'Batches', type: 'number', align: 'right', pdfWidth: 70 },
    ],
    map: (r) => ({
      quality: r.quality?.name,
      location: r.location?.name,
      totalWeight: r.totalWeight,
      totalValue: r.totalValue,
      batches: r.batches?.length || 0,
    }),
    totals: (rows) => ({ totalValue: sum(rows, 'totalValue'), totalWeight: sum(rows, 'totalWeight') }),
  },
  profit: {
    id: 'profit',
    title: 'Profit Report',
    description: 'Sales revenue, allocated cost, and profit.',
    requiredPermission: PERMISSIONS.SALES_READ,
    fetch: data.profitReport,
    filters: ['from', 'to', 'customerId'],
    columns: [
      { key: 'saleNumber', label: 'Sale', pdfWidth: 75 },
      { key: 'date', label: 'Date', type: 'date', pdfWidth: 70 },
      { key: 'customer', label: 'Customer', pdfWidth: 140 },
      { key: 'revenue', label: 'Revenue', type: 'currency', align: 'right', pdfWidth: 90 },
      { key: 'cost', label: 'Cost', type: 'currency', align: 'right', pdfWidth: 90 },
      { key: 'profit', label: 'Profit', type: 'currency', align: 'right', pdfWidth: 90 },
    ],
    map: (r) => r,
    totals: (rows) => ({ revenue: sum(rows, 'revenue'), cost: sum(rows, 'cost'), profit: sum(rows, 'profit') }),
  },
  'profit-loss-statement': {
    id: 'profit-loss-statement',
    title: 'Profit & Loss Statement',
    description: 'Revenue, COGS, expenses and net profit.',
    requiredPermission: PERMISSIONS.PROFIT_LOSS_READ,
    fetch: async (query) => {
      const pl = await getPLStatement(query);
      return [
        { line: 'Revenue', amount: pl.revenue },
        { line: 'COGS', amount: -pl.cogs },
        { line: 'Gross Profit', amount: pl.grossProfit },
        { line: 'Direct Expenses', amount: -pl.directExpenses },
        { line: 'Operating Profit', amount: pl.operatingProfit },
        { line: 'Indirect Expenses', amount: -pl.indirectExpenses },
        { line: 'Depreciation', amount: -pl.depreciation },
        { line: 'Net Profit', amount: pl.netProfit },
      ];
    },
    filters: ['from', 'to'],
    columns: [
      { key: 'line', label: 'Line Item', pdfWidth: 200 },
      { key: 'amount', label: 'Amount', type: 'currency', align: 'right', pdfWidth: 100 },
    ],
    map: (r) => r,
    totals: () => ({}),
  },
  'gst-report': {
    id: 'gst-report',
    title: 'GST Report',
    description: 'Input and output GST summary.',
    requiredPermission: PERMISSIONS.REPORTS_READ,
    fetch: async (query) => {
      const gst = await getGstSummary(query);
      return [
        { type: 'Output GST (Sales)', amount: gst.outputGst },
        { type: 'Input GST (Purchases)', amount: gst.inputGst },
        { type: 'Net GST Payable', amount: gst.payable },
      ];
    },
    filters: ['from', 'to'],
    columns: [
      { key: 'type', label: 'Type', pdfWidth: 200 },
      { key: 'amount', label: 'Amount', type: 'currency', align: 'right', pdfWidth: 100 },
    ],
    map: (r) => r,
    totals: () => ({}),
  },
  'partner-roi': {
    id: 'partner-roi',
    title: 'Partner ROI Report',
    description: 'Partner investment, returns, and ROI.',
    requiredPermission: PERMISSIONS.INVESTMENTS_READ,
    fetch: data.partnerROIReport,
    filters: [],
    columns: [
      { key: 'partner', label: 'Partner', pdfWidth: 150 },
      { key: 'invested', label: 'Invested', type: 'currency', align: 'right', pdfWidth: 95 },
      { key: 'returns', label: 'Returns', type: 'currency', align: 'right', pdfWidth: 95 },
      { key: 'roiPercent', label: 'ROI %', type: 'percent', align: 'right', pdfWidth: 80 },
      { key: 'profitShare', label: 'Profit Share %', type: 'percent', align: 'right', pdfWidth: 90 },
    ],
    map: (r) => r,
    totals: (rows) => ({ invested: sum(rows, 'invested'), returns: sum(rows, 'returns') }),
  },
  expenses: {
    id: 'expenses',
    title: 'Expense Report',
    description: 'Direct and indirect business expenses.',
    requiredPermission: PERMISSIONS.EXPENSES_READ,
    fetch: data.expensesReport,
    filters: ['from', 'to', 'category'],
    columns: [
      { key: 'expenseDate', label: 'Date', type: 'date', pdfWidth: 75 },
      { key: 'expenseType', label: 'Type', pdfWidth: 130 },
      { key: 'category', label: 'Category', pdfWidth: 80 },
      { key: 'description', label: 'Description', pdfWidth: 170 },
      { key: 'amount', label: 'Amount', type: 'currency', align: 'right', pdfWidth: 90 },
    ],
    map: (r) => ({
      expenseDate: r.expenseDate,
      expenseType: r.expenseType?.name,
      category: r.category,
      description: r.description,
      amount: r.amount,
    }),
    totals: (rows) => ({ amount: sum(rows, 'amount') }),
  },
  payments: {
    id: 'payments',
    title: 'Payment Report',
    description: 'Received and paid payment history.',
    requiredPermission: PERMISSIONS.PAYMENTS_READ,
    fetch: data.paymentsReport,
    filters: ['from', 'to', 'paymentType', 'entityType'],
    columns: [
      { key: 'paymentDate', label: 'Date', type: 'date', pdfWidth: 75 },
      { key: 'paymentType', label: 'Type', pdfWidth: 80 },
      { key: 'paymentMode', label: 'Mode', pdfWidth: 90 },
      { key: 'entityType', label: 'Entity', pdfWidth: 80 },
      { key: 'referenceNo', label: 'Reference', pdfWidth: 120 },
      { key: 'amount', label: 'Amount', type: 'currency', align: 'right', pdfWidth: 90 },
    ],
    map: (r) => ({
      paymentDate: r.paymentDate,
      paymentType: r.paymentType,
      paymentMode: r.paymentMode,
      entityType: r.entityType,
      referenceNo: r.referenceNo,
      amount: r.amount,
    }),
    totals: (rows) => ({ amount: sum(rows, 'amount') }),
  },
};

const getReportDefinition = (type) => definitions[type];
const listReportDefinitions = () => Object.values(definitions);

module.exports = { definitions, getReportDefinition, listReportDefinitions };
