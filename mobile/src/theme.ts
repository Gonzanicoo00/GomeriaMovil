export const colors = {
  primary: '#EA580C',
  primaryDark: '#C2410C',
  secondary: '#1E293B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
};

export const estadoColor: Record<string, string> = {
  pendiente: colors.warning,
  asignada: '#2563EB',
  en_camino: '#2563EB',
  en_proceso: colors.primary,
  completada: colors.success,
  cancelada: colors.danger,
};

export const estadoLabel: Record<string, string> = {
  pendiente: 'Buscando gomero',
  asignada: 'Gomero asignado',
  en_camino: 'Gomero en camino',
  en_proceso: 'Servicio en proceso',
  completada: 'Completado',
  cancelada: 'Cancelado',
};
