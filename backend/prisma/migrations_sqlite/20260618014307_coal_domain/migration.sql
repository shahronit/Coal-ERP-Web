/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductQuality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `quantity` on the `InventoryAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `costPerUnit` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `originalQuantity` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `pricingType` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `remainingQuantity` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `soldQuantity` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `costPerUnit` on the `PurchaseLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PurchaseLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `PurchaseLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `freight` on the `SaleLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `SaleLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `SaleLineItem` table. All the data in the column will be lost.
  - Made the column `weight` on table `InventoryAllocation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `costPerMT` to the `InventoryBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualityId` to the `InventoryBatch` table without a default value. This is not possible if the table is not empty.
  - Made the column `originalWeight` on table `InventoryBatch` required. This step will fail if there are existing NULL values in that column.
  - Made the column `remainingWeight` on table `InventoryBatch` required. This step will fail if there are existing NULL values in that column.
  - Made the column `qualityId` on table `PurchaseLineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weight` on table `PurchaseLineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `qualityId` on table `SaleLineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weight` on table `SaleLineItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Product_name_idx";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "ProductCategory_name_key";

-- DropIndex
DROP INDEX "ProductQuality_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductCategory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductQuality";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CoalQuality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gcv" DECIMAL,
    "ashPercent" DECIMAL,
    "moisturePercent" DECIMAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PurchaseBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SalesBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PurchaseIncomeAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "incomeTypeId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT,
    CONSTRAINT "PurchaseIncomeAdjustment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseIncomeAdjustment_incomeTypeId_fkey" FOREIGN KEY ("incomeTypeId") REFERENCES "IncomeType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleFreightEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL NOT NULL,
    "truckNumber" TEXT,
    CONSTRAINT "SaleFreightEntry_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qualityId" TEXT NOT NULL,
    "locationId" TEXT,
    "batchId" TEXT,
    "entryType" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "weightMT" DECIMAL NOT NULL,
    "balanceMT" DECIMAL NOT NULL,
    "costPerMT" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockLedger_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "CoalQuality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockLedger_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockLedger_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleLineItemId" TEXT NOT NULL,
    "inventoryBatchId" TEXT NOT NULL,
    "weight" DECIMAL NOT NULL,
    "allocatedCost" DECIMAL NOT NULL,
    "allocatedRevenue" DECIMAL NOT NULL DEFAULT 0,
    "taxableRevenue" DECIMAL NOT NULL DEFAULT 0,
    "profit" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryAllocation_saleLineItemId_fkey" FOREIGN KEY ("saleLineItemId") REFERENCES "SaleLineItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryAllocation_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "InventoryBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryAllocation" ("allocatedCost", "allocatedRevenue", "createdAt", "id", "inventoryBatchId", "profit", "saleLineItemId", "taxableRevenue", "weight") SELECT "allocatedCost", "allocatedRevenue", "createdAt", "id", "inventoryBatchId", "profit", "saleLineItemId", "taxableRevenue", "weight" FROM "InventoryAllocation";
DROP TABLE "InventoryAllocation";
ALTER TABLE "new_InventoryAllocation" RENAME TO "InventoryAllocation";
CREATE INDEX "InventoryAllocation_saleLineItemId_idx" ON "InventoryAllocation"("saleLineItemId");
CREATE INDEX "InventoryAllocation_inventoryBatchId_idx" ON "InventoryAllocation"("inventoryBatchId");
CREATE TABLE "new_InventoryBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseLineItemId" TEXT NOT NULL,
    "qualityId" TEXT NOT NULL,
    "purchaseBatchId" TEXT,
    "locationId" TEXT,
    "purchaseDate" DATETIME NOT NULL,
    "originalWeight" DECIMAL NOT NULL,
    "remainingWeight" DECIMAL NOT NULL,
    "costPerMT" DECIMAL NOT NULL,
    "soldWeight" DECIMAL NOT NULL DEFAULT 0,
    "realizedRevenue" DECIMAL NOT NULL DEFAULT 0,
    "taxableRevenue" DECIMAL NOT NULL DEFAULT 0,
    "realizedProfit" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "InventoryBatch_purchaseLineItemId_fkey" FOREIGN KEY ("purchaseLineItemId") REFERENCES "PurchaseLineItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryBatch_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "CoalQuality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryBatch_purchaseBatchId_fkey" FOREIGN KEY ("purchaseBatchId") REFERENCES "PurchaseBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryBatch" ("id", "locationId", "originalWeight", "purchaseDate", "purchaseLineItemId", "realizedProfit", "realizedRevenue", "remainingWeight", "soldWeight", "taxableRevenue") SELECT "id", "locationId", "originalWeight", "purchaseDate", "purchaseLineItemId", "realizedProfit", "realizedRevenue", "remainingWeight", coalesce("soldWeight", 0) AS "soldWeight", "taxableRevenue" FROM "InventoryBatch";
DROP TABLE "InventoryBatch";
ALTER TABLE "new_InventoryBatch" RENAME TO "InventoryBatch";
CREATE UNIQUE INDEX "InventoryBatch_purchaseLineItemId_key" ON "InventoryBatch"("purchaseLineItemId");
CREATE INDEX "InventoryBatch_qualityId_locationId_purchaseDate_idx" ON "InventoryBatch"("qualityId", "locationId", "purchaseDate");
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
INSERT INTO "new_Purchase" ("createdAt", "createdById", "deletedAt", "dueDate", "expenseTotal", "freightTotal", "gstTotal", "id", "locationId", "netAmount", "notes", "outstanding", "paidAmount", "purchaseDate", "purchaseNumber", "status", "subtotal", "supplierId", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "deletedAt", "dueDate", "expenseTotal", "freightTotal", "gstTotal", "id", "locationId", "netAmount", "notes", "outstanding", "paidAmount", "purchaseDate", "purchaseNumber", "status", "subtotal", "supplierId", "updatedAt", "updatedById" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_purchaseNumber_key" ON "Purchase"("purchaseNumber");
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");
CREATE INDEX "Purchase_purchaseDate_status_deletedAt_idx" ON "Purchase"("purchaseDate", "status", "deletedAt");
CREATE INDEX "Purchase_purchaseBatchId_idx" ON "Purchase"("purchaseBatchId");
CREATE TABLE "new_PurchaseLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "qualityId" TEXT NOT NULL,
    "truckNumber" TEXT,
    "weight" DECIMAL NOT NULL,
    "rate" DECIMAL NOT NULL,
    "freight" DECIMAL NOT NULL DEFAULT 0,
    "additionalExpenses" DECIMAL NOT NULL DEFAULT 0,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL NOT NULL DEFAULT 0,
    "totalCost" DECIMAL NOT NULL DEFAULT 0,
    "costPerMT" DECIMAL NOT NULL DEFAULT 0,
    "netAmount" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseLineItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseLineItem_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "CoalQuality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseLineItem" ("additionalExpenses", "freight", "gstAmount", "gstRate", "id", "netAmount", "purchaseId", "qualityId", "rate", "totalCost", "weight") SELECT "additionalExpenses", "freight", "gstAmount", "gstRate", "id", "netAmount", "purchaseId", "qualityId", "rate", "totalCost", "weight" FROM "PurchaseLineItem";
DROP TABLE "PurchaseLineItem";
ALTER TABLE "new_PurchaseLineItem" RENAME TO "PurchaseLineItem";
CREATE INDEX "PurchaseLineItem_purchaseId_idx" ON "PurchaseLineItem"("purchaseId");
CREATE INDEX "PurchaseLineItem_qualityId_idx" ON "PurchaseLineItem"("qualityId");
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
INSERT INTO "new_Sale" ("createdAt", "createdById", "customerId", "deletedAt", "dueDate", "freightTotal", "grossAmount", "gstTotal", "id", "netAmount", "notes", "outstanding", "paidAmount", "profit", "saleDate", "saleNumber", "status", "subtotal", "totalCost", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "customerId", "deletedAt", "dueDate", "freightTotal", "grossAmount", "gstTotal", "id", "netAmount", "notes", "outstanding", "paidAmount", "profit", "saleDate", "saleNumber", "status", "subtotal", "totalCost", "updatedAt", "updatedById" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_saleDate_status_deletedAt_idx" ON "Sale"("saleDate", "status", "deletedAt");
CREATE INDEX "Sale_salesBatchId_idx" ON "Sale"("salesBatchId");
CREATE TABLE "new_SaleLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "qualityId" TEXT NOT NULL,
    "truckNumber" TEXT,
    "weight" DECIMAL NOT NULL,
    "rate" DECIMAL NOT NULL,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL NOT NULL DEFAULT 0,
    "netAmount" DECIMAL NOT NULL DEFAULT 0,
    "totalCost" DECIMAL NOT NULL DEFAULT 0,
    "profit" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "SaleLineItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleLineItem_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "CoalQuality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SaleLineItem" ("grossAmount", "gstAmount", "gstRate", "id", "netAmount", "profit", "qualityId", "rate", "saleId", "totalCost", "weight") SELECT "grossAmount", "gstAmount", "gstRate", "id", "netAmount", "profit", "qualityId", "rate", "saleId", "totalCost", "weight" FROM "SaleLineItem";
DROP TABLE "SaleLineItem";
ALTER TABLE "new_SaleLineItem" RENAME TO "SaleLineItem";
CREATE INDEX "SaleLineItem_saleId_idx" ON "SaleLineItem"("saleId");
CREATE INDEX "SaleLineItem_qualityId_idx" ON "SaleLineItem"("qualityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CoalQuality_name_key" ON "CoalQuality"("name");

-- CreateIndex
CREATE INDEX "CoalQuality_name_idx" ON "CoalQuality"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBatch_code_key" ON "PurchaseBatch"("code");

-- CreateIndex
CREATE INDEX "PurchaseBatch_name_idx" ON "PurchaseBatch"("name");

-- CreateIndex
CREATE INDEX "PurchaseBatch_code_idx" ON "PurchaseBatch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SalesBatch_code_key" ON "SalesBatch"("code");

-- CreateIndex
CREATE INDEX "SalesBatch_name_idx" ON "SalesBatch"("name");

-- CreateIndex
CREATE INDEX "SalesBatch_code_idx" ON "SalesBatch"("code");

-- CreateIndex
CREATE INDEX "PurchaseIncomeAdjustment_purchaseId_idx" ON "PurchaseIncomeAdjustment"("purchaseId");

-- CreateIndex
CREATE INDEX "SaleFreightEntry_saleId_idx" ON "SaleFreightEntry"("saleId");

-- CreateIndex
CREATE INDEX "StockLedger_qualityId_createdAt_idx" ON "StockLedger"("qualityId", "createdAt");

-- CreateIndex
CREATE INDEX "StockLedger_batchId_idx" ON "StockLedger"("batchId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_entityType_entityId_idx" ON "Payment"("paymentDate", "entityType", "entityId");
