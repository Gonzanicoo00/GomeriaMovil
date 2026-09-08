export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ClienteStackParamList = {
  ClienteHome: undefined;
  NuevaSolicitud: { servicioId: number };
  SolicitudDetalle: { solicitudId: number };
  Historial: undefined;
};

export type GomeroStackParamList = {
  GomeroHome: undefined;
  SolicitudActiva: { solicitudId: number };
  Historial: undefined;
};
