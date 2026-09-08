import { apiClient } from './client';
import { Mensaje } from '../types';

export async function listarMensajes(solicitudId: number, sinceId = 0) {
  const res = await apiClient.get<{ data: Mensaje[] }>(`/solicitudes/${solicitudId}/mensajes`, {
    params: sinceId ? { since_id: sinceId } : undefined,
  });
  return res.data.data;
}

export async function enviarMensaje(solicitudId: number, contenido: string) {
  const res = await apiClient.post<{ data: Mensaje }>(`/solicitudes/${solicitudId}/mensajes`, { contenido });
  return res.data.data;
}
