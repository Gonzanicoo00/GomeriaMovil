export type AuthStackParamList = {
  Login: undefined;
  Register: { aceptoTerminos?: boolean } | undefined;
  Terminos: undefined;
};

export type ChatParams = {
  solicitudId: number;
  nombre?: string;
  apellido?: string;
  /** Quien es la otra persona, para el subtitulo del encabezado ("Tu gomero", "Cliente"). */
  rol: string;
  telefono?: string | null;
  activo: boolean;
};

export type ClienteStackParamList = {
  ClienteHome: undefined;
  NuevaSolicitud: { servicioId: number };
  SolicitudDetalle: { solicitudId: number };
  Historial: undefined;
  Chat: ChatParams;
};

export type GomeroStackParamList = {
  GomeroHome: undefined;
  MiPerfil: undefined;
  SolicitudActiva: { solicitudId: number };
  Historial: undefined;
  Chat: ChatParams;
};
