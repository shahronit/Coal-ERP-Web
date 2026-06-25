-- AlterTable
ALTER TABLE "PurchaseLineItem" ADD COLUMN "costPerMTIncGst" DECIMAL NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InventoryBatch" ADD COLUMN "costPerMTIncGst" DECIMAL NOT NULL DEFAULT 0;

-- Backfill from netAmount / weight where weight > 0
UPDATE "PurchaseLineItem"
SET "costPerMTIncGst" = CASE
  WHEN "weight" > 0 THEN ROUND("netAmount" / "weight", 4)
  ELSE 0
END;

UPDATE "InventoryBatch"
SET "costPerMTIncGst" = (
  SELECT CASE
    WHEN pli."weight" > 0 THEN ROUND(pli."netAmount" / pli."weight", 4)
    ELSE 0
  END
  FROM "PurchaseLineItem" pli
  WHERE pli."id" = "InventoryBatch"."purchaseLineItemId"
);
