import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('tradecrm_auth');
const parsed = stored ? JSON.parse(stored) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: parsed?.user || null,
    accessToken: parsed?.accessToken || null,
    refreshToken: parsed?.refreshToken || null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('tradecrm_auth', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('tradecrm_auth');
    },
    updateUser: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      const stored = localStorage.getItem('tradecrm_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user = state.user;
        localStorage.setItem('tradecrm_auth', JSON.stringify(parsed));
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.accessToken;
export default authSlice.reducer;
