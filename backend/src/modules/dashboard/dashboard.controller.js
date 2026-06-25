const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response');

const kpis = async (req, res, next) => {
  try {
    sendSuccess(res, await dashboardService.getKPIs());
  } catch (err) { next(err); }
};

const trends = async (req, res, next) => {
  try {
    sendSuccess(res, await dashboardService.getMonthlyTrends());
  } catch (err) { next(err); }
};

const topCustomers = async (req, res, next) => {
  try {
    sendSuccess(res, await dashboardService.getTopCustomers());
  } catch (err) { next(err); }
};

const topSuppliers = async (req, res, next) => {
  try {
    sendSuccess(res, await dashboardService.getTopSuppliers());
  } catch (err) { next(err); }
};

const summary = async (req, res, next) => {
  try {
    sendSuccess(res, await dashboardService.getSummary(), 'Dashboard summary retrieved');
  } catch (err) { next(err); }
};

const qualityStock = async (req, res, next) => {
  try {
    sendSuccess(res, await dashboardService.getQualityStock(), 'Quality stock retrieved');
  } catch (err) { next(err); }
};

module.exports = { summary, kpis, trends, topCustomers, topSuppliers, qualityStock };
