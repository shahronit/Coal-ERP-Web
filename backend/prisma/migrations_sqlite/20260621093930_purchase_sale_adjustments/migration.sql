/*
  Warnings:

  - You are about to drop the column `amount` on the `PurchaseIncomeAdjustment` table. All the data in the column will be lost.
  - Added the required column `value` to the `PurchaseIncomeAdjustment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PurchaseExpenseAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "expenseTypeId" TEXT NOT NULL,
    "basisType" TEXT NOT NULL DEFAULT 'FLAT',
    "value" DECIMAL NOT NULL,
    "resolvedAmount" DECIMAL NOT NULL DEFAULT 0,
    "description" TEXT,
    CONSTRAINT "PurchaseExpenseAdjustment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseExpenseAdjustment_expenseTypeId_fkey" FOREIGN KEY ("expenseTypeId") REFERENCES "ExpenseType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleExpenseAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "expenseTypeId" TEXT NOT NULL,
    "basisType" TEXT NOT NULL DEFAULT 'FLAT',
    "value" DECIMAL NOT NULL,
    "resolvedAmount" DECIMAL NOT NULL DEFAULT 0,
    "description" TEXT,
    CONSTRAINT "SaleExpenseAdjustment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleExpenseAdjustment_expenseTypeId_fkey" FOREIGN KEY ("expenseTypeId") REFERENCES "ExpenseType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleIncomeAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "incomeTypeId" TEXT NOT NULL,
    "basisType" TEXT NOT NULL DEFAULT 'FLAT',
    "value" DECIMAL NOT NULL,
    "resolvedAmount" DECIMAL NOT NULL DEFAULT 0,
    "description" TEXT,
    CONSTRAINT "SaleIncomeAdjustment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleIncomeAdjustment_incomeTypeId_fkey" FOREIGN KEY ("incomeTypeId") REFERENCES "IncomeType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseNumber" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "purchaseType" TEXT NOT NULL DEFAULT 'DIRECT',
    "purchaseBatchId" TEXT,
    "supplierId" TEXT NOT NULL,
    "locationId" TEXT,
    "truckNumber" TEXT,
    "billStockPercent" DECIMAL NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "freightTotal" DECIMAL NOT NULL DEFAULT 0,
    "expenseTotal" DECIMAL NOT NULL DEFAULT 0,
    "expenseAdjustmentTotal" DECIMAL NOT NULL DEFAULT 0,
    "incomeAdjustmentTotal" DECIMAL NOT NULL DEFAULT 0,
    "gstTotal" DECIMAL NOT NULL DEFAULT 0,
    "netAmount" DECIMAL NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "outstanding" DECIMAL NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Purchase_purchaseBatchId_fkey" FOREIGN KEY ("purchaseBatchId") REFERENCES "PurchaseBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Purchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Purchase_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("billStockPercent", "createdAt", "createdById", "deletedAt", "dueDate", "expenseTotal", "freightTotal", "gstTotal", "id", "incomeAdjustmentTotal", "locationId", "netAmount", "notes", "outstanding", "paidAmount", "purchaseBatchId", "purchaseDate", "purchaseNumber", "purchaseType", "status", "subtotal", "supplierId", "truckNumber", "updatedAt", "updatedById") SELECT "billStockPercent", "createdAt", "createdById", "deletedAt", "dueDate", "expenseTotal", "freightTotal", "gstTotal", "id", "incomeAdjustmentTotal", "locationId", "netAmount", "notes", "outstanding", "paidAmount", "purchaseBatchId", "purchaseDate", "purchaseNumber", "purchaseType", "status", "subtotal", "supplierId", "truckNumber", "updatedAt", "updatedById" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_purchaseNumber_key" ON "Purchase"("purchaseNumber");
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");
CREATE INDEX "Purchase_purchaseDate_status_deletedAt_idx" ON "Purchase"("purchaseDate", "status", "deletedAt");
CREATE INDEX "Purchase_purchaseBatchId_idx" ON "Purchase"("purchaseBatchId");
CREATE TABLE "new_PurchaseIncomeAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "incomeTypeId" TEXT NOT NULL,
    "basisType" TEXT NOT NULL DEFAULT 'FLAT',
    "value" DECIMAL NOT NULL,
    "resolvedAmount" DECIMAL NOT NULL DEFAULT 0,
    "description" TEXT,
    CONSTRAINT "PurchaseIncomeAdjustment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseIncomeAdjustment_incomeTypeId_fkey" FOREIGN KEY ("incomeTypeId") REFERENCES "IncomeType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseIncomeAdjustment" ("id", "purchaseId", "incomeTypeId", "basisType", "value", "resolvedAmount", "description")
SELECT "id", "purchaseId", "incomeTypeId", 'FLAT', "amount", "amount", "description" FROM "PurchaseIncomeAdjustment";
DROP TABLE "PurchaseIncomeAdjustment";
ALTER TABLE "new_PurchaseIncomeAdjustment" RENAME TO "PurchaseIncomeAdjustment";
CREATE INDEX "PurchaseIncomeAdjustment_purchaseId_idx" ON "PurchaseIncomeAdjustment"("purchaseId");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNumber" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "saleType" TEXT NOT NULL DEFAULT 'DOMESTIC',
    "salesBatchId" TEXT,
    "customerId" TEXT NOT NULL,
    "truckNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "freightTotal" DECIMAL NOT NULL DEFAULT 0,
    "expenseAdjustmentTotal" DECIMAL NOT NULL DEFAULT 0,
    "incomeAdjustmentTotal" DECIMAL NOT NULL DEFAULT 0,
    "gstTotal" DECIMAL NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL NOT NULL DEFAULT 0,
    "netAmount" DECIMAL NOT NULL DEFAULT 0,
    "totalCost" DECIMAL NOT NULL DEFAULT 0,
    "profit" DECIMAL NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "outstanding" DECIMAL NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_salesBatchId_fkey" FOREIGN KEY ("salesBatchId") REFERENCES "SalesBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "createdById", "customerId", "deletedAt", "dueDate", "freightTotal", "grossAmount", "gstTotal", "id", "netAmount", "notes", "outstanding", "paidAmount", "profit", "saleDate", "saleNumber", "saleType", "salesBatchId", "status", "subtotal", "totalCost", "truckNumber", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "customerId", "deletedAt", "dueDate", "freightTotal", "grossAmount", "gstTotal", "id", "netAmount", "notes", "outstanding", "paidAmount", "profit", "saleDate", "saleNumber", "saleType", "salesBatchId", "status", "subtotal", "totalCost", "truckNumber", "updatedAt", "updatedById" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_saleDate_status_deletedAt_idx" ON "Sale"("saleDate", "status", "deletedAt");
CREATE INDEX "Sale_salesBatchId_idx" ON "Sale"("salesBatchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PurchaseExpenseAdjustment_purchaseId_idx" ON "PurchaseExpenseAdjustment"("purchaseId");

-- CreateIndex
CREATE INDEX "SaleExpenseAdjustment_saleId_idx" ON "SaleExpenseAdjustment"("saleId");

-- CreateIndex
CREATE INDEX "SaleIncomeAdjustment_saleId_idx" ON "SaleIncomeAdjustment"("saleId");
