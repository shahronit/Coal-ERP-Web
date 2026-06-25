-- AlterTable
ALTER TABLE "PurchaseLineItem" ADD COLUMN "applyGst" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PurchaseLineItem" ADD COLUMN "taxConfigurationId" TEXT;

-- AlterTable
ALTER TABLE "SaleLineItem" ADD COLUMN "applyGst" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SaleLineItem" ADD COLUMN "taxConfigurationId" TEXT;

-- AddForeignKey
ALTER TABLE "PurchaseLineItem" ADD CONSTRAINT "PurchaseLineItem_taxConfigurationId_fkey" FOREIGN KEY ("taxConfigurationId") REFERENCES "TaxConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_taxConfigurationId_fkey" FOREIGN KEY ("taxConfigurationId") REFERENCES "TaxConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
