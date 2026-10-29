import { apiClient } from './client';
import { Rol, TipoVehiculo, Usuario } from '../types';

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

export interface RegistroPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol: Rol;
  acepta_terminos: boolean;
  terminos_version: string;
  /** Obligatorio para los gomeros. */
  vehiculo?: {
    tipo: TipoVehiculo;
    marca_modelo: string;
    color: string;
    patente: string;
    /** JPEG en base64, sin el prefijo data:. Obligatoria al registrarse. */
    foto?: string;
  };
}

export async function register(payload: RegistroPayload) {
  const res = await apiClient.post<AuthResponse>('/auth/register', payload);
  return res.data.data;
}

export async function me() {
  const res = await apiClient.get<{ data: Usuario }>('/auth/me');
  return res.data.data;
}
