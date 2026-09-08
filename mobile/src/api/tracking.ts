import { apiClient } from './client';
import { UbicacionTracking } from '../types';

export async function enviarTracking(solicitudId: number, latitud: number, longitud: number) {
  await apiClient.post(`/solicitudes/${solicitudId}/tracking`, { latitud, longitud });
}

export async function ultimaPosicion(solicitudId: number) {
  const res = await apiClient.get<{ data: UbicacionTracking }>(`/solicitudes/${solicitudId}/tracking`);
  return res.data.data;
}
