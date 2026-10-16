import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const DESCRIPCION: Record<EstadoSolicitud, string> = {
  pendiente: 'Estamos buscando un gomero disponible cerca tuyo.',
  asignada: 'Un gomero aceptó tu pedido y se está preparando.',
  en_camino: 'Tu gomero va en camino. Podés seguirlo en el mapa.',
  en_proceso: 'El gomero está trabajando en tu vehículo.',
  completada: 'El servicio terminó. ¡Gracias por usar Gomería Móvil!',
  cancelada: 'Esta solicitud fue cancelada.',
};

interface Props {
  estado: EstadoSolicitud;
}

/** Estado de la solicitud como linea de tiempo por pasos. */
export function EstadoTimeline({ estado }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (estado === 'cancelada') {
    return (
      <View style={[styles.card, styles.cancelada]}>
        <View style={[styles.canceladaIcono, { backgroundColor: colors.dangerLight }]}>
          <Ionicons name="close" size={22} color={colors.danger} />
        </View>
        <View style={styles.canceladaTexto}>
          <Text style={styles.titulo}>{estadoLabel.cancelada}</Text>
          <Text style={styles.descripcion}>{DESCRIPCION.cancelada}</Text>
        </View>
      </View>
    );
  }

  const actual = PASOS.findIndex((p) => p.estado === estado);

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>{estadoLabel[estado]}</Text>
      <Text style={styles.descripcion}>{DESCRIPCION[estado]}</Text>

      <View style={styles.pasos}>
        {PASOS.map((paso, i) => {
          const hecho = i < actual || estado === 'completada';
          const esActual = i === actual && estado !== 'completada';
          const activo = hecho || esActual;

          return (
            <View key={paso.estado} style={styles.paso}>
              {i > 0 && (
                <View style={[styles.linea, styles.lineaIzq, i <= actual && { backgroundColor: colors.primary }]} />
              )}
              {i < PASOS.length - 1 && (
                <View style={[styles.linea, styles.lineaDer, i < actual && { backgroundColor: colors.primary }]} />
              )}
              <View style={[styles.anillo, esActual && { borderColor: colors.primaryLight }]}>
                <View
                  style={[
                    styles.circulo,
                    activo && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name={hecho ? 'checkmark' : paso.icon}
                    size={14}
                    color={activo ? '#fff' : colors.textMuted}
                  />
                </View>
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
    </View>
  );
}

const CIRCULO = 30;
const ANILLO = CIRCULO + 10;

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
    pasos: { flexDirection: 'row', marginTop: spacing.xl },
    paso: { flex: 1, alignItems: 'center' },
    linea: {
      position: 'absolute',
      top: ANILLO / 2 - 1,
      height: 2,
      backgroundColor: colors.border,
    },
    lineaIzq: { left: 0, right: '50%' },
    lineaDer: { left: '50%', right: 0 },
    anillo: {
      width: ANILLO,
      height: ANILLO,
      borderRadius: ANILLO / 2,
      borderWidth: 5,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    circulo: {
      width: CIRCULO,
      height: CIRCULO,
      borderRadius: CIRCULO / 2,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
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
