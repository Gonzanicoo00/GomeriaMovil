import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICONO_SERVICIO: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  tire: 'tire',
  patch: 'car-tire-alert',
  air: 'gauge',
  wrench: 'wrench',
  inspect: 'magnify-scan',
};

/** Icono de MaterialCommunityIcons para el campo `icono` de un servicio. */
export function iconoServicio(icono?: string | null): keyof typeof MaterialCommunityIcons.glyphMap {
  return ICONO_SERVICIO[icono ?? ''] ?? 'car-wrench';
}
