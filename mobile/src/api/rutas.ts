import { Coords } from '../hooks/useLocationWatcher';

// Servidor de rutas OSRM (OpenStreetMap). Calcula el camino más rápido por calles para un auto.
// El servidor público es gratuito pero sin garantías: para producción conviene uno propio
// (o un proxy en el backend) y apuntar EXPO_PUBLIC_OSRM_URL ahí.
const OSRM_URL = process.env.EXPO_PUBLIC_OSRM_URL || 'https://router.project-osrm.org';
const TIMEOUT_MS = 8000;

export interface Ruta {
  puntos: Coords[];
  /** metros */
  distancia: number;
  /** segundos */
  duracion: number;
}

export async function calcularRuta(origen: Coords, destino: Coords): Promise<Ruta> {
  const url =
    `${OSRM_URL}/route/v1/driving/${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}` +
    '?overview=full&geometries=geojson&alternatives=false&steps=false';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = await res.json();
    const ruta = json?.routes?.[0];
    if (json?.code !== 'Ok' || !ruta) throw new Error(json?.message ?? 'Sin ruta');
    return {
      puntos: (ruta.geometry.coordinates as [number, number][]).map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      distancia: ruta.distance,
      duracion: ruta.duration,
    };
  } finally {
    clearTimeout(timer);
  }
}
