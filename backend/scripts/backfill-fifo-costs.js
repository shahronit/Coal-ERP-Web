/**
 * Recalculates purchase line and inventory batch landed costs from full purchase documents
 * (includes line freight, line expenses, and document expense/income heads).
 *
 * Usage: DATABASE_URL=file:./prisma/dev.db node scripts/backfill-fifo-costs.js
 */
const prisma = require('../src/config/database');
const { calculatePurchaseDocument, toNumber } = require('../src/utils/calculations');

const mapAdjustments = (purchase) => ({
  expenseAdjustments: (purchase.expenseAdjustments || []).map((a) => ({
    expenseTypeId: a.expenseTypeId,
    basisType: a.basisType,
    value: a.value,
    description: a.description,
  })),
  incomeAdjustments: (purchase.incomeAdjustments || []).map((a) => ({
    incomeTypeId: a.incomeTypeId,
    basisType: a.basisType,
    value: a.value,
    description: a.description,
  })),
});

const backfill = async () => {
  const purchases = await prisma.purchase.findMany({
    where: { deletedAt: null, status: 'CONFIRMED' },
    include: {
      lineItems: { include: { inventoryBatch: true } },
      expenseAdjustments: true,
      incomeAdjustments: true,
    },
  });

  let updatedLines = 0;
  let updatedBatches = 0;

  for (const purchase of purchases) {
    const { expenseAdjustments, incomeAdjustments } = mapAdjustments(purchase);
    const lineInputs = purchase.lineItems.map((l) => ({
      qualityId: l.qualityId,
      truckNumber: l.truckNumber,
      weight: l.weight,
      rate: l.rate,
      freight: l.freight,
      additionalExpenses: l.additionalExpenses,
      gstRate: l.gstRate,
    }));

    const calc = calculatePurchaseDocument({
      lineItems: lineInputs,
      billStockPercent: purchase.billStockPercent,
      expenseAdjustments,
      incomeAdjustments,
    });

    for (let i = 0; i < calc.lineItems.length; i += 1) {
      const line = calc.lineItems[i];
      const existing = purchase.lineItems[i];
      if (!existing) continue;

      const soldWeight = toNumber(existing.inventoryBatch?.soldWeight);
      const canUpdateBatch = existing.inventoryBatch && soldWeight <= 0.001;

      await prisma.purchaseLineItem.update({
        where: { id: existing.id },
        data: {
          totalCost: line.totalCost,
          costPerMT: line.costPerMT,
          costPerMTIncGst: line.costPerMTIncGst,
          gstAmount: line.gstAmount,
          netAmount: line.netAmount,
        },
      });
      updatedLines += 1;

      if (canUpdateBatch) {
        await prisma.inventoryBatch.update({
          where: { id: existing.inventoryBatch.id },
          data: {
            costPerMT: line.costPerMT,
            costPerMTIncGst: line.costPerMTIncGst,
          },
        });
        updatedBatches += 1;
      }
    }
  }

  console.log(`Backfill complete: ${updatedLines} line items, ${updatedBatches} unsold inventory batches updated`);
};

backfill()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
