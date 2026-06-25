const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const requestTiming = require('./middleware/requestTiming');
const logger = require('./config/logger');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const mastersRoutes = require('./modules/masters');
const purchaseRoutes = require('./modules/purchases/purchase.routes');
const saleRoutes = require('./modules/sales/sale.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const expenseRoutes = require('./modules/expenses/expense.routes');
const assetRoutes = require('./modules/assets/asset.routes');
const investmentRoutes = require('./modules/investments/investment.routes');
const documentRoutes = require('./modules/documents/document.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const reportRoutes = require('./modules/reports/report.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const profitabilityRoutes = require('./modules/profitability/profitability.routes');
const profitLossRoutes = require('./modules/profit-loss/profitLoss.routes');
const accountingRoutes = require('./modules/accounting/accounting.routes');
const leadRoutes = require('./modules/leads/lead.routes');
const activityRoutes = require('./modules/activities/activity.routes');
const backupRoutes = require('./modules/backup/backup.routes');
const batchRoutes = require('./modules/batches/batch.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const searchRoutes = require('./modules/search/search.routes');
const setupRoutes = require('./modules/setup/setup.routes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.TRADECRM_STATIC_DIR ? false : undefined,
}));
app.use(cors({
  origin(origin, callback) {
    if (
      !origin
      || origin === 'null'
      || origin.startsWith('file://')
      || origin === config.frontendUrl
      || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      || config.corsAllowedOrigins.includes(origin)
      || /^https?:\/\/100\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
      || /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)
      || /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests' },
}));

app.use(requestTiming);
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VK Trading ERP API',
      version: '1.0.0',
      description: 'VK Trading ERP and CRM API',
    },
    servers: [{ url: `http://localhost:${config.port}`, description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VK Trading ERP API is running',
    database: config.isFirestoreProvider ? 'firestore' : 'postgres',
    projectId: config.isFirestoreProvider ? config.firebase.projectId : undefined,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/masters', mastersRoutes());
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/profitability', profitabilityRoutes);
app.use('/api/profit-loss', profitLossRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/backup', backupRoutes);

const desktopStaticDir = process.env.TRADECRM_STATIC_DIR;
if (desktopStaticDir && fs.existsSync(desktopStaticDir)) {
  app.use(express.static(desktopStaticDir, { index: 'index.html' }));
  app.get(/^(?!\/api)(?!.*\.[a-z0-9]+(?:\?.*)?$).*$/i, (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(desktopStaticDir, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use(errorHandler);

module.exports = app;
