import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PageMetaContext = createContext(null);

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const registerMeta = useCallback((next) => setMeta(next), []);
  const clearMeta = useCallback(() => setMeta(null), []);

  const value = useMemo(
    () => ({ meta, registerMeta, clearMeta }),
    [meta, registerMeta, clearMeta],
  );

  return (
    <PageMetaContext.Provider value={value}>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMetaRegistry() {
  return useContext(PageMetaContext);
}
