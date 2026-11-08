import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './config';

export const TOKEN_KEY = 'gomeria_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // 60 s: el plan gratis de Render tarda ~50 s en despertar el servidor
  // si estuvo 15 minutos sin uso.
  timeout: 60000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.message === 'Network Error') {
      return 'No se pudo conectar con el servidor. Revisa tu conexion o la IP configurada.';
    }
  }
  return 'Ocurrio un error inesperado';
}
