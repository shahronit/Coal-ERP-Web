import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getApiBaseUrl } from '../../utils/apiBase';

const prepareHeaders = (headers, { getState }) => {
  const token = getState().auth.accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
};

const rawBaseQuery = async (args, api, extraOptions) => fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders,
})(args, api, extraOptions);

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions
      );
      if (refreshResult.data?.data) {
        const { accessToken, refreshToken: newRefresh, user } = refreshResult.data.data;
        api.dispatch({
          type: 'auth/setCredentials',
          payload: { user, accessToken, refreshToken: newRefresh },
        });
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: 'auth/logout' });
      }
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 30,
  tagTypes: ['Master', 'Purchase', 'Sale', 'Payment', 'Expense', 'Asset', 'Investment', 'Notification', 'Dashboard', 'ReportTemplate', 'Backup', 'Settings', 'Branding', 'ProfitLoss', 'Batch', 'Accounting', 'Profitability', 'Lead', 'Activity', 'User', 'Profile'],
  endpoints: () => ({}),
});

export default baseApi;
