import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedRegion, MapMarker, Marker, MarkerAnimated, MapStyleElement } from 'react-native-maps';
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
        <View style={[styles.pin, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
          <Ionicons name="person" size={16} color={colors.onPrimary} />
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

// Un poco menos que el intervalo del polling de tracking (3 s): el pin llega justo antes de la siguiente posicion.
const DURACION_MOVIMIENTO = 2800;

/**
 * Igual que GomeroPin, pero cuando cambia la coordenada el pin se desliza hasta la nueva posicion
 * en lugar de saltar. En Android se usa la animacion nativa del marcador; en iOS, AnimatedRegion.
 */
export function GomeroPinAnimado({ coordinate, title }: PinProps) {
  const { colors } = useTheme();
  const markerRef = useRef<MapMarker>(null);
  const region = useRef(new AnimatedRegion({ ...coordinate, latitudeDelta: 0, longitudeDelta: 0 })).current;
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (Platform.OS === 'android') {
      markerRef.current?.animateMarkerToCoordinate(coordinate, DURACION_MOVIMIENTO);
    } else {
      region
        .timing({ ...coordinate, latitudeDelta: 0, longitudeDelta: 0, duration: DURACION_MOVIMIENTO, useNativeDriver: false, toValue: 0 } as any)
        .start();
    }
  }, [coordinate.latitude, coordinate.longitude]);

  return (
    <MarkerAnimated ref={markerRef as any} coordinate={region as any} title={title} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={[styles.pin, styles.pinGomero, { backgroundColor: colors.secondary, borderColor: colors.surface }]}>
        <MaterialCommunityIcons name="car-wrench" size={20} color={colors.background} />
      </View>
    </MarkerAnimated>
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
