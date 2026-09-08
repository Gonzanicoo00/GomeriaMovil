import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../api/client';
import * as AuthApi from '../api/auth';
import { Rol, Usuario } from '../types';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  registrar: (payload: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    telefono?: string;
    rol: Rol;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        try {
          const user = await AuthApi.me();
          setUsuario(user);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      setCargando(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { usuario: user, token } = await AuthApi.login(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setUsuario(user);
  };

  const registrar: AuthContextValue['registrar'] = async (payload) => {
    const { usuario: user, token } = await AuthApi.register(payload);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setUsuario(user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUsuario(null);
  };

  const refrescarUsuario = async () => {
    const user = await AuthApi.me();
    setUsuario(user);
  };

  const value = useMemo(
    () => ({ usuario, cargando, login, registrar, logout, refrescarUsuario }),
    [usuario, cargando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
