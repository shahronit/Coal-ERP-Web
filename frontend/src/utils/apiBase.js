const isValidHttpUrl = (value) => /^https?:\/\/.+/i.test(value || '');

export const getApiBaseUrl = () => {
  const desktopApiBaseUrl = window.electronAPI?.apiBaseUrl;
  if (isValidHttpUrl(desktopApiBaseUrl)) {
    return `${desktopApiBaseUrl.replace(/\/$/, '')}/api`;
  }

  // Browser (Firebase Hosting or dev proxy): same-origin /api rewrite
  if (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http')) {
    return '/api';
  }

  return import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:4000/api');
};

export const isDesktopApp = () => Boolean(window.electronAPI?.isDesktop);
