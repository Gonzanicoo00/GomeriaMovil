import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Solicitud } from '../types';
import { colors, estadoColor, estadoLabel } from '../theme';

interface Props {
  solicitud: Solicitud;
  onPress: () => void;
  mostrarCliente?: boolean;
}

export function SolicitudCard({ solicitud, onPress, mostrarCliente }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.servicio}>{solicitud.servicio_nombre}</Text>
        <View style={[styles.badge, { backgroundColor: estadoColor[solicitud.estado] }]}>
          <Text style={styles.badgeText}>{estadoLabel[solicitud.estado]}</Text>
        </View>
      </View>

      {mostrarCliente && solicitud.cliente_nombre ? (
        <Text style={styles.linea}>Cliente: {solicitud.cliente_nombre} {solicitud.cliente_apellido}</Text>
      ) : null}

      {!mostrarCliente && solicitud.gomero_nombre ? (
        <Text style={styles.linea}>Gomero: {solicitud.gomero_nombre} {solicitud.gomero_apellido}</Text>
      ) : null}

      {solicitud.direccion ? <Text style={styles.linea}>{solicitud.direccion}</Text> : null}
      {typeof solicitud.distancia_km === 'number' ? (
        <Text style={styles.distancia}>{solicitud.distancia_km.toFixed(1)} km</Text>
      ) : null}

      <Text style={styles.fecha}>{new Date(solicitud.fecha_solicitud).toLocaleString()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  servicio: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  linea: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  distancia: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 4 },
  fecha: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
});
