/**
 * Full-app integration tests — critical user scenarios against live API + database.
 *
 * Run:  cd backend && npm test
 *       npm run test:full
 *
 * Requires backend/.env (Firestore or Postgres) and demo user superadmin@tradecrm.com
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const {
  createApiClient,
  expectOk,
  expectFail,
  round2,
} = require('../helpers/apiTest');

const getFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
  server.on('error', reject);
});

const STAMP = Date.now();
const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

/** Shared IDs created during master-data tests — used by trading flow tests */
const qa = {};

describe('TradeCRM Pro — full app integration', () => {
  let baseUrl;
  let api;
  let stopServer;
  let db;
  let token;
  let user;

  /** @type {Record<string, string[]>} */
  const cleanup = {
    purchases: [],
    sales: [],
    payments: [],
    expenses: [],
    leads: [],
    masters: [],
  };

  before(async () => {
    const port = await getFreePort();
    process.env.PORT = String(port);
    process.env.HOST = '127.0.0.1';
    process.env.NODE_ENV = 'test';

    const { connectDatabase, getDb, disconnectDatabase } = require('../../src/db');
    await connectDatabase();
    db = getDb();

    const { startServer, stopServer: stop } = require('../../src/server');
    await startServer({ port, host: '127.0.0.1' });
    stopServer = async () => {
      await stop();
      await disconnectDatabase();
    };

    baseUrl = `http://127.0.0.1:${port}/api`;
    api = createApiClient(baseUrl);
  });

  after(async () => {
    const now = new Date();
    for (const id of cleanup.sales) {
      await db.sale.update({ where: { id }, data: { deletedAt: now, status: 'CANCELLED' } }).catch(() => {});
    }
    for (const id of cleanup.purchases) {
      await db.purchase.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
    }
    for (const id of cleanup.payments) {
      await db.payment.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
    }
    for (const id of cleanup.expenses) {
      await db.expense.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
    }
    for (const id of cleanup.leads) {
      await db.lead.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
    }
    for (const id of cleanup.masters) {
      await db.location.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
      await db.supplier.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
      await db.customer.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
      await db.coalQuality.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
      await db.purchaseBatch.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
      await db.salesBatch.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
      await db.partner.update({ where: { id }, data: { deletedAt: now } }).catch(() => {});
    }
    if (stopServer) await stopServer();
  });

  // ─── Health & security ───────────────────────────────────────────────
  describe('1. Health & authentication', () => {
    it('GET /health returns database info', async () => {
      const res = await api.get('/health');
      const body = expectOk(res, 'health');
      assert.ok(['firestore', 'postgres'].includes(body.database), 'database provider set');
    });

    it('rejects unauthenticated protected routes', async () => {
      expectFail(await api.get('/purchases'), 401, 'unauth purchases');
      expectFail(await api.get('/dashboard/summary'), 401, 'unauth dashboard');
    });

    it('rejects invalid login credentials', async () => {
      expectFail(await api.post('/auth/login', { email: 'bad@test.com', password: 'WrongPass1' }), 401, 'bad login');
    });

    it('rejects login with missing fields', async () => {
      const res = await api.post('/auth/login', { email: '' });
      assert.ok(res.status >= 400 && res.status < 500, 'validation error on empty login');
    });

    it('logs in as super admin', async () => {
      const res = await api.post('/auth/login', {
        email: 'superadmin@tradecrm.com',
        password: 'Demo@123',
      });
      const body = expectOk(res, 'login');
      assert.ok(body.data.accessToken, 'access token present');
      assert.ok(body.data.refreshToken, 'refresh token present');
      assert.equal(body.data.user.role, 'SUPER_ADMIN');
      token = body.data.accessToken;
      user = body.data.user;
      api.setToken(token);
    });

    it('GET /auth/profile returns current user', async () => {
      const body = expectOk(await api.get('/auth/profile'), 'profile');
      assert.equal(body.data.email, 'superadmin@tradecrm.com');
    });

    it('rejects garbage bearer token', async () => {
      const rogue = createApiClient(baseUrl, 'not.a.valid.jwt.token');
      expectFail(await rogue.get('/auth/profile'), 401, 'bad token');
    });
  });

  // ─── Settings ────────────────────────────────────────────────────────
  describe('2. Settings & setup', () => {
    it('GET /settings/branding (public)', async () => {
      const pub = createApiClient(baseUrl);
      expectOk(await pub.get('/settings/branding'), 'branding');
    });

    it('GET /settings/app', async () => {
      expectOk(await api.get('/settings/app'), 'app settings');
    });

    it('setup demo-seed endpoint requires auth', async () => {
      const pub = createApiClient(baseUrl);
      expectFail(await pub.post('/setup/demo-seed', { reset: false }), 401, 'demo-seed unauth');
    });
  });

  // ─── Masters ─────────────────────────────────────────────────────────
  describe('3. Master data CRUD', () => {
    it('creates location, quality, supplier, customer, batches', async () => {
      const loc = expectOk(await api.post('/masters/locations', {
        name: `QA Location ${STAMP}`,
        address: 'Test Yard',
        isActive: true,
      }), 'create location');
      qa.locationId = loc.data.id;
      cleanup.masters.push(loc.data.id);

      const quality = expectOk(await api.post('/masters/coal-qualities', {
        name: `QA Coal ${STAMP}`,
        gcv: 5500,
        ashPercent: 12,
        moisturePercent: 8,
        isActive: true,
      }), 'create quality');
      qa.qualityId = quality.data.id;
      cleanup.masters.push(quality.data.id);

      const supplier = expectOk(await api.post('/masters/suppliers', {
        name: `QA Supplier ${STAMP}`,
        phone: '9876500001',
        isActive: true,
      }), 'create supplier');
      qa.supplierId = supplier.data.id;
      cleanup.masters.push(supplier.data.id);

      const customer = expectOk(await api.post('/masters/customers', {
        name: `QA Customer ${STAMP}`,
        phone: '9876500002',
        isActive: true,
      }), 'create customer');
      qa.customerId = customer.data.id;
      cleanup.masters.push(customer.data.id);

      const pBatch = expectOk(await api.post('/masters/purchase-batches', {
        code: `PB-${STAMP}`,
        name: `QA Purchase Batch ${STAMP}`,
        startDate: isoDate(),
        endDate: isoDate(new Date(Date.now() + 86400000 * 30)),
        isActive: true,
      }), 'create purchase batch');
      qa.purchaseBatchId = pBatch.data.id;
      cleanup.masters.push(pBatch.data.id);

      const sBatch = expectOk(await api.post('/masters/sales-batches', {
        code: `SB-${STAMP}`,
        name: `QA Sales Batch ${STAMP}`,
        startDate: isoDate(),
        endDate: isoDate(new Date(Date.now() + 86400000 * 30)),
        isActive: true,
      }), 'create sales batch');
      qa.salesBatchId = sBatch.data.id;
      cleanup.masters.push(sBatch.data.id);
    });

    it('lists and retrieves each master', async () => {
      for (const path of ['locations', 'suppliers', 'customers', 'coal-qualities', 'purchase-batches', 'sales-batches']) {
        const list = expectOk(await api.get(`/masters/${path}?limit=5`), `list ${path}`);
        assert.ok(Array.isArray(list.data), `${path} list is array`);
      }
    });

    it('rejects duplicate batch code', async () => {
      const res = await api.post('/masters/purchase-batches', {
        code: `PB-${STAMP}`,
        name: 'Duplicate',
        startDate: isoDate(),
        isActive: true,
      });
      assert.ok(res.status === 409 || res.status === 400, 'duplicate batch code rejected');
    });

    it('rejects master create with missing required fields', async () => {
      const res = await api.post('/masters/suppliers', { phone: '123' });
      assert.ok(res.status >= 400 && res.status < 500, 'supplier without name rejected');
    });
  });

  // ─── Purchase flow ───────────────────────────────────────────────────
  describe('4. Purchase lifecycle', () => {
    it('rejects purchase without line items', async () => {
      const res = await api.post('/purchases', {
        purchaseDate: isoDate(),
        supplierId: qa.supplierId,
        lineItems: [],
      });
      assert.ok(res.status >= 400 && res.status < 500, 'empty line items rejected');
    });

    it('creates draft purchase', async () => {
      const body = expectOk(await api.post('/purchases', {
        purchaseDate: isoDate(),
        purchaseType: 'DIRECT',
        supplierId: qa.supplierId,
        locationId: qa.locationId,
        purchaseBatchId: qa.purchaseBatchId,
        lineItems: [{
          qualityId: qa.qualityId,
          weight: 5,
          rate: 100,
          freight: 0,
          additionalExpenses: 0,
          applyGst: false,
        }],
      }), 'create purchase');
      qa.purchaseId = body.data.id;
      qa.purchaseNumber = body.data.purchaseNumber;
      cleanup.purchases.push(body.data.id);
      assert.equal(body.data.status, 'DRAFT');
      assert.ok(body.data.purchaseNumber?.startsWith('PUR-'), 'purchase number generated');
    });

    it('GET purchase by id', async () => {
      const body = expectOk(await api.get(`/purchases/${qa.purchaseId}`), 'get purchase');
      assert.equal(body.data.id, qa.purchaseId);
      assert.ok(body.data.lineItems?.length >= 1, 'line items included');
    });

    it('lists purchases with pagination', async () => {
      const body = expectOk(await api.get('/purchases?page=1&limit=10'), 'list purchases');
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta?.total >= 1, 'at least one purchase');
    });

    it('confirms purchase and creates inventory', async () => {
      const body = expectOk(await api.post(`/purchases/${qa.purchaseId}/confirm`), 'confirm purchase');
      assert.equal(body.data.status, 'CONFIRMED');
      qa.confirmedPurchase = body.data;
    });

    it('rejects double confirm', async () => {
      const res = await api.post(`/purchases/${qa.purchaseId}/confirm`);
      assert.ok(res.status >= 400, 'double confirm rejected');
    });
  });

  // ─── Inventory ───────────────────────────────────────────────────────
  describe('5. Inventory & FIFO stock', () => {
    it('GET stock shows quality with weight', async () => {
      const body = expectOk(await api.get('/inventory/stock'), 'stock');
      assert.ok(Array.isArray(body.data));
    });

    it('GET overall stock', async () => {
      expectOk(await api.get('/inventory/stock/overall'), 'overall stock');
    });

    it('GET stock ledger', async () => {
      const body = expectOk(await api.get('/inventory/ledger?page=1&limit=10'), 'ledger');
      assert.ok(Array.isArray(body.data));
    });

    it('GET inventory value', async () => {
      expectOk(await api.get('/inventory/value'), 'inventory value');
    });

    it('GET movement log', async () => {
      expectOk(await api.get('/inventory/movements?page=1&limit=10'), 'movements');
    });
  });

  // ─── Sales & profit ──────────────────────────────────────────────────
  describe('6. Sales, FIFO allocation & profit', () => {
    it('POST fifo-preview before sale', async () => {
      const body = expectOk(await api.post('/sales/fifo-preview', {
        locationId: qa.locationId,
        lineItems: [{ qualityId: qa.qualityId, weight: 2, rate: 500 }],
      }), 'fifo preview');
      assert.ok(Array.isArray(body.data));
    });

    it('rejects sale exceeding available stock', async () => {
      const res = await api.post('/sales', {
        saleDate: isoDate(),
        customerId: qa.customerId,
        locationId: qa.locationId,
        lineItems: [{ qualityId: qa.qualityId, weight: 99999, rate: 500, applyGst: false }],
      });
      assert.ok(res.status >= 400, 'oversell rejected');
    });

    it('creates confirmed sale with gross profit', async () => {
      const body = expectOk(await api.post('/sales', {
        saleDate: isoDate(),
        saleType: 'DIRECT',
        customerId: qa.customerId,
        locationId: qa.locationId,
        salesBatchId: qa.salesBatchId,
        lineItems: [{
          qualityId: qa.qualityId,
          weight: 2,
          rate: 500,
          applyGst: true,
          gstRate: 18,
        }],
      }), 'create sale');
      qa.saleId = body.data.id;
      cleanup.sales.push(body.data.id);
      assert.equal(body.data.status, 'CONFIRMED');
      assert.ok(body.data.profit > 0, 'profit is positive');
      qa.saleGross = body.data.grossAmount;
      qa.saleCost = body.data.totalCost;
      qa.saleProfit = body.data.profit;
    });

    it('profit equals grossAmount minus totalCost (ex-GST)', () => {
      const expected = round2(Number(qa.saleGross) - Number(qa.saleCost));
      assert.equal(round2(qa.saleProfit), expected, 'sale profit math');
    });

    it('GET sale detail includes allocations', async () => {
      const body = expectOk(await api.get(`/sales/${qa.saleId}`), 'get sale');
      assert.ok(body.data.lineItems?.[0]?.allocations?.length >= 1, 'FIFO allocations present');
    });

    it('lists sales', async () => {
      expectOk(await api.get('/sales?page=1&limit=10'), 'list sales');
    });

    it('rejects sale edit after creation (no update route)', async () => {
      expectFail(await api.put(`/sales/${qa.saleId}`, { notes: 'nope' }), 404, 'sale edit blocked');
    });
  });

  // ─── Batches profit summaries ────────────────────────────────────────
  describe('7. Batch profit summaries', () => {
    it('GET purchase batch summaries', async () => {
      const body = expectOk(await api.get('/batches/purchase'), 'purchase batches');
      assert.ok(Array.isArray(body.data));
      if (body.data.length) {
        const row = body.data[0];
        assert.ok(row.batch?.code, 'batch code');
        assert.ok(typeof row.realizedProfit === 'number', 'realized profit');
      }
    });

    it('GET sales batch summaries with consistent profit math', async () => {
      const body = expectOk(await api.get('/batches/sales'), 'sales batches');
      assert.ok(Array.isArray(body.data));
      const qaBatch = body.data.find((r) => r.batch?.code === `SB-${STAMP}`);
      if (qaBatch) {
        assert.equal(
          round2(qaBatch.totalRevenue - qaBatch.totalCost),
          round2(qaBatch.totalProfit),
          'sales batch revenue - cost = profit',
        );
      }
    });
  });

  // ─── Payments & expenses ─────────────────────────────────────────────
  describe('8. Payments & expenses', () => {
    it('GET outstanding payments', async () => {
      expectOk(await api.get('/payments/outstanding'), 'outstanding');
    });

    it('creates payment against sale', async () => {
      const body = expectOk(await api.post('/payments', {
        paymentType: 'RECEIVED',
        paymentMode: 'BANK_TRANSFER',
        amount: 100,
        paymentDate: isoDate(),
        entityType: 'SALE',
        entityId: qa.saleId,
        referenceNo: `QA-PAY-${STAMP}`,
      }), 'create payment');
      cleanup.payments.push(body.data.id);
    });

    it('lists payments', async () => {
      expectOk(await api.get('/payments?page=1&limit=10'), 'list payments');
    });

    it('creates expense', async () => {
      const types = expectOk(await api.get('/masters/expense-types?limit=1'), 'expense types');
      let typeId = types.data[0]?.id;
      if (!typeId) {
        const created = expectOk(await api.post('/masters/expense-types', {
          name: `QA Expense Type ${STAMP}`,
          isActive: true,
        }), 'create expense type');
        typeId = created.data.id;
        cleanup.masters.push(typeId);
      }

      const body = expectOk(await api.post('/expenses', {
        expenseTypeId: typeId,
        category: 'INDIRECT',
        amount: 250,
        expenseDate: isoDate(),
        description: `QA expense ${STAMP}`,
      }), 'create expense');
      cleanup.expenses.push(body.data.id);
    });

    it('GET expense monthly report', async () => {
      expectOk(await api.get('/expenses/monthly-report'), 'expense monthly');
    });
  });

  // ─── Dashboard & reports ─────────────────────────────────────────────
  describe('9. Dashboard & reports', () => {
    it('GET dashboard summary, kpis, trends', async () => {
      expectOk(await api.get('/dashboard/summary'), 'dashboard summary');
      expectOk(await api.get('/dashboard/kpis'), 'dashboard kpis');
      expectOk(await api.get('/dashboard/trends'), 'dashboard trends');
      expectOk(await api.get('/dashboard/quality-stock'), 'quality stock');
      expectOk(await api.get('/dashboard/top-customers'), 'top customers');
      expectOk(await api.get('/dashboard/top-suppliers'), 'top suppliers');
    });

    it('GET report types and templates', async () => {
      expectOk(await api.get('/reports/types'), 'report types');
      expectOk(await api.get('/reports/templates'), 'report templates');
      expectOk(await api.get('/reports/templates/options'), 'template options');
    });
  });

  // ─── P&L & accounting ────────────────────────────────────────────────
  describe('10. Profit & loss / accounting', () => {
    it('GET P&L transactions with ex-GST revenue', async () => {
      const body = expectOk(await api.get('/profit-loss/transactions?limit=10'), 'pl transactions');
      assert.ok(Array.isArray(body.data));
      body.data.forEach((row) => {
        if (row.revenue != null && row.cost != null && row.profit != null) {
          assert.equal(round2(row.revenue - row.cost), round2(row.profit), `tx ${row.saleNumber} profit`);
        }
      });
    });

    it('GET P&L batches, monthly, partners, qualities', async () => {
      expectOk(await api.get('/profit-loss/batches?limit=20'), 'pl batches');
      expectOk(await api.get('/profit-loss/monthly'), 'pl monthly');
      expectOk(await api.get('/profit-loss/partners'), 'pl partners');
      expectOk(await api.get('/profit-loss/qualities'), 'pl qualities');
    });

    it('GET profitability endpoints', async () => {
      expectOk(await api.get('/profitability/transactions?limit=10'), 'profitability tx');
      expectOk(await api.get('/profitability/batches?limit=10'), 'profitability batches');
      expectOk(await api.get('/profitability/by-product'), 'by product');
      expectOk(await api.get('/profitability/by-customer'), 'by customer');
    });

    it('GET accounting reports', async () => {
      expectOk(await api.get('/accounting/pl-statement'), 'pl statement');
      expectOk(await api.get('/accounting/aging'), 'aging');
      expectOk(await api.get('/accounting/day-book'), 'day book');
      expectOk(await api.get('/accounting/gst-summary'), 'gst summary');
    });
  });

  // ─── CRM, search, users ──────────────────────────────────────────────
  describe('11. CRM, search & users', () => {
    it('creates and lists lead', async () => {
      const body = expectOk(await api.post('/leads', {
        name: `QA Lead ${STAMP}`,
        phone: '9876500099',
        stage: 'NEW',
        estimatedValue: 50000,
      }), 'create lead');
      cleanup.leads.push(body.data.id);
      expectOk(await api.get('/leads?page=1&limit=10'), 'list leads');
      expectOk(await api.get('/leads/pipeline'), 'pipeline');
    });

    it('GET activities list', async () => {
      expectOk(await api.get('/activities?page=1&limit=10'), 'activities');
    });

    it('GET global search', async () => {
      const body = expectOk(await api.get('/search?q=QA'), 'search');
      assert.ok(Array.isArray(body.data));
    });

    it('GET users list', async () => {
      expectOk(await api.get('/users?page=1&limit=10'), 'users');
    });

    it('GET notifications', async () => {
      expectOk(await api.get('/notifications?page=1&limit=10'), 'notifications');
      expectOk(await api.get('/notifications/unread-count'), 'unread count');
    });
  });

  // ─── Assets, investments, documents, audit, backup ──────────────────
  describe('12. Assets, investments, audit & backup', () => {
    it('GET assets and investments', async () => {
      expectOk(await api.get('/assets?page=1&limit=10'), 'assets');
      expectOk(await api.get('/investments?page=1&limit=10'), 'investments');
    });

    it('GET documents list', async () => {
      expectOk(await api.get('/documents?page=1&limit=10'), 'documents');
    });

    it('GET audit log', async () => {
      expectOk(await api.get('/audit?page=1&limit=10'), 'audit');
    });

    it('GET backup settings and history', async () => {
      expectOk(await api.get('/backup/settings'), 'backup settings');
      expectOk(await api.get('/backup/history'), 'backup history');
    });
  });

  // ─── Edge cases a critical tester would try ──────────────────────────
  describe('13. Critical edge cases', () => {
    it('returns 404 for non-existent purchase', async () => {
      expectFail(
        await api.get('/purchases/00000000-0000-0000-0000-000000000099'),
        404,
        'missing purchase',
      );
    });

    it('returns 404 for non-existent sale', async () => {
      expectFail(
        await api.get('/sales/00000000-0000-0000-0000-000000000099'),
        404,
        'missing sale',
      );
    });

    it('rejects invalid UUID in path', async () => {
      const res = await api.get('/purchases/not-a-uuid');
      assert.ok(res.status >= 400, 'invalid uuid rejected');
    });

    it('rejects purchase with invalid supplier id', async () => {
      const res = await api.post('/purchases', {
        purchaseDate: isoDate(),
        purchaseType: 'DIRECT',
        supplierId: '00000000-0000-0000-0000-000000000099',
        lineItems: [{
          qualityId: qa.qualityId,
          weight: 1,
          rate: 100,
          freight: 0,
          additionalExpenses: 0,
          applyGst: false,
        }],
      });
      assert.ok(res.status >= 400, 'invalid supplier rejected');
    });

    it('search with empty query returns results or empty array', async () => {
      const body = expectOk(await api.get('/search?q='), 'empty search');
      assert.ok(Array.isArray(body.data));
    });
  });
});
