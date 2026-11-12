import { apiClient } from './client';
import { UbicacionTracking } from '../types';

export async function enviarTracking(solicitudId: number, latitud: number, longitud: number) {
  await apiClient.post(`/solicitudes/${solicitudId}/tracking`, { latitud, longitud });
}

export async function ultimaPosicion(solicitudId: number) {
  const res = await apiClient.get<{ data: UbicacionTracking }>(`/solicitudes/${solicitudId}/tracking`);
  return res.data.data;
}

export interface PuntoRecorrido {
  id: number;
  latitud: string;
  longitud: string;
  registrado_en: string;
}

/** Recorrido del gomero para la solicitud. Con `desdeId` trae solo las posiciones nuevas. */
export async function recorrido(solicitudId: number, desdeId = 0) {
  const res = await apiClient.get<{ data: PuntoRecorrido[] }>(`/solicitudes/${solicitudId}/tracking/historial`, {
    params: desdeId ? { desde: desdeId } : undefined,
  });
  return res.data.data;
}
