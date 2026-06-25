const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { generateNumber } = require('../../utils/sequence');
const { calculatePurchaseDocument, calculateSaleTotals, round, toNumber } = require('../../utils/calculations');
const { createBatchesFromPurchase, allocateStock } = require('../inventory/fifoEngine');

const DEMO_PASSWORD = 'Demo@123';

const DEMO_USERS = [
  { email: 'superadmin@tradecrm.com', name: 'Super Admin', role: 'SUPER_ADMIN' },
  { email: 'admin@tradecrm.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'finance@tradecrm.com', name: 'Finance User', role: 'FINANCE' },
  { email: 'ops@tradecrm.com', name: 'Operations User', role: 'OPERATIONS' },
  { email: 'readonly@tradecrm.com', name: 'Read Only User', role: 'READ_ONLY' },
];

const COAL_QUALITIES = [
  { name: 'GCV 5500', gcv: 5500, ashPercent: 12, moisturePercent: 8 },
  { name: 'GCV 6000', gcv: 6000, ashPercent: 10, moisturePercent: 7 },
  { name: 'GCV 4800', gcv: 4800, ashPercent: 15, moisturePercent: 10 },
  { name: 'Industrial Grade', gcv: 4200, ashPercent: 18, moisturePercent: 12 },
];

const SUPPLIER_NAMES = [
  'Eastern Coal Suppliers', 'Maharashtra Mining Co', 'Odisha Traders', 'Jharkhand Exports', 'Gujarat Fuel Ltd',
];

const CUSTOMER_NAMES = [
  'Steel Works Mumbai', 'Power Plant Delhi', 'Cement Corp Chennai', 'Textile Mills Pune', 'Foundry Hub Kolkata',
];

const ensureDemoUsers = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = [];

  for (const spec of DEMO_USERS) {
    const existing = await prisma.user.findFirst({
      where: { email: spec.email, deletedAt: null },
    });
    if (existing) {
      users.push(existing);
      continue;
    }
    users.push(await prisma.user.create({
      data: { ...spec, passwordHash, isActive: true },
    }));
  }

  return users;
};

const seedMasters = async (userId) => {
  const qualities = [];
  for (const q of COAL_QUALITIES) {
    qualities.push(await prisma.coalQuality.upsert({
      where: { name: q.name },
      create: { ...q, createdById: userId },
      update: { gcv: q.gcv, ashPercent: q.ashPercent, moisturePercent: q.moisturePercent, updatedById: userId },
    }));
  }

  const locations = [];
  for (const loc of [
    { name: 'Mumbai Yard', address: 'Mumbai, MH' },
    { name: 'Delhi Depot', address: 'Delhi, DL' },
  ]) {
    locations.push(await prisma.location.upsert({
      where: { name: loc.name },
      create: { ...loc, createdById: userId },
      update: { address: loc.address, updatedById: userId },
    }));
  }

  const suppliers = [];
  for (const name of SUPPLIER_NAMES) {
    const existing = await prisma.supplier.findFirst({ where: { name, deletedAt: null } });
    suppliers.push(existing || await prisma.supplier.create({
      data: {
        name,
        email: `${name.replace(/\s+/g, '').toLowerCase().slice(0, 20)}@example.com`,
        phone: '+919876543210',
        createdById: userId,
      },
    }));
  }

  const customers = [];
  for (const name of CUSTOMER_NAMES) {
    const existing = await prisma.customer.findFirst({ where: { name, deletedAt: null } });
    customers.push(existing || await prisma.customer.create({
      data: {
        name,
        email: `${name.replace(/\s+/g, '').toLowerCase().slice(0, 20)}@example.com`,
        phone: '+919123456789',
        createdById: userId,
      },
    }));
  }

  const defaultGstRates = [
    { name: 'GST 5%', gstRate: 5 },
    { name: 'GST 12%', gstRate: 12 },
    { name: 'GST 18%', gstRate: 18 },
    { name: 'GST 28%', gstRate: 28 },
  ];
  for (const tax of defaultGstRates) {
    const existingTax = await prisma.taxConfiguration.findFirst({
      where: { name: tax.name, deletedAt: null },
    });
    if (!existingTax) {
      await prisma.taxConfiguration.create({
        data: {
          name: tax.name,
          gstRate: tax.gstRate,
          effectiveFrom: new Date('2024-01-01'),
          createdById: userId,
        },
      });
    }
  }

  return { qualities, locations, suppliers, customers };
};

const buildPurchasePayload = (lineInput, billStockPercent = 100, expenseAdjustments = [], incomeAdjustments = []) => {
  const calc = calculatePurchaseDocument({
    lineItems: [lineInput],
    billStockPercent,
    expenseAdjustments,
    incomeAdjustments,
  }).lineItems[0];
  return { lineInput, calc };
};

const createPurchaseRecord = async ({
  userId,
  supplierId,
  locationId,
  qualityId,
  weight,
  rate,
  status,
  daysAgo = 0,
  draft = false,
}) => {
  const purchaseDate = new Date();
  purchaseDate.setDate(purchaseDate.getDate() - daysAgo);

  const lineInput = {
    qualityId,
    weight,
    rate,
    freight: round(weight * 0.05),
    additionalExpenses: round(weight * 0.02),
    gstRate: 18,
  };
  const { calc } = buildPurchasePayload(lineInput);

  const purchaseNumber = await generateNumber('PUR');
  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber,
      purchaseDate,
      supplierId,
      locationId,
      status: draft ? 'DRAFT' : status,
      subtotal: calc.totalCost,
      freightTotal: toNumber(lineInput.freight),
      expenseTotal: toNumber(lineInput.additionalExpenses),
      gstTotal: calc.gstAmount,
      netAmount: calc.netAmount,
      outstanding: calc.netAmount,
      paidAmount: 0,
      createdById: userId,
      updatedById: userId,
      lineItems: {
        create: [{
          qualityId,
          weight,
          rate,
          freight: lineInput.freight,
          additionalExpenses: lineInput.additionalExpenses,
          gstRate: lineInput.gstRate,
          gstAmount: calc.gstAmount,
          totalCost: calc.totalCost,
          costPerMT: calc.costPerMT,
          costPerMTIncGst: calc.costPerMTIncGst,
          netAmount: calc.netAmount,
        }],
      },
    },
    include: { lineItems: true },
  });

  if (!draft && status === 'CONFIRMED') {
    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'CONFIRMED' },
      });
      await createBatchesFromPurchase(tx, { ...purchase, status: 'CONFIRMED' });
    });
  }

  return purchase;
};

const createSaleRecord = async ({
  userId,
  customerId,
  locationId,
  qualityId,
  weight,
  rate,
  daysAgo = 0,
}) => {
  const saleDate = new Date();
  saleDate.setDate(saleDate.getDate() - daysAgo);

  const lineItems = [{ qualityId, weight, rate, gstRate: 18 }];
  const { lineItems: calculatedLines, ...totals } = calculateSaleTotals(lineItems, []);

  const saleNumber = await generateNumber('SAL');

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        saleDate,
        customerId,
        status: 'CONFIRMED',
        ...totals,
        totalCost: 0,
        profit: 0,
        paidAmount: 0,
        outstanding: totals.netAmount,
        createdById: userId,
        updatedById: userId,
      },
    });

    let totalCost = 0;

    for (const line of calculatedLines) {
      const saleLine = await tx.saleLineItem.create({
        data: {
          saleId: sale.id,
          qualityId: line.qualityId,
          weight: line.weight,
          rate: line.rate,
          gstRate: line.gstRate,
          gstAmount: line.gstAmount,
          grossAmount: line.grossAmount,
          netAmount: line.netAmount,
          totalCost: 0,
          profit: 0,
        },
      });

      const allocations = await allocateStock(tx, {
        qualityId: line.qualityId,
        locationId,
        weight: line.weight,
        grossAmount: line.grossAmount,
        netAmount: line.netAmount,
        referenceId: sale.id,
      });

      const lineCost = allocations.reduce((s, a) => s + toNumber(a.allocatedCost), 0);
      const profit = round(line.grossAmount - lineCost);
      totalCost += lineCost;

      await tx.saleLineItem.update({
        where: { id: saleLine.id },
        data: { totalCost: round(lineCost), profit },
      });

      for (const alloc of allocations) {
        await tx.inventoryAllocation.create({
          data: { ...alloc, saleLineItemId: saleLine.id },
        });
      }
    }

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        totalCost: round(totalCost),
        profit: round(totals.grossAmount - totalCost),
      },
    });

    return sale;
  });
};

const clearTransactionData = async () => {
  await prisma.inventoryAllocation.deleteMany();
  await prisma.saleLineItem.deleteMany();
  await prisma.saleFreightEntry.deleteMany();
  await prisma.saleExpenseAdjustment.deleteMany();
  await prisma.saleIncomeAdjustment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockLedger.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.purchaseLineItem.deleteMany();
  await prisma.purchaseIncomeAdjustment.deleteMany();
  await prisma.purchaseExpenseAdjustment.deleteMany();
  await prisma.purchase.deleteMany();
};

const seedDemoTransactions = async (userId, masters) => {
  const { qualities, locations, suppliers, customers } = masters;
  const location = locations[0];
  const purchases = [];

  const purchaseSpecs = [
    { quality: 0, weight: 500, rate: 4200, daysAgo: 45, draft: false },
    { quality: 1, weight: 750, rate: 4800, daysAgo: 40, draft: false },
    { quality: 2, weight: 600, rate: 3900, daysAgo: 35, draft: false },
    { quality: 0, weight: 400, rate: 4300, daysAgo: 30, draft: false },
    { quality: 1, weight: 550, rate: 4700, daysAgo: 25, draft: false },
    { quality: 3, weight: 800, rate: 3600, daysAgo: 20, draft: false },
    { quality: 2, weight: 300, rate: 4000, daysAgo: 10, draft: true },
    { quality: 0, weight: 450, rate: 4250, daysAgo: 5, draft: true },
  ];

  for (let i = 0; i < purchaseSpecs.length; i += 1) {
    const spec = purchaseSpecs[i];
    purchases.push(await createPurchaseRecord({
      userId,
      supplierId: suppliers[i % suppliers.length].id,
      locationId: location.id,
      qualityId: qualities[spec.quality].id,
      weight: spec.weight,
      rate: spec.rate,
      status: 'CONFIRMED',
      daysAgo: spec.daysAgo,
      draft: spec.draft,
    }));
  }

  const sales = [];
  const saleSpecs = [
    { quality: 0, weight: 120, rate: 5200, daysAgo: 15 },
    { quality: 1, weight: 200, rate: 5800, daysAgo: 12 },
    { quality: 2, weight: 150, rate: 4800, daysAgo: 8 },
    { quality: 0, weight: 100, rate: 5300, daysAgo: 4 },
    { quality: 1, weight: 180, rate: 5900, daysAgo: 2 },
  ];

  for (let i = 0; i < saleSpecs.length; i += 1) {
    const spec = saleSpecs[i];
    sales.push(await createSaleRecord({
      userId,
      customerId: customers[i % customers.length].id,
      locationId: location.id,
      qualityId: qualities[spec.quality].id,
      weight: spec.weight,
      rate: spec.rate,
      daysAgo: spec.daysAgo,
    }));
  }

  return { purchases: purchases.length, sales: sales.length, drafts: purchases.filter((p) => p.status === 'DRAFT').length };
};

const loadDemoData = async ({ reset = false } = {}) => {
  await ensureDemoUsers();
  const existingPurchases = await prisma.purchase.count({ where: { deletedAt: null } });
  if (existingPurchases > 0 && !reset) {
    return {
      status: 'already_loaded',
      message: 'Sample data already exists. Use reset to replace transaction data.',
      users: DEMO_USERS.map((u) => ({ email: u.email, password: DEMO_PASSWORD, role: u.role })),
    };
  }

  if (reset && existingPurchases > 0) {
    await clearTransactionData();
  }

  const users = await ensureDemoUsers();
  const admin = users.find((u) => u.role === 'SUPER_ADMIN') || users[0];
  const masters = await seedMasters(admin.id);
  const transactions = await seedDemoTransactions(admin.id, masters);

  return {
    status: 'loaded',
    message: 'Sample data loaded successfully',
    users: DEMO_USERS.map((u) => ({ email: u.email, password: DEMO_PASSWORD, role: u.role })),
    ...transactions,
  };
};

const loadFullDevData = async () => {
  const existing = await prisma.user.count();
  if (existing > 0) {
    throw new AppError('Database already has users. Use demo seed with reset or start from empty DB.', 400);
  }

  return loadDemoData({ reset: false });
};

module.exports = {
  DEMO_USERS,
  DEMO_PASSWORD,
  ensureDemoUsers,
  loadDemoData,
  loadFullDevData,
  clearTransactionData,
};
