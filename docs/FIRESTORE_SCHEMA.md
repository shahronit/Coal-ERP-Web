# Firestore schema map (Prisma → Firestore)

All collections use **flat top-level documents** with foreign-key fields (mirrors PostgreSQL tables). This keeps the Firestore adapter aligned with existing Prisma services and simplifies migration.

## Collection naming

| Prisma model | Firestore collection |
|--------------|---------------------|
| User | `users` |
| UserProfile | `userProfiles` |
| RefreshToken | `refreshTokens` |
| PasswordResetToken | `passwordResetTokens` |
| Partner | `partners` |
| Supplier | `suppliers` |
| Customer | `customers` |
| CoalQuality | `coalQualities` |
| PurchaseBatch | `purchaseBatches` |
| SalesBatch | `salesBatches` |
| Location | `locations` |
| ExpenseType | `expenseTypes` |
| IncomeType | `incomeTypes` |
| AssetType | `assetTypes` |
| TaxConfiguration | `taxConfigurations` |
| Purchase | `purchases` |
| PurchaseLineItem | `purchaseLineItems` |
| PurchaseIncomeAdjustment | `purchaseIncomeAdjustments` |
| PurchaseExpenseAdjustment | `purchaseExpenseAdjustments` |
| InventoryBatch | `inventoryBatches` |
| Sale | `sales` |
| SaleLineItem | `saleLineItems` |
| SaleFreightEntry | `saleFreightEntries` |
| SaleExpenseAdjustment | `saleExpenseAdjustments` |
| SaleIncomeAdjustment | `saleIncomeAdjustments` |
| InventoryAllocation | `inventoryAllocations` |
| StockLedger | `stockLedger` |
| Payment | `payments` |
| PartnerInvestment | `partnerInvestments` |
| InvestmentReturn | `investmentReturns` |
| Expense | `expenses` |
| Asset | `assets` |
| Document | `documents` |
| AuditLog | `auditLogs` |
| Notification | `notifications` |
| ReportTemplate | `reportTemplates` |
| ReportRun | `reportRuns` |
| Lead | `leads` |
| Activity | `activities` |
| SequenceCounter | `sequenceCounters` |
| AppSetting | `appSettings` (singleton doc id: `global`) |
| BackupRecord | `backupRecords` |

## Field conventions

- Document `id` field mirrors Prisma UUID (also used as Firestore doc id).
- `deletedAt`: `null` for active records; ISO string or Timestamp when soft-deleted.
- Decimal/money fields stored as **numbers** (same as Prisma Decimal JSON).
- Dates stored as Firestore **Timestamp**, converted to `Date` on read.
- `roleModules` on AppSetting stored as map/object (JSON).

## Relations (via foreign keys)

- `purchaseLineItems.purchaseId` → `purchases.id`
- `inventoryBatches.purchaseLineItemId` → `purchaseLineItems.id`
- `inventoryAllocations.saleLineItemId` / `inventoryBatchId`
- `documents.storagePath` → Firebase Storage object path (replaces `filePath`)

## Indexes

See [firebase/firestore.indexes.json](../firebase/firestore.indexes.json).

## Security

All client access is denied in Firestore rules. Express API uses Firebase Admin SDK on Cloud Run.
