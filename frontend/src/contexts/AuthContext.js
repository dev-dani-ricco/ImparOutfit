import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
const DEMO_SESSION_KEY = '@imparoutfit/presentation-session-v3';
const TOKEN_KEY = 'imparoutfit-token';
const configuredDemoMode = Constants.expoConfig?.extra?.demoMode === true;

const demoUsers = {
  PERSON: {
    id: 'demo-person',
    person_id:'demo-person',
    contexts:[],
    name: 'Marina Alves',
    email: 'marina@demo.impar',
    profile_type: 'PERSON',
  },
  STORE: {
    id: 'demo-store-owner',
    person_id:'demo-store-owner',
    contexts:[{organization_id:'demo-org-aurora',store_id:'store-aurora',store_name:'Ateliê Aurora',capabilities:['store.read','store.update','catalog.write','marketing.write','analytics.read','members.manage']}],
    name: 'Helena Costa',
    email: 'helena@atelieaurora.demo',
    profile_type: 'STORE',
    store_id: 'store-aurora',
  },
};

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [demoMode,setDemoMode]=useState(configuredDemoMode);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeContext,setActiveContext]=useState('personal');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        if (demoMode) {
          const saved = await AsyncStorage.getItem(DEMO_SESSION_KEY);
          if (saved) {
            const session = JSON.parse(saved);
            setToken(session.token);
            setUser(session.user);
            setActiveContext(session.activeContext || 'personal');
          }
          return;
        }

        const available = await SecureStore.isAvailableAsync();
        const savedToken = available ? await SecureStore.getItemAsync(TOKEN_KEY) : null;
        if (!savedToken) return;

        const savedUser = await api('/auth/me', { token: savedToken });
        setToken(savedToken);
        setUser(savedUser);
      } catch (error) {
        console.warn('Sessão anterior inválida; um novo acesso será necessário.', error);
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        setIsReady(true);
      }
    }

    restoreSession();
  }, []);

  async function saveAuthenticatedSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    }
  }

  async function loginDemo(profileType = 'PERSON', overrides = {}) {
    const baseUser = demoUsers[profileType] || demoUsers.PERSON;
    const customId=overrides.email ? 'demo-custom-'+Date.now()+'-'+Math.random().toString(36).slice(2) : baseUser.id;
    const nextUser = { ...baseUser,...overrides,id:customId,person_id:customId,profile_type:profileType };
    const context=profileType==='STORE' ? nextUser.contexts[0]?.organization_id || 'personal' : 'personal';
    setActiveContext(context);
    const nextToken = `presentation-${profileType.toLowerCase()}`;
    const session = { token: nextToken, user: nextUser,activeContext:context };

    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  }

  async function register(payload) {
    if (demoMode) {
      return loginDemo(payload.profileType, {
        contexts: [],
        store_requests: payload.store ? [{id:'demo-request',name:payload.store.storeName,status:'PENDING_REVIEW'}] : [],
        name: payload.name || demoUsers[payload.profileType]?.name,
        email: payload.email || demoUsers[payload.profileType]?.email,
      });
    }

    const data = await api('/auth/register', { method: 'POST', body: payload });
    await saveAuthenticatedSession(data.token, data.user);
  }

  async function login(email, password) {
    if (demoMode) return loginDemo('PERSON', { email });

    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await saveAuthenticatedSession(data.token, data.user);
  }

  function switchContext(context) {
    if(context!=='personal' && !user?.contexts?.some(c=>c.organization_id===context))return;
    setActiveContext(context);
    if(demoMode)AsyncStorage.setItem(DEMO_SESSION_KEY,JSON.stringify({token,user,activeContext:context})).catch(()=>{});
  }

  async function logout() {
    if(!demoMode && token) await api('/auth/logout',{token,method:'POST'}).catch(()=>{});
    setActiveContext('personal');
    setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(DEMO_SESSION_KEY),
      SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
    ]);
  }

  const value = useMemo(() => ({
    token,
    user,
    isReady,
    demoMode,
    setDemoMode,
    activeContext,
    switchContext,
    register,
    login,
    loginDemo,
    logout,
  }), [isReady, token, user,activeContext,demoMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
