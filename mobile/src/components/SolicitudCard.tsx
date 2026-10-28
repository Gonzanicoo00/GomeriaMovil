import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Solicitud } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, estadoColorFor, estadoFondoFor, estadoIcon, estadoLabel, radius, shadow, spacing, tabular, typography } from '../theme';
import { formatPrecio, formatRelativeTime } from '../utils/format';
import { Avatar } from './Avatar';
import { PressableScale } from './Animated';

interface Props {
  solicitud: Solicitud;
  onPress: () => void;
  mostrarCliente?: boolean;
}

export function SolicitudCard({ solicitud, onPress, mostrarCliente }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const persona = mostrarCliente
    ? { nombre: solicitud.cliente_nombre, apellido: solicitud.cliente_apellido }
    : { nombre: solicitud.gomero_nombre, apellido: solicitud.gomero_apellido };

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        {persona.nombre ? <Avatar nombre={persona.nombre} apellido={persona.apellido} size={40} /> : null}

        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.servicio} numberOfLines={1}>
              {solicitud.servicio_nombre}
            </Text>
          </View>

          {persona.nombre ? (
            <Text style={styles.linea} numberOfLines={1}>
              {mostrarCliente ? 'Cliente' : 'Gomero'}: {persona.nombre} {persona.apellido}
            </Text>
          ) : null}

          {solicitud.direccion ? (
            <View style={styles.lineaConIcono}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.linea} numberOfLines={1}>{solicitud.direccion}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.badge, { backgroundColor: estadoFondoFor(colors, solicitud.estado) }]}>
          <Ionicons name={estadoIcon[solicitud.estado] as any} size={13} color={estadoColorFor(colors, solicitud.estado)} />
          <Text style={[styles.badgeText, { color: estadoColorFor(colors, solicitud.estado) }]}>
            {estadoLabel[solicitud.estado]}
          </Text>
        </View>

        <View style={styles.footerDerecha}>
          {typeof solicitud.distancia_km === 'number' && (
            <Text style={styles.distancia}>{solicitud.distancia_km.toFixed(1)} km</Text>
          )}
          {solicitud.estado === 'completada' && solicitud.precio_final ? (
            <Text style={styles.distancia}>{formatPrecio(solicitud.precio_final)}</Text>
          ) : null}
          <Text style={styles.fecha}>{formatRelativeTime(solicitud.fecha_solicitud)}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    info: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    servicio: { ...typography.subheading, color: colors.text, flexShrink: 1 },
    lineaConIcono: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    linea: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs, flexShrink: 1 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm + spacing.xxs,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
    },
    badgeText: { ...typography.captionStrong },
    footerDerecha: { alignItems: 'flex-end' },
    distancia: { ...typography.captionStrong, ...tabular, color: colors.primary },
    fecha: { ...typography.caption, ...tabular, color: colors.textMuted, marginTop: spacing.xxs },
  });
