export function formatRelativeTime(fechaIso: string): string {
  const fecha = new Date(fechaIso).getTime();
  const ahora = Date.now();
  const diffSeg = Math.round((ahora - fecha) / 1000);

  if (diffSeg < 10) return 'ahora mismo';
  if (diffSeg < 60) return `hace ${diffSeg} seg`;
  const diffMin = Math.round(diffSeg / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  const diffDias = Math.round(diffHoras / 24);
  if (diffDias === 1) return 'ayer';
  if (diffDias < 7) return `hace ${diffDias} días`;

  return new Date(fechaIso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimarEtaMinutos(km: number): number {
  const velocidadPromedioKmh = 25;
  return Math.max(1, Math.round((km / velocidadPromedioKmh) * 60));
}

export function iniciales(nombre?: string | null, apellido?: string | null): string {
  const n = nombre?.trim()?.[0] ?? '';
  const a = apellido?.trim()?.[0] ?? '';
  return (n + a).toUpperCase() || '?';
}

export function formatPrecio(valor: string | number | null | undefined): string {
  const n = typeof valor === 'string' ? parseFloat(valor) : valor ?? 0;
  return `$${Math.round(n || 0).toLocaleString('es-AR')}`;
}
