const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { calculateSaleDocument, toNumber, round, calculateGrossProfit } = require('../../utils/calculations');
const { generateNumber } = require('../../utils/sequence');
const { allocateStock, previewAllocation } = require('../../services/inventory/fifoEngine');
const { paginate, findById } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { hasPermission, PERMISSIONS } = require('../../config/permissions');
const { stringifyJson } = require('../../utils/jsonFields');
const config = require('../../config');
const { createSaleAdjustments } = require('../../utils/adjustmentPersist');

const SALE_INCLUDE = {
  customer: true,
  salesBatch: true,
  freightEntries: true,
  expenseAdjustments: { include: { expenseType: true, saleLineItem: { include: { quality: true } } } },
  incomeAdjustments: { include: { incomeType: true, saleLineItem: { include: { quality: true } } } },
  lineItems: {
    include: {
      quality: true,
      allocations: { include: { inventoryBatch: true } },
    },
  },
};

const buildSale = async (data) => {
  const freightEntries = data.freightEntries || [];
  const expenseAdjustments = data.expenseAdjustments || [];
  const incomeAdjustments = data.incomeAdjustments || [];

  for (const line of data.lineItems) {
    const quality = await prisma.coalQuality.findFirst({
      where: { id: line.qualityId, deletedAt: null },
    });
    if (!quality) throw new AppError(`Coal quality ${line.qualityId} not found`, 404);
  }

  const isIndirect = (data.saleType || 'DIRECT') === 'INDIRECT';
  const calc = calculateSaleDocument({
    lineItems: data.lineItems,
    freightEntries,
    expenseAdjustments,
    incomeAdjustments,
    isIndirect,
  });

  return {
    lineItems: calc.lineItems,
    freightEntries: isIndirect ? [] : freightEntries,
    subtotal: calc.subtotal,
    freightTotal: calc.freightTotal,
    expenseAdjustmentTotal: calc.expenseAdjustmentTotal,
    incomeAdjustmentTotal: calc.incomeAdjustmentTotal,
    grossAmount: calc.grossAmount,
    gstTotal: calc.gstTotal,
    netAmount: calc.netAmount,
    averageRatePerMT: calc.averageRatePerMT,
    resolvedExpenseAdjustments: calc.expenseAdjustments,
    resolvedIncomeAdjustments: calc.incomeAdjustments,
  };
};

const list = (query) =>
  paginate('sale', {
    ...mergeListQuery(query, { dateField: 'saleDate', filterKeys: ['customerId', 'status'] }),
    searchFields: ['saleNumber', 'notes', 'truckNumber'],
    include: {
      customer: true,
      salesBatch: true,
      lineItems: { include: { quality: true } },
      freightEntries: true,
    },
  });

const get = async (id, tx = prisma) => {
  const sale = await tx.sale.findFirst({
    where: { id, deletedAt: null },
    include: SALE_INCLUDE,
  });
  if (!sale) throw new AppError('Sale not found', 404);
  return sale;
};

const create = async (data, userId) => {
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, deletedAt: null },
  });
  if (!customer) throw new AppError('Customer not found', 404);

  if (data.locationId) {
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, deletedAt: null },
    });
    if (!location) throw new AppError('Location not found', 404);
  }

  const saleNumber = await generateNumber('SAL');
  const {
    lineItems,
    freightEntries,
    resolvedExpenseAdjustments,
    resolvedIncomeAdjustments,
    ...totals
  } = await buildSale(data);

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        saleDate: new Date(data.saleDate),
        saleType: data.saleType || 'DIRECT',
        salesBatchId: data.salesBatchId || null,
        customerId: data.customerId,
        truckNumber: data.truckNumber || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        status: 'CONFIRMED',
        ...totals,
        totalCost: 0,
        profit: 0,
        paidAmount: 0,
        outstanding: totals.netAmount,
        createdById: userId,
        updatedById: userId,
        freightEntries: {
          create: freightEntries.map((f) => ({
            description: f.description || null,
            amount: f.amount,
            truckNumber: f.truckNumber || null,
          })),
        },
      },
    });

    let totalCost = 0;
    const createdLineIds = [];

    for (const line of lineItems) {
      const saleLine = await tx.saleLineItem.create({
        data: {
          qualityId: line.qualityId,
          truckNumber: line.truckNumber || data.truckNumber || null,
          weight: line.weight,
          rate: line.rate,
          applyGst: line.applyGst === true,
          taxConfigurationId: line.taxConfigurationId || null,
          gstRate: line.gstRate,
          gstAmount: line.gstAmount,
          grossAmount: line.grossAmount,
          netAmount: line.netAmount,
          totalCost: 0,
          profit: 0,
          saleId: sale.id,
        },
      });
      createdLineIds.push(saleLine.id);

      const allocations = await allocateStock(tx, {
        qualityId: line.qualityId,
        locationId: data.locationId,
        weight: line.weight,
        grossAmount: line.grossAmount,
        netAmount: line.netAmount,
        referenceId: sale.id,
      });

      const lineCost = allocations.reduce((s, a) => s + toNumber(a.allocatedCost), 0);
      const profit = calculateGrossProfit(line.grossAmount, lineCost);
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

    await createSaleAdjustments(
      tx,
      sale.id,
      createdLineIds,
      resolvedExpenseAdjustments,
      resolvedIncomeAdjustments,
    );

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        totalCost: round(totalCost),
        profit: calculateGrossProfit(totals.grossAmount, totalCost),
      },
    });

    if (totals.netAmount >= config.largeTransactionThreshold) {
      const admins = await tx.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] }, deletedAt: null },
      });
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            type: 'LARGE_TRANSACTION',
            title: 'Large Sale Recorded',
            body: `Sale ${saleNumber} for ₹${totals.netAmount} was recorded.`,
            metadata: stringifyJson({ saleId: sale.id, amount: totals.netAmount }),
          },
        });
      }
    }

    return get(sale.id, tx);
  });
};

const getFifoPreview = async (data) => {
  const previews = [];
  for (const line of data.lineItems || []) {
    const result = await previewAllocation({
      qualityId: line.qualityId,
      locationId: data.locationId,
      weight: line.weight,
    });
    previews.push({ qualityId: line.qualityId, ...result });
  }
  return previews;
};

const update = async () => {
  throw new AppError('Sales cannot be edited after creation. Create adjustment instead.', 400);
};

const remove = async (id, role) => {
  if (!hasPermission(role, PERMISSIONS.SALES_DELETE)) throw new AppError('Not authorized', 403);
  const sale = await findById('sale', id);
  if (!sale) throw new AppError('Sale not found', 404);
  return prisma.sale.update({ where: { id }, data: { deletedAt: new Date(), status: 'CANCELLED' } });
};

module.exports = { list, get, create, update, remove, getFifoPreview };
