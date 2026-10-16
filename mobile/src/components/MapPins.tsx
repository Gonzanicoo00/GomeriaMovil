import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker, MapStyleElement } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { shadow } from '../theme';

interface PinProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
}

/** Marcador del cliente: pin redondo naranja con una persona. */
export function ClientePin({ coordinate, title }: PinProps) {
  const { colors } = useTheme();
  return (
    <Marker coordinate={coordinate} title={title} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={[styles.halo, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.pin, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      </View>
    </Marker>
  );
}

/** Marcador del gomero: auto con llave, en el color secundario del tema. */
export function GomeroPin({ coordinate, title }: PinProps) {
  const { colors } = useTheme();
  return (
    <Marker coordinate={coordinate} title={title} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={[styles.pin, styles.pinGomero, { backgroundColor: colors.secondary, borderColor: colors.surface }]}>
        <MaterialCommunityIcons name="car-wrench" size={20} color={colors.background} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  pinGomero: { width: 42, height: 42, borderRadius: 21 },
});

// Estilos de Google Maps (Android): se ocultan comercios y transporte para que solo resalten los dos puntos.
const BASE_LIMPIO: MapStyleElement[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

export const mapStyleClaro: MapStyleElement[] = [
  ...BASE_LIMPIO,
  { elementType: 'geometry', stylers: [{ color: '#f5f5f4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fdfcfb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde3cf' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe3f2' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
];

export const mapStyleOscuro: MapStyleElement[] = [
  ...BASE_LIMPIO,
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#7c2d12' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
];
