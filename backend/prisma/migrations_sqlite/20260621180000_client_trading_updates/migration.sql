-- Payment: record who made the payment
ALTER TABLE "Payment" ADD COLUMN "paidByName" TEXT;

-- Map legacy sale types to Direct / Indirect
UPDATE "Sale" SET "saleType" = 'DIRECT' WHERE "saleType" IN ('DOMESTIC', 'EXPORT') OR "saleType" IS NULL OR "saleType" = '';
