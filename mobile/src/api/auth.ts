import { apiClient } from './client';
import { Rol, Usuario } from '../types';

interface AuthResponse {
  data: {
    usuario: Usuario;
    token: string;
  };
}

export async function login(email: string, password: string) {
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return res.data.data;
}

export async function register(payload: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol: Rol;
}) {
  const res = await apiClient.post<AuthResponse>('/auth/register', payload);
  return res.data.data;
}

export async function me() {
  const res = await apiClient.get<{ data: Usuario }>('/auth/me');
  return res.data.data;
}
