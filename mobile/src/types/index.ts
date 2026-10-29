export type Rol = 'cliente' | 'gomero' | 'admin';

export type TipoVehiculo = 'moto' | 'auto' | 'camioneta';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  foto_perfil: string | null;
  activo: number;
  gomero?: GomeroPerfil;
}

export interface GomeroPerfil {
  id: number;
  usuario_id: number;
  nombre_taller: string | null;
  descripcion: string | null;
  latitud: string | null;
  longitud: string | null;
  direccion: string | null;
  disponible: number;
  radio_cobertura_km: string;
  calificacion_promedio: string;
  total_servicios: number;
  documento_verificado: number;
  vehiculo_tipo: TipoVehiculo | null;
  vehiculo_marca_modelo: string | null;
  vehiculo_color: string | null;
  vehiculo_patente: string | null;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: string;
  icono: string | null;
  activo: number;
}

export type EstadoSolicitud =
  | 'pendiente'
  | 'asignada'
  | 'en_camino'
  | 'en_proceso'
  | 'completada'
  | 'cancelada';

export interface Solicitud {
  id: number;
  cliente_id: number;
  gomero_id: number | null;
  servicio_id: number;
  estado: EstadoSolicitud;
  descripcion: string | null;
  latitud: string;
  longitud: string;
  direccion: string | null;
  precio_estimado: string | null;
  precio_final: string | null;
  metodo_pago: string | null;
  motivo_cancelacion: string | null;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  fecha_inicio: string | null;
  fecha_completado: string | null;
  servicio_nombre?: string;
  servicio_icono?: string | null;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_telefono?: string | null;
  gomero_nombre?: string;
  gomero_apellido?: string;
  gomero_telefono?: string | null;
  vehiculo_tipo?: TipoVehiculo | null;
  vehiculo_marca_modelo?: string | null;
  vehiculo_color?: string | null;
  vehiculo_patente?: string | null;
  /** 1 si el gomero asignado cargó foto del vehículo (se pide aparte con fotoVehiculo). */
  vehiculo_tiene_foto?: number;
  distancia_km?: number;
}

export interface Mensaje {
  id: number;
  solicitud_id: number;
  remitente_id: number;
  contenido: string;
  leido: number;
  created_at: string;
  remitente_nombre?: string;
  remitente_rol?: Rol;
}

export interface Calificacion {
  id: number;
  solicitud_id: number;
  calificador_id: number;
  calificado_id: number;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
  calificador_nombre?: string;
  calificador_apellido?: string;
}

export interface Bonificacion {
  id: number;
  gomero_id: number;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  monto: string;
  estado: 'activa' | 'usada' | 'expirada';
  fecha_otorgada: string;
  fecha_expiracion: string | null;
}

export interface UbicacionTracking {
  id: number;
  solicitud_id: number;
  gomero_id: number;
  latitud: string;
  longitud: string;
  registrado_en: string;
}

export interface ApiError {
  error: string;
  errores?: Record<string, string[]>;
}
