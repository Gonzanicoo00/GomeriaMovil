import { useEffect, useMemo, useRef, useState } from 'react';
import { Ruta, calcularRuta } from '../api/rutas';
import { Coords } from './useLocationWatcher';

// Si el gomero se aleja más que esto de la ruta, se considera que tomó otro camino y se recalcula.
const DESVIO_METROS = 45;
// Aunque siga la ruta, cada tanto se vuelve a pedir para que siempre sea la mejor desde donde está.
const REFRESCO_MS = 60_000;
// Tras un error (sin señal, servidor caído) se espera un poco antes de reintentar.
const REINTENTO_MS = 8_000;
// Ya llegó: no tiene sentido pedir ruta.
const LLEGADA_METROS = 25;

export interface RutaRestante {
  /** Camino que falta, empezando en la posición actual del gomero. */
  puntos: Coords[];
  /** metros */
  distancia: number;
  /** segundos */
  duracion: number;
}

/**
 * Calcula el camino por calles desde `origen` hasta `destino` y lo mantiene actualizado:
 * - lo recorta a medida que el gomero avanza (solo se dibuja lo que falta),
 * - lo recalcula si se desvía de la ruta o si cambia el destino,
 * - y lo refresca periódicamente para mostrar siempre el mejor camino.
 */
export function useRuta(origen: Coords | null, destino: Coords | null, enabled: boolean) {
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [recalculando, setRecalculando] = useState(false);
  const pidiendo = useRef(false);
  const ultimoCalculo = useRef(0);
  const reintentarDesde = useRef(0);
  const destinoCalculado = useRef<Coords | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setRuta(null);
      destinoCalculado.current = null;
      return;
    }
    if (!origen || !destino || pidiendo.current) return;
    if (metros(origen, destino) < LLEGADA_METROS) return;

    const ahora = Date.now();
    if (ahora < reintentarDesde.current) return;

    const cambioDestino = !destinoCalculado.current || metros(destinoCalculado.current, destino) > 5;
    const desviado = !!ruta && distanciaAPolilinea(origen, ruta.puntos).distancia > DESVIO_METROS;
    const vencida = ahora - ultimoCalculo.current > REFRESCO_MS;
    if (ruta && !cambioDestino && !desviado && !vencida) return;

    pidiendo.current = true;
    // Solo se muestra "recalculando" cuando realmente cambió de camino, no en los refrescos silenciosos.
    if (ruta && desviado) setRecalculando(true);
    calcularRuta(origen, destino)
      .then((nueva) => {
        if (!montado.current) return;
        ultimoCalculo.current = Date.now();
        destinoCalculado.current = destino;
        setRuta(nueva);
      })
      .catch(() => {
        reintentarDesde.current = Date.now() + REINTENTO_MS;
      })
      .finally(() => {
        pidiendo.current = false;
        if (montado.current) setRecalculando(false);
      });
  }, [enabled, origen?.latitude, origen?.longitude, destino?.latitude, destino?.longitude, ruta]);

  const restante = useMemo<RutaRestante | null>(() => {
    if (!ruta || !origen || ruta.puntos.length < 2) return null;
    const { indice } = distanciaAPolilinea(origen, ruta.puntos);
    const puntos = [origen, ...ruta.puntos.slice(indice + 1)];
    let distancia = 0;
    for (let i = 1; i < puntos.length; i++) distancia += metros(puntos[i - 1], puntos[i]);
    const duracion = ruta.distancia > 0 ? ruta.duracion * Math.min(1, distancia / ruta.distancia) : ruta.duracion;
    return { puntos, distancia, duracion };
  }, [ruta, origen?.latitude, origen?.longitude]);

  return { ruta: restante, recalculando };
}

/** Distancia en metros entre dos coordenadas (haversine). */
export function metros(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Distancia del punto al tramo más cercano de la polilínea, y el índice donde empieza ese tramo.
 * Usa una proyección plana local, más que suficiente para las distancias de una ciudad.
 */
function distanciaAPolilinea(p: Coords, linea: Coords[]): { distancia: number; indice: number } {
  if (linea.length === 0) return { distancia: Infinity, indice: 0 };
  if (linea.length === 1) return { distancia: metros(p, linea[0]), indice: 0 };

  const kx = 111320 * Math.cos(rad(p.latitude));
  const ky = 110540;
  const px = p.longitude * kx;
  const py = p.latitude * ky;

  let mejor = Infinity;
  let indice = 0;
  for (let i = 0; i < linea.length - 1; i++) {
    const ax = linea[i].longitude * kx;
    const ay = linea[i].latitude * ky;
    const bx = linea[i + 1].longitude * kx;
    const by = linea[i + 1].latitude * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / largo2));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d < mejor) {
      mejor = d;
      indice = i;
    }
  }
  return { distancia: mejor, indice };
}

function rad(g: number) {
  return (g * Math.PI) / 180;
}
