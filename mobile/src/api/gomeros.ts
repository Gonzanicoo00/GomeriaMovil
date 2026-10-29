import { apiClient } from './client';
import { Bonificacion, Calificacion, GomeroPerfil, Usuario } from '../types';
import { RegistroPayload } from './auth';

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

/** Foto del vehículo de un gomero en base64 (JPEG). */
export async function fotoVehiculo(usuarioId: number) {
  const res = await apiClient.get<{ data: { foto: string } }>(`/gomeros/${usuarioId}/vehiculo-foto`);
  return res.data.data.foto;
}

/** El gomero edita sus datos y los de su vehículo. Sin foto nueva, se conserva la guardada. */
export async function actualizarPerfil(payload: {
  nombre: string;
  apellido: string;
  telefono: string;
  vehiculo: NonNullable<RegistroPayload['vehiculo']>;
}) {
  const res = await apiClient.put<{ data: Usuario }>('/gomeros/perfil', payload);
  return res.data.data;
}
