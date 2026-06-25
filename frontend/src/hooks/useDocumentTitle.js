import { useEffect } from 'react';
import { resolveAppName } from '../utils/branding';

export default function useDocumentTitle(appName) {
  useEffect(() => {
    document.title = resolveAppName(appName);
  }, [appName]);
}
