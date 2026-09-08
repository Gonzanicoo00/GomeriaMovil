import { apiClient } from './client';
import { Bonificacion, Calificacion, GomeroPerfil } from '../types';

export async function actualizarUbicacion(latitud: number, longitud: number) {
  const res = await apiClient.put<{ data: GomeroPerfil }>('/gomeros/ubicacion', { latitud, longitud });
  return res.data.data;
}

export async function actualizarDisponibilidad(disponible: boolean) {
  const res = await apiClient.put<{ data: GomeroPerfil }>('/gomeros/disponibilidad', { disponible });
  return res.data.data;
}

export async function gomerosCercanos(lat: number, lng: number) {
  const res = await apiClient.get<{ data: GomeroPerfil[] }>('/gomeros/cercanos', { params: { lat, lng } });
  return res.data.data;
}

export async function calificacionesDe(usuarioId: number) {
  const res = await apiClient.get<{ data: Calificacion[] }>(`/gomeros/${usuarioId}/calificaciones`);
  return res.data.data;
}

export async function misBonificaciones() {
  const res = await apiClient.get<{ data: Bonificacion[] }>('/gomeros/bonificaciones');
  return res.data.data;
}
