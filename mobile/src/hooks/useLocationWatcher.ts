import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Se suscribe a actualizaciones continuas de GPS (no polling por timer) mientras `enabled` sea true.
 * Se dispara cada vez que el dispositivo se mueve `distanceInterval` metros o pasan `timeInterval` ms,
 * lo que da una sensacion de tracking en tiempo real en vez de una foto cada X segundos.
 */
export function useLocationWatcher(enabled: boolean, onUpdate: (coords: Coords) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelado = false;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 10,
        },
        (pos) => {
          if (!cancelado) {
            onUpdateRef.current({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        }
      );

      if (cancelado) {
        sub.remove();
      } else {
        subscription = sub;
      }
    })();

    return () => {
      cancelado = true;
      subscription?.remove();
    };
  }, [enabled]);
}
