import React, { createContext, useContext, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  async function register(payload) {
    // --- BLOCO DE TESTE (Pula a requisição de cadastro no DEV) ---
    if (__DEV__) {
      console.warn("🔥 [DEV] Cadastro pulado! Usando usuário fake.");
      const fakeToken = "token-fake-register-123";
      const fakeUser = {
        id: 1,
        name: "Usuário Registrado Teste",
        email: payload.email || "teste@email.com",
        profile_type: payload.profileType || "PERSON"
      };

      setToken(fakeToken);
      setUser(fakeUser);
      await SecureStore.setItemAsync('token', fakeToken).catch(() => {});
      return;
    }
    // --- FIM DO BLOCO DE TESTE ---

    const data = await api('/auth/register', { method: 'POST', body: payload });
    setToken(data.token);
    setUser(data.user);
    await SecureStore.setItemAsync('token', data.token);
  }

  async function login(email, password) {
    // --- BLOCO DE TESTE (Pula a requisição de login no DEV) ---
    if (__DEV__) {
      console.warn("🔥 [DEV] Login pulado! Usando usuário fake.");
      const fakeToken = "token-fake-login-123";
      const fakeUser = {
        id: 1,
        name: "Usuário de Teste",
        email: email || "teste@email.com",
        profile_type: "PERSON"
      };

      setToken(fakeToken);
      setUser(fakeUser);
      await SecureStore.setItemAsync('token', fakeToken).catch(() => {});
      return;
    }
    // --- FIM DO BLOCO DE TESTE ---

    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setToken(data.token);
    setUser(data.user);
    await SecureStore.setItemAsync('token', data.token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    SecureStore.deleteItemAsync('token');
  }

  const value = useMemo(() => ({
    token,
    user,
    register,
    login,
    logout
  }), [token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
