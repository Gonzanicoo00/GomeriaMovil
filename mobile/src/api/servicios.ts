import { apiClient } from './client';
import { Servicio } from '../types';

export async function listarServicios() {
  const res = await apiClient.get<{ data: Servicio[] }>('/servicios');
  return res.data.data;
}
