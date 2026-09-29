import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const ConnectedDataContext = createContext(null);

const emptyPersonal = {
  profile: null,
  wardrobe: [],
  saves: [],
  looks: [],
  jobs: [],
  stores: [],
  products: [],
  showcases: [],
};

const emptyOrganization = {
  store: null,
  products: [],
  engagement: [],
  showcases: [],
};

export const useConnectedData = () => useContext(ConnectedDataContext);

export function ConnectedDataProvider({ children }) {
  const { token, user, activeContext, demoMode } = useAuth();
  const [personal, setPersonal] = useState(emptyPersonal);
  const [organization, setOrganization] = useState(emptyOrganization);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (demoMode || !token) {
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        if (activeContext === 'personal') {
          const [profile, wardrobe, saves, looks, jobs, stores, products, showcases] = await Promise.all([
            api('/profile', { token }),
            api('/wardrobe/items', { token }),
            api('/commercial-saves', { token }),
            api('/looks', { token }),
            api('/reconstruction/jobs', { token }),
            api('/stores', { token }),
            api('/products', { token }),
            api('/showcases', { token }),
          ]);

          if (!cancelled) {
            setPersonal({ profile, wardrobe, saves, looks, jobs, stores, products, showcases });
          }
        } else {
          const membership = user?.contexts?.find((context) => context.organization_id === activeContext);
          if (!membership) throw new Error('Contexto comercial indisponível para esta conta.');

          const headers = { 'X-Organization-Id': activeContext };
          const storeId = membership.store_id;
          const canReadAnalytics = membership.capabilities?.includes('analytics.read');
          const [store, engagement, products, showcases] = await Promise.all([
            api('/stores/me', { token, headers }),
            canReadAnalytics ? api('/stores/engagement/saves', { token, headers }) : Promise.resolve([]),
            api('/products?storeId=' + encodeURIComponent(storeId), { token }),
            api('/showcases?storeId=' + encodeURIComponent(storeId), { token }),
          ]);

          if (!cancelled) {
            setOrganization({ store, engagement, products, showcases });
          }
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || 'Não foi possível carregar este contexto.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, user, activeContext, demoMode, revision]);
  const value = useMemo(() => ({
    loading,
    error,
    refresh,
    personal,
    organization,
    activeContext,
    isPersonal: activeContext === 'personal',
  }), [loading, error, refresh, personal, organization, activeContext]);

  return (
    <ConnectedDataContext.Provider value={value}>
      {children}
    </ConnectedDataContext.Provider>
  );
}
