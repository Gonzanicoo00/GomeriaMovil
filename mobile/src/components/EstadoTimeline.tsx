import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, estadoLabel, radius, shadow, spacing, typography } from '../theme';
import { EstadoSolicitud } from '../types';

const PASOS: { estado: EstadoSolicitud; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { estado: 'pendiente', label: 'Buscando', icon: 'search' },
  { estado: 'asignada', label: 'Asignado', icon: 'person' },
  { estado: 'en_camino', label: 'En camino', icon: 'navigate' },
  { estado: 'en_proceso', label: 'Trabajando', icon: 'construct' },
  { estado: 'completada', label: 'Listo', icon: 'checkmark' },
];

export const DESCRIPCION_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'Estamos buscando un gomero disponible cerca tuyo.',
  asignada: 'Un gomero aceptó tu pedido y se está preparando.',
  en_camino: 'Tu gomero va en camino. Podés seguirlo en el mapa.',
  en_proceso: 'El gomero está trabajando en tu vehículo.',
  completada: 'El servicio terminó. ¡Gracias por usar Gomería Móvil!',
  cancelada: 'Esta solicitud fue cancelada.',
};

interface Props {
  estado: EstadoSolicitud;
  /** Sin tarjeta ni titulo: solo los pasos (para usar dentro de otro contenedor). */
  soloPasos?: boolean;
}

const CIRCULO = 30;
const ANILLO = CIRCULO + 10;

/** Estado de la solicitud como linea de tiempo por pasos, con el avance animado. */
export function EstadoTimeline({ estado, soloPasos = false }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const actual = PASOS.findIndex((p) => p.estado === estado);
  const progreso = useSharedValue(Math.max(actual, 0));
  const pulso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withTiming(Math.max(actual, 0), { duration: 700, easing: Easing.inOut(Easing.cubic) });
  }, [actual, progreso]);

  useEffect(() => {
    pulso.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.out(Easing.ease) }), -1, false);
  }, [pulso]);

  // La barra va del centro del primer paso al centro del ultimo (10% a 90% del ancho).
  const relleno = useAnimatedStyle(() => ({ width: `${(progreso.value / (PASOS.length - 1)) * 80}%` }));
  const halo = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulso.value),
    transform: [{ scale: 0.8 + 0.5 * pulso.value }],
  }));

  if (estado === 'cancelada') {
    return (
      <View style={[!soloPasos && styles.card, styles.cancelada]}>
        <View style={[styles.canceladaIcono, { backgroundColor: colors.dangerLight }]}>
          <Ionicons name="close" size={22} color={colors.danger} />
        </View>
        <View style={styles.canceladaTexto}>
          <Text style={styles.titulo}>{estadoLabel.cancelada}</Text>
          <Text style={styles.descripcion}>{DESCRIPCION_ESTADO.cancelada}</Text>
        </View>
      </View>
    );
  }

  const pasos = (
    <View style={[styles.pasos, !soloPasos && styles.pasosConTitulo]}>
      <View style={[styles.pista, styles.pistaFondo]} />
      <Animated.View style={[styles.pista, styles.pistaRelleno, relleno]} />
      {PASOS.map((paso, i) => {
        const hecho = i < actual || estado === 'completada';
        const esActual = i === actual && estado !== 'completada';
        const activo = hecho || esActual;

        return (
          <View key={paso.estado} style={styles.paso}>
            <View style={styles.anillo}>
              {esActual && <Animated.View style={[styles.halo, halo]} />}
              {/* la key cambia al activarse para que el circulo "entre" con un zoom */}
              <Animated.View
                key={activo ? 'activo' : 'inactivo'}
                entering={activo ? ZoomIn.duration(300) : undefined}
                style={[styles.circulo, activo && styles.circuloActivo]}
              >
                <Ionicons
                  name={hecho ? 'checkmark' : paso.icon}
                  size={14}
                  color={activo ? colors.onPrimary : colors.textMuted}
                />
              </Animated.View>
            </View>
            <Text
              style={[styles.label, activo && { color: colors.text }, esActual && styles.labelActual]}
              numberOfLines={1}
            >
              {paso.label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  if (soloPasos) return pasos;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>{estadoLabel[estado]}</Text>
      <Text style={styles.descripcion}>{DESCRIPCION_ESTADO[estado]}</Text>
      {pasos}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...shadow.card,
    },
    titulo: { ...typography.heading, color: colors.text },
    descripcion: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    pasos: { flexDirection: 'row' },
    pasosConTitulo: { marginTop: spacing.xl },
    pista: {
      position: 'absolute',
      top: ANILLO / 2 - 1.5,
      left: '10%',
      height: 3,
      borderRadius: 2,
    },
    pistaFondo: { right: '10%', backgroundColor: colors.border },
    pistaRelleno: { backgroundColor: colors.primary },
    paso: { flex: 1, alignItems: 'center' },
    anillo: {
      width: ANILLO,
      height: ANILLO,
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: {
      position: 'absolute',
      width: ANILLO,
      height: ANILLO,
      borderRadius: ANILLO / 2,
      backgroundColor: colors.primary,
    },
    circulo: {
      width: CIRCULO,
      height: CIRCULO,
      borderRadius: CIRCULO / 2,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circuloActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
    label: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
    labelActual: { fontFamily: typography.captionStrong.fontFamily, color: colors.primary },
    cancelada: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    canceladaIcono: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    canceladaTexto: { flex: 1 },
  });
