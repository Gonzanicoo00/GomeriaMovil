import { TextStyle } from 'react-native';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  background: string;
  surface: string;
  /** Superficie que flota sobre otra (paneles, tarjetas destacadas). En oscuro es mas clara que surface. */
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  /** Texto e iconos sobre fondos de color primario o de estado. */
  onPrimary: string;
  /** Degradado de los encabezados de marca. */
  heroStart: string;
  heroEnd: string;
  /** Fondo oscurecido detras de modales y paneles. */
  overlay: string;
}

export const lightColors: ThemeColors = {
  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryLight: '#FFF7ED',
  secondary: '#1E293B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  onPrimary: '#FFFFFF',
  heroStart: '#F97316',
  heroEnd: '#C2410C',
  overlay: 'rgba(15,23,42,0.45)',
};

export const darkColors: ThemeColors = {
  primary: '#FB923C',
  primaryDark: '#EA580C',
  primaryLight: 'rgba(251,146,60,0.16)',
  secondary: '#F1F5F9',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#273449',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  success: '#4ADE80',
  successLight: 'rgba(74,222,128,0.16)',
  danger: '#F87171',
  dangerLight: 'rgba(248,113,113,0.18)',
  warning: '#FBBF24',
  warningLight: 'rgba(251,191,36,0.16)',
  info: '#60A5FA',
  infoLight: 'rgba(96,165,250,0.16)',
  onPrimary: '#FFFFFF',
  heroStart: '#EA580C',
  heroEnd: '#9A3412',
  overlay: 'rgba(2,6,23,0.6)',
};

export const estadoLabel: Record<string, string> = {
  pendiente: 'Buscando gomero',
  asignada: 'Gomero asignado',
  en_camino: 'Gomero en camino',
  en_proceso: 'Servicio en proceso',
  completada: 'Completado',
  cancelada: 'Cancelado',
};

export const estadoIcon: Record<string, string> = {
  pendiente: 'time-outline',
  asignada: 'checkmark-circle-outline',
  en_camino: 'navigate-outline',
  en_proceso: 'construct-outline',
  completada: 'checkmark-done-circle-outline',
  cancelada: 'close-circle-outline',
};

export function estadoColorFor(colors: ThemeColors, estado: string): string {
  const mapa: Record<string, string> = {
    pendiente: colors.warning,
    asignada: colors.info,
    en_camino: colors.info,
    en_proceso: colors.primary,
    completada: colors.success,
    cancelada: colors.danger,
  };
  return mapa[estado] ?? colors.textMuted;
}

/** Fondo suave para las etiquetas de estado (texto de color sobre fondo claro). */
export function estadoFondoFor(colors: ThemeColors, estado: string): string {
  const mapa: Record<string, string> = {
    pendiente: colors.warningLight,
    asignada: colors.infoLight,
    en_camino: colors.infoLight,
    en_proceso: colors.primaryLight,
    completada: colors.successLight,
    cancelada: colors.dangerLight,
  };
  return mapa[estado] ?? colors.border;
}

// Las tarjetas se separan del fondo con el borde; la sombra de `card` es apenas perceptible
// (y en Android no hay elevation) para no mezclar borde y sombra. `raised` es para lo que flota.
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 0,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
};

// Escala de espaciados: usar siempre estos valores para margenes, paddings y gaps.
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// Nombres de las fuentes cargadas en App.tsx con useFonts.
// Con fuentes custom no se usa fontWeight: cada peso es una familia distinta.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  title: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  captionStrong: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  /** Solo para etiquetas cortas (pasos del timeline, chips chicos). */
  micro: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
} satisfies Record<string, TextStyle>;

/** Numeros de ancho fijo: precios, distancias y tiempos no "bailan" al cambiar. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
