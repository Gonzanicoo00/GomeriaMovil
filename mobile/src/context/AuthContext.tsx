import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../api/client';
import * as AuthApi from '../api/auth';
import { Rol, Usuario } from '../types';
import { dispositivoProtegido } from '../security/biometria';

/** Si la app estuvo en segundo plano mas que esto, se vuelve a pedir huella o PIN. */
const BLOQUEO_TRAS_MS = 5 * 60 * 1000;

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  /** La sesion esta guardada pero hay que confirmar con huella o PIN antes de mostrarla. */
  bloqueado: boolean;
  desbloquear: () => void;
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
  const [bloqueado, setBloqueado] = useState(false);
  const enSegundoPlanoDesde = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        try {
          const user = await AuthApi.me();
          // La sesion quedo guardada de una vez anterior: se pide huella o PIN para entrar.
          if (await dispositivoProtegido()) setBloqueado(true);
          setUsuario(user);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      setCargando(false);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (estado) => {
      if (estado === 'background') {
        enSegundoPlanoDesde.current = Date.now();
        return;
      }
      if (estado !== 'active') return;
      const desde = enSegundoPlanoDesde.current;
      enSegundoPlanoDesde.current = null;
      if (usuario && desde && Date.now() - desde > BLOQUEO_TRAS_MS && (await dispositivoProtegido())) {
        setBloqueado(true);
      }
    });
    return () => sub.remove();
  }, [usuario]);

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
    setBloqueado(false);
    setUsuario(null);
  };

  const desbloquear = () => setBloqueado(false);

  const refrescarUsuario = async () => {
    const user = await AuthApi.me();
    setUsuario(user);
  };

  const value = useMemo(
    () => ({ usuario, cargando, bloqueado, desbloquear, login, registrar, logout, refrescarUsuario }),
    [usuario, cargando, bloqueado]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
