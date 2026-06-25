const prisma = require('../config/database');
const BaseRepository = require('./BaseRepository');

class PurchaseRepository extends BaseRepository {
  constructor() {
    super('purchase');
  }

  findWithDetails(id) {
    return prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: true,
        location: true,
        purchaseBatch: true,
        incomeAdjustments: { include: { incomeType: true } },
        expenseAdjustments: { include: { expenseType: true } },
        lineItems: { include: { quality: true, inventoryBatch: true } },
      },
    });
  }
}

class SaleRepository extends BaseRepository {
  constructor() {
    super('sale');
  }

  findWithDetails(id) {
    return prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        salesBatch: true,
        freightEntries: true,
        lineItems: { include: { quality: true, allocations: { include: { inventoryBatch: true } } } },
      },
    });
  }
}

module.exports = { PurchaseRepository, SaleRepository };
