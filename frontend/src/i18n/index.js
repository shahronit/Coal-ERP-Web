import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enPages from './locales/en/pages.json';
import enGuides from './locales/en/guides.json';
import hiCommon from './locales/hi/common.json';
import hiNav from './locales/hi/nav.json';
import hiPages from './locales/hi/pages.json';
import hiGuides from './locales/hi/guides.json';

export const LANG_STORAGE_KEY = 'tradecrm_lang';

const initialLanguage = localStorage.getItem(LANG_STORAGE_KEY) || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, nav: enNav, pages: enPages, guides: enGuides },
      hi: { common: hiCommon, nav: hiNav, pages: hiPages, guides: hiGuides },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    ns: ['common', 'nav', 'pages', 'guides'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

document.documentElement.lang = initialLanguage;

export default i18n;
