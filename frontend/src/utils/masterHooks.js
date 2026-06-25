import {
  useListSuppliersQuery,
  useListCustomersQuery,
  useListQualitiesQuery,
  useListPurchaseBatchesMasterQuery,
  useListSalesBatchesMasterQuery,
  useListLocationsQuery,
  useListIncomeTypesQuery,
  useListExpenseTypesQuery,
  useListPartnersQuery,
  useListAssetTypesQuery,
  useListTaxConfigsQuery,
} from '../store/api/services';

export const MASTER_LIST_HOOKS = {
  suppliers: useListSuppliersQuery,
  customers: useListCustomersQuery,
  'coal-qualities': useListQualitiesQuery,
  'purchase-batches': useListPurchaseBatchesMasterQuery,
  'sales-batches': useListSalesBatchesMasterQuery,
  locations: useListLocationsQuery,
  'income-types': useListIncomeTypesQuery,
  'expense-types': useListExpenseTypesQuery,
  partners: useListPartnersQuery,
  'tax-configurations': useListTaxConfigsQuery,
};
