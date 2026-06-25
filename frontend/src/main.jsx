import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import { initThemeGradient } from './theme/initTheme';
import App from './App.jsx';
import './index.css';

initThemeGradient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
