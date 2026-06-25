import baseApi from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/auth/profile', method: 'PUT', body }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useChangePasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSummary: builder.query({ query: () => '/dashboard/summary', providesTags: ['Dashboard'] }),
    getKPIs: builder.query({ query: () => '/dashboard/kpis', providesTags: ['Dashboard'] }),
    getTrends: builder.query({ query: () => '/dashboard/trends', providesTags: ['Dashboard'] }),
    getTopCustomers: builder.query({ query: () => '/dashboard/top-customers' }),
    getTopSuppliers: builder.query({ query: () => '/dashboard/top-suppliers' }),
    getQualityStock: builder.query({ query: () => '/dashboard/quality-stock' }),
  }),
});

export const { useGetSummaryQuery, useGetKPIsQuery, useGetTrendsQuery, useGetTopCustomersQuery, useGetTopSuppliersQuery, useGetQualityStockQuery } = dashboardApi;

export const profitLossApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPLTransactions: builder.query({ query: (p) => ({ url: '/profit-loss/transactions', params: p }), providesTags: ['ProfitLoss'] }),
    getPLBatches: builder.query({ query: (p) => ({ url: '/profit-loss/batches', params: p }), providesTags: ['ProfitLoss'] }),
    getPLMonthly: builder.query({ query: (p) => ({ url: '/profit-loss/monthly', params: p }), providesTags: ['ProfitLoss'] }),
    getPLPartners: builder.query({ query: () => '/profit-loss/partners', providesTags: ['ProfitLoss'] }),
    getPLQualities: builder.query({ query: (p) => ({ url: '/profit-loss/qualities', params: p }), providesTags: ['ProfitLoss'] }),
    getPLAnalytics: builder.query({ query: (p) => ({ url: '/profit-loss/analytics', params: p }), providesTags: ['ProfitLoss'] }),
  }),
});

export const batchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPurchaseBatches: builder.query({ query: () => '/batches/purchase', providesTags: ['Batch'] }),
    listSalesBatches: builder.query({ query: () => '/batches/sales', providesTags: ['Batch'] }),
  }),
});

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicBranding: builder.query({ query: () => '/settings/branding' }),
    getAppSettings: builder.query({ query: () => '/settings/app', providesTags: ['Settings'] }),
    updateAppSettings: builder.mutation({
      query: (body) => {
        const sanitized = JSON.parse(JSON.stringify(body ?? {}));
        if (!Object.keys(sanitized).length) {
          throw new Error('No settings payload to save');
        }
        return { url: '/settings/app', method: 'PUT', body: sanitized };
      },
      invalidatesTags: ['Settings'],
    }),
    updateRoleModules: builder.mutation({
      query: (roleModules) => {
        const sanitized = JSON.parse(JSON.stringify(roleModules ?? {}));
        if (!Object.keys(sanitized).length) {
          throw new Error('No role access rules to save');
        }
        // Use /settings/app — works without backend restart (role-modules route needs Electron restart)
        return {
          url: '/settings/app',
          method: 'PUT',
          body: { roleModules: sanitized },
        };
      },
      invalidatesTags: ['Settings'],
      async onQueryStarted(roleModules, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          settingsApi.util.updateQueryData('getAppSettings', undefined, (draft) => {
            if (draft?.data) draft.data.roleModules = roleModules;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getSetupStatus: builder.query({ query: () => '/settings/setup-status', providesTags: ['Settings'] }),
    completeSetup: builder.mutation({
      query: (body) => ({ url: '/settings/setup', method: 'POST', body }),
      invalidatesTags: ['Settings'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            settingsApi.util.updateQueryData('getSetupStatus', undefined, (draft) => {
              if (draft?.data) {
                draft.data.setupCompleted = true;
                if (data?.data?.companyName) draft.data.companyName = data.data.companyName;
              }
            })
          );
        } catch {
          // handled by mutation error state
        }
      },
    }),
  }),
});

export const profitabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfitTransactions: builder.query({ query: (p) => ({ url: '/profitability/transactions', params: p }), providesTags: ['Profitability'] }),
    getSaleProfitability: builder.query({ query: (id) => `/profitability/sales/${id}` }),
    getProfitBatches: builder.query({ query: (p) => ({ url: '/profitability/batches', params: p }), providesTags: ['Profitability'] }),
    getProfitByProduct: builder.query({ query: (p) => ({ url: '/profitability/by-product', params: p }), providesTags: ['Profitability'] }),
    getProfitByCustomer: builder.query({ query: (p) => ({ url: '/profitability/by-customer', params: p }), providesTags: ['Profitability'] }),
  }),
});

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPLStatement: builder.query({ query: (p) => ({ url: '/accounting/pl-statement', params: p }), providesTags: ['Accounting'] }),
    getAging: builder.query({ query: () => '/accounting/aging', providesTags: ['Accounting'] }),
    getDayBook: builder.query({ query: (p) => ({ url: '/accounting/day-book', params: p }), providesTags: ['Accounting'] }),
    getGstSummary: builder.query({ query: (p) => ({ url: '/accounting/gst-summary', params: p }), providesTags: ['Accounting'] }),
  }),
});

export const createMasterApi = (resource, tag) => {
  const name = resource
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return baseApi.injectEndpoints({
    endpoints: (builder) => ({
      [`listMaster${name}`]: builder.query({
        query: (params) => ({ url: `/masters/${resource}`, params }),
        providesTags: [{ type: tag, id: resource }],
      }),
      [`getMaster${name}`]: builder.query({
        query: (id) => `/masters/${resource}/${id}`,
        providesTags: (r, e, id) => [{ type: tag, id: `${resource}-${id}` }],
      }),
      [`createMaster${name}`]: builder.mutation({
        query: (body) => ({ url: `/masters/${resource}`, method: 'POST', body }),
        invalidatesTags: [{ type: tag, id: resource }],
      }),
      [`updateMaster${name}`]: builder.mutation({
        query: ({ id, ...body }) => ({ url: `/masters/${resource}/${id}`, method: 'PUT', body }),
        invalidatesTags: [{ type: tag, id: resource }],
      }),
      [`removeMaster${name}`]: builder.mutation({
        query: (id) => ({ url: `/masters/${resource}/${id}`, method: 'DELETE' }),
        invalidatesTags: [{ type: tag, id: resource }],
      }),
    }),
  });
};

export const partnersApi = createMasterApi('partners', 'Master');
export const suppliersApi = createMasterApi('suppliers', 'Master');
export const customersApi = createMasterApi('customers', 'Master');
export const qualitiesApi = createMasterApi('coal-qualities', 'Master');
export const purchaseBatchesApi = createMasterApi('purchase-batches', 'Master');
export const salesBatchesApi = createMasterApi('sales-batches', 'Master');
export const locationsApi = createMasterApi('locations', 'Master');
export const expenseTypesApi = createMasterApi('expense-types', 'Master');
export const incomeTypesApi = createMasterApi('income-types', 'Master');
export const assetTypesApi = createMasterApi('asset-types', 'Master');
export const taxApi = createMasterApi('tax-configurations', 'Master');

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPurchases: builder.query({ query: (p) => ({ url: '/purchases', params: p }), providesTags: ['Purchase'] }),
    getPurchase: builder.query({ query: (id) => `/purchases/${id}`, providesTags: ['Purchase'] }),
    createPurchase: builder.mutation({ query: (b) => ({ url: '/purchases', method: 'POST', body: b }), invalidatesTags: ['Purchase', 'Dashboard'] }),
    updatePurchase: builder.mutation({ query: ({ id, ...b }) => ({ url: `/purchases/${id}`, method: 'PUT', body: b }), invalidatesTags: ['Purchase'] }),
    confirmPurchase: builder.mutation({ query: (id) => ({ url: `/purchases/${id}/confirm`, method: 'POST' }), invalidatesTags: ['Purchase', 'Dashboard'] }),
    deletePurchase: builder.mutation({ query: (id) => ({ url: `/purchases/${id}`, method: 'DELETE' }), invalidatesTags: ['Purchase'] }),
  }),
});

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSales: builder.query({ query: (p) => ({ url: '/sales', params: p }), providesTags: ['Sale'] }),
    getSale: builder.query({ query: (id) => `/sales/${id}`, providesTags: ['Sale'] }),
    createSale: builder.mutation({ query: (b) => ({ url: '/sales', method: 'POST', body: b }), invalidatesTags: ['Sale', 'Dashboard', 'Inventory'] }),
    previewFifo: builder.mutation({ query: (b) => ({ url: '/sales/fifo-preview', method: 'POST', body: b }) }),
    deleteSale: builder.mutation({ query: (id) => ({ url: `/sales/${id}`, method: 'DELETE' }), invalidatesTags: ['Sale'] }),
  }),
});

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query({ query: (p) => ({ url: '/inventory/stock', params: p }) }),
    getOverallStock: builder.query({ query: (params) => ({ url: '/inventory/stock/overall', params: params || {} }) }),
    getLedger: builder.query({ query: (p) => ({ url: '/inventory/ledger', params: p }) }),
    getMovements: builder.query({ query: (p) => ({ url: '/inventory/movements', params: p }) }),
  }),
});

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query({ query: (p) => ({ url: '/payments', params: p }), providesTags: ['Payment'] }),
    getOutstanding: builder.query({ query: () => '/payments/outstanding' }),
    createPayment: builder.mutation({ query: (b) => ({ url: '/payments', method: 'POST', body: b }), invalidatesTags: ['Payment', 'Dashboard'] }),
  }),
});

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listExpenses: builder.query({ query: (p) => ({ url: '/expenses', params: p }), providesTags: ['Expense'] }),
    createExpense: builder.mutation({ query: (b) => ({ url: '/expenses', method: 'POST', body: b }), invalidatesTags: ['Expense'] }),
    updateExpense: builder.mutation({ query: ({ id, ...b }) => ({ url: `/expenses/${id}`, method: 'PUT', body: b }), invalidatesTags: ['Expense'] }),
    deleteExpense: builder.mutation({ query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }), invalidatesTags: ['Expense'] }),
  }),
});

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAssets: builder.query({ query: (p) => ({ url: '/assets', params: p }), providesTags: ['Asset'] }),
    createAsset: builder.mutation({ query: (b) => ({ url: '/assets', method: 'POST', body: b }), invalidatesTags: ['Asset'] }),
    updateAsset: builder.mutation({ query: ({ id, ...b }) => ({ url: `/assets/${id}`, method: 'PUT', body: b }), invalidatesTags: ['Asset'] }),
    deleteAsset: builder.mutation({ query: (id) => ({ url: `/assets/${id}`, method: 'DELETE' }), invalidatesTags: ['Asset'] }),
  }),
});

export const investmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listInvestments: builder.query({ query: (p) => ({ url: '/investments', params: p }), providesTags: ['Investment'] }),
    getROI: builder.query({ query: () => '/investments/roi-dashboard' }),
    createInvestment: builder.mutation({ query: (b) => ({ url: '/investments', method: 'POST', body: b }), invalidatesTags: ['Investment'] }),
  }),
});

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query({ query: (p) => ({ url: '/notifications', params: p }), providesTags: ['Notification'] }),
    unreadCount: builder.query({ query: () => '/notifications/unread-count', providesTags: ['Notification'] }),
    markRead: builder.mutation({ query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Notification'] }),
  }),
});

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAudit: builder.query({ query: (p) => ({ url: '/audit', params: p }) }),
  }),
});

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query({
      query: (p) => ({ url: '/users', params: p }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ id }) => ({ type: 'User', id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }],
    }),
    createUser: builder.mutation({
      query: (b) => ({ url: '/users', method: 'POST', body: b }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...b }) => ({ url: `/users/${id}`, method: 'PUT', body: b }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
  }),
});

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listReportTypes: builder.query({ query: () => '/reports/types' }),
    listReportTemplateOptions: builder.query({ query: () => '/reports/templates/options' }),
    listReportTemplates: builder.query({ query: () => '/reports/templates', providesTags: ['ReportTemplate'] }),
    createReportTemplate: builder.mutation({
      query: (body) => ({ url: '/reports/templates', method: 'POST', body }),
      invalidatesTags: ['ReportTemplate'],
    }),
    updateReportTemplate: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/reports/templates/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ReportTemplate'],
    }),
    deleteReportTemplate: builder.mutation({
      query: (id) => ({ url: `/reports/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ReportTemplate'],
    }),
  }),
});

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLeads: builder.query({ query: (p) => ({ url: '/leads', params: p }), providesTags: ['Lead'] }),
    getPipeline: builder.query({ query: () => '/leads/pipeline', providesTags: ['Lead'] }),
    createLead: builder.mutation({ query: (b) => ({ url: '/leads', method: 'POST', body: b }), invalidatesTags: ['Lead'] }),
    updateLead: builder.mutation({ query: ({ id, ...b }) => ({ url: `/leads/${id}`, method: 'PUT', body: b }), invalidatesTags: ['Lead'] }),
    deleteLead: builder.mutation({ query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }), invalidatesTags: ['Lead'] }),
  }),
});

export const activitiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listActivities: builder.query({ query: (p) => ({ url: '/activities', params: p }), providesTags: ['Activity'] }),
    getUpcomingActivities: builder.query({ query: () => '/activities/upcoming', providesTags: ['Activity'] }),
    createActivity: builder.mutation({ query: (b) => ({ url: '/activities', method: 'POST', body: b }), invalidatesTags: ['Activity'] }),
    updateActivity: builder.mutation({ query: ({ id, ...b }) => ({ url: `/activities/${id}`, method: 'PUT', body: b }), invalidatesTags: ['Activity'] }),
    deleteActivity: builder.mutation({ query: (id) => ({ url: `/activities/${id}`, method: 'DELETE' }), invalidatesTags: ['Activity'] }),
  }),
});

export const backupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBackupSettings: builder.query({
      query: () => '/backup/settings',
      providesTags: ['Backup'],
    }),
    updateBackupSettings: builder.mutation({
      query: (body) => ({ url: '/backup/settings', method: 'PUT', body }),
      invalidatesTags: ['Backup'],
    }),
    runBackup: builder.mutation({
      query: () => ({ url: '/backup/run', method: 'POST' }),
      invalidatesTags: ['Backup'],
    }),
    restoreBackup: builder.mutation({
      query: (body) => ({ url: '/backup/restore', method: 'POST', body }),
      invalidatesTags: ['Backup', 'Settings', 'Purchase', 'Sale', 'Master', 'Inventory'],
    }),
    getBackupHistory: builder.query({
      query: () => '/backup/history',
      providesTags: ['Backup'],
    }),
  }),
});

export const setupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    loadDemoSeed: builder.mutation({
      query: (body = {}) => ({ url: '/setup/demo-seed', method: 'POST', body }),
      invalidatesTags: ['Purchase', 'Sale', 'Master', 'Inventory', 'User', 'Settings'],
    }),
  }),
});

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query({
      query: (p) => ({ url: '/search', params: p }),
    }),
  }),
});

export const {
  useListPurchasesQuery, useGetPurchaseQuery, useCreatePurchaseMutation, useUpdatePurchaseMutation,
  useConfirmPurchaseMutation, useDeletePurchaseMutation,
} = purchasesApi;
export const { useListSalesQuery, useGetSaleQuery, useCreateSaleMutation, usePreviewFifoMutation, useDeleteSaleMutation } = salesApi;
export const { useGetStockQuery, useGetOverallStockQuery, useGetLedgerQuery, useGetMovementsQuery } = inventoryApi;
export const { useListPaymentsQuery, useGetOutstandingQuery, useCreatePaymentMutation } = paymentsApi;
export const { useListExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } = expensesApi;
export const { useListAssetsQuery, useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation } = assetsApi;
export const { useListInvestmentsQuery, useGetROIQuery, useCreateInvestmentMutation } = investmentsApi;
export const { useListNotificationsQuery, useUnreadCountQuery, useMarkReadMutation } = notificationsApi;
export const { useListAuditQuery } = auditApi;
export const { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } = usersApi;
export const {
  useListReportTypesQuery, useListReportTemplateOptionsQuery, useListReportTemplatesQuery,
  useCreateReportTemplateMutation, useUpdateReportTemplateMutation, useDeleteReportTemplateMutation,
} = reportsApi;
export const {
  useGetProfitTransactionsQuery, useGetSaleProfitabilityQuery, useGetProfitBatchesQuery,
  useGetProfitByProductQuery, useGetProfitByCustomerQuery,
} = profitabilityApi;
export const {
  useGetPLTransactionsQuery, useGetPLBatchesQuery, useGetPLMonthlyQuery,
  useGetPLPartnersQuery, useGetPLQualitiesQuery, useGetPLAnalyticsQuery,
} = profitLossApi;
export const { useListPurchaseBatchesQuery, useListSalesBatchesQuery } = batchesApi;
export const {
  useGetPublicBrandingQuery,
  useGetAppSettingsQuery, useUpdateAppSettingsMutation, useUpdateRoleModulesMutation,
  useGetSetupStatusQuery, useCompleteSetupMutation,
} = settingsApi;
export const { useGetPLStatementQuery, useGetAgingQuery, useGetDayBookQuery, useGetGstSummaryQuery } = accountingApi;
export const { useListLeadsQuery, useGetPipelineQuery, useCreateLeadMutation, useUpdateLeadMutation, useDeleteLeadMutation } = leadsApi;
export const {
  useListActivitiesQuery, useGetUpcomingActivitiesQuery, useCreateActivityMutation,
  useUpdateActivityMutation, useDeleteActivityMutation,
} = activitiesApi;
export const {
  useGetBackupSettingsQuery, useUpdateBackupSettingsMutation, useRunBackupMutation,
  useRestoreBackupMutation, useGetBackupHistoryQuery,
} = backupApi;
export const { useLoadDemoSeedMutation } = setupApi;
export const { useGlobalSearchQuery, useLazyGlobalSearchQuery } = searchApi;

export const { useListMasterPartnersQuery: useListPartnersQuery, useCreateMasterPartnersMutation: useCreatePartnerMutation } = partnersApi;
export const { useListMasterSuppliersQuery: useListSuppliersQuery, useCreateMasterSuppliersMutation: useCreateSupplierMutation } = suppliersApi;
export const { useListMasterCustomersQuery: useListCustomersQuery, useCreateMasterCustomersMutation: useCreateCustomerMutation } = customersApi;
export const { useListMasterCoalQualitiesQuery: useListQualitiesQuery, useCreateMasterCoalQualitiesMutation: useCreateQualityMutation } = qualitiesApi;
export const { useListMasterPurchaseBatchesQuery: useListPurchaseBatchesMasterQuery, useCreateMasterPurchaseBatchesMutation: useCreatePurchaseBatchMutation } = purchaseBatchesApi;
export const { useListMasterSalesBatchesQuery: useListSalesBatchesMasterQuery, useCreateMasterSalesBatchesMutation: useCreateSalesBatchMutation } = salesBatchesApi;
export const { useListMasterLocationsQuery: useListLocationsQuery, useCreateMasterLocationsMutation: useCreateLocationMutation } = locationsApi;
export const { useListMasterExpenseTypesQuery: useListExpenseTypesQuery, useCreateMasterExpenseTypesMutation: useCreateExpenseTypeMutation } = expenseTypesApi;
export const { useListMasterIncomeTypesQuery: useListIncomeTypesQuery, useCreateMasterIncomeTypesMutation: useCreateIncomeTypeMutation } = incomeTypesApi;
export const { useListMasterAssetTypesQuery: useListAssetTypesQuery, useCreateMasterAssetTypesMutation: useCreateAssetTypeMutation } = assetTypesApi;
export const { useListMasterTaxConfigurationsQuery: useListTaxConfigsQuery, useCreateMasterTaxConfigurationsMutation: useCreateTaxMutation } = taxApi;
