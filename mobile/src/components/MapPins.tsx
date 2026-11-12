import React, { useEffect, useRef, useState } from 'react';
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
// Si la nueva posicion esta muy lejos (primer dato real, GPS que se recupero) se salta en vez de deslizar.
const SALTO_GRADOS = 0.01;
// Cuadros por segundo de la animacion del pin: suficiente para que se vea fluido sin recargar el hilo de JS.
const FPS = 30;

/**
 * Coordenada que se desliza suavemente hacia `destino` cada vez que cambia.
 * Se interpola en JS (en vez de MarkerAnimated / animateMarkerToCoordinate) porque con la nueva
 * arquitectura de React Native esos caminos pueden devolver el marcador a su posicion inicial o dejarlo
 * sin dibujar, y el pin del gomero "desaparecia" del mapa.
 */
function useCoordenadaSuave(destino: { latitude: number; longitude: number }) {
  const [actual, setActual] = useState(destino);
  const actualRef = useRef(destino);

  useEffect(() => {
    const desde = actualRef.current;
    const dLat = destino.latitude - desde.latitude;
    const dLng = destino.longitude - desde.longitude;
    if (dLat === 0 && dLng === 0) return;

    if (Math.abs(dLat) > SALTO_GRADOS || Math.abs(dLng) > SALTO_GRADOS) {
      actualRef.current = destino;
      setActual(destino);
      return;
    }

    const inicio = Date.now();
    const paso = () => {
      const t = Math.min(1, (Date.now() - inicio) / DURACION_MOVIMIENTO);
      const e = t * (2 - t); // ease-out
      const punto = { latitude: desde.latitude + dLat * e, longitude: desde.longitude + dLng * e };
      actualRef.current = punto;
      setActual(punto);
      if (t >= 1) clearInterval(id);
    };
    const id = setInterval(paso, 1000 / FPS);
    return () => clearInterval(id);
  }, [destino.latitude, destino.longitude]);

  return actual;
}

/**
 * Igual que GomeroPin, pero cuando cambia la coordenada el pin se desliza hasta la nueva posicion
 * en lugar de saltar. Siempre queda montado y por encima de las rutas.
 */
export function GomeroPinAnimado({ coordinate, title }: PinProps) {
  const { colors } = useTheme();
  const posicion = useCoordenadaSuave(coordinate);

  // En Android el marcador se dibuja como una imagen: se deja que se actualice un momento al montar
  // (y si cambia el tema) para que capture el icono, y despues se congela para que no parpadee.
  const [redibujar, setRedibujar] = useState(true);
  useEffect(() => {
    setRedibujar(true);
    const id = setTimeout(() => setRedibujar(false), 800);
    return () => clearTimeout(id);
  }, [colors.secondary, colors.surface, colors.background]);

  return (
    <Marker
      coordinate={posicion}
      title={title}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={redibujar}
      zIndex={10}
    >
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
