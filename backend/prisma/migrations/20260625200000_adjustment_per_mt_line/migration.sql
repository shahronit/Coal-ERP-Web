-- AlterTable
ALTER TABLE "PurchaseIncomeAdjustment" ADD COLUMN "purchaseLineItemId" TEXT;
ALTER TABLE "PurchaseExpenseAdjustment" ADD COLUMN "purchaseLineItemId" TEXT;
ALTER TABLE "SaleIncomeAdjustment" ADD COLUMN "saleLineItemId" TEXT;
ALTER TABLE "SaleExpenseAdjustment" ADD COLUMN "saleLineItemId" TEXT;

-- AddForeignKey
ALTER TABLE "PurchaseIncomeAdjustment" ADD CONSTRAINT "PurchaseIncomeAdjustment_purchaseLineItemId_fkey" FOREIGN KEY ("purchaseLineItemId") REFERENCES "PurchaseLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseExpenseAdjustment" ADD CONSTRAINT "PurchaseExpenseAdjustment_purchaseLineItemId_fkey" FOREIGN KEY ("purchaseLineItemId") REFERENCES "PurchaseLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleIncomeAdjustment" ADD CONSTRAINT "SaleIncomeAdjustment_saleLineItemId_fkey" FOREIGN KEY ("saleLineItemId") REFERENCES "SaleLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleExpenseAdjustment" ADD CONSTRAINT "SaleExpenseAdjustment_saleLineItemId_fkey" FOREIGN KEY ("saleLineItemId") REFERENCES "SaleLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "PurchaseIncomeAdjustment_purchaseLineItemId_idx" ON "PurchaseIncomeAdjustment"("purchaseLineItemId");
CREATE INDEX "PurchaseExpenseAdjustment_purchaseLineItemId_idx" ON "PurchaseExpenseAdjustment"("purchaseLineItemId");
CREATE INDEX "SaleIncomeAdjustment_saleLineItemId_idx" ON "SaleIncomeAdjustment"("saleLineItemId");
CREATE INDEX "SaleExpenseAdjustment_saleLineItemId_idx" ON "SaleExpenseAdjustment"("saleLineItemId");
