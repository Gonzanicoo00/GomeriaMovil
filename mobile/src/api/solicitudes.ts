import { apiClient } from './client';
import { EstadoSolicitud, Solicitud } from '../types';

export async function crearSolicitud(payload: {
  servicio_id: number;
  latitud: number;
  longitud: number;
  direccion?: string;
  descripcion?: string;
}) {
  const res = await apiClient.post<{ data: Solicitud }>('/solicitudes', payload);
  return res.data.data;
}

export async function misSolicitudes() {
  const res = await apiClient.get<{ data: Solicitud[] }>('/solicitudes');
  return res.data.data;
}

export async function solicitudesDisponibles() {
  const res = await apiClient.get<{ data: Solicitud[] }>('/solicitudes/disponibles');
  return res.data.data;
}

export async function verSolicitud(id: number) {
  const res = await apiClient.get<{ data: Solicitud }>(`/solicitudes/${id}`);
  return res.data.data;
}

export async function aceptarSolicitud(id: number) {
  const res = await apiClient.post<{ data: Solicitud }>(`/solicitudes/${id}/aceptar`);
  return res.data.data;
}

export async function cambiarEstadoSolicitud(
  id: number,
  estado: EstadoSolicitud,
  extra?: { precio_final?: number; motivo_cancelacion?: string }
) {
  const res = await apiClient.put<{ data: Solicitud }>(`/solicitudes/${id}/estado`, {
    estado,
    ...extra,
  });
  return res.data.data;
}

export async function calificarSolicitud(id: number, puntuacion: number, comentario?: string) {
  await apiClient.post(`/solicitudes/${id}/calificacion`, { puntuacion, comentario });
}
