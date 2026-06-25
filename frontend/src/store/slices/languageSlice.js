import { createSlice } from '@reduxjs/toolkit';
import i18n, { LANG_STORAGE_KEY } from '../../i18n';

const initialLanguage = localStorage.getItem(LANG_STORAGE_KEY) || 'en';

const languageSlice = createSlice({
  name: 'language',
  initialState: { lang: initialLanguage },
  reducers: {
    setLanguage: (state, action) => {
      const nextLanguage = action.payload === 'hi' ? 'hi' : 'en';
      state.lang = nextLanguage;
      localStorage.setItem(LANG_STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage;
      i18n.changeLanguage(nextLanguage);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
