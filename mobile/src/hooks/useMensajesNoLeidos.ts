import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ChatApi from '../api/chat';
import { usePolling } from './usePolling';

// El backend marca los mensajes como leidos apenas se listan, asi que "visto" se lleva en el telefono:
// el id del ultimo mensaje que el usuario tuvo en pantalla en el chat de cada solicitud.
const clave = (solicitudId: number) => `chat_visto_${solicitudId}`;
const vistos = new Map<number, number>();
const suscriptores = new Set<() => void>();

export async function marcarChatVisto(solicitudId: number, mensajeId: number) {
  if (mensajeId <= (vistos.get(solicitudId) ?? 0)) return;
  vistos.set(solicitudId, mensajeId);
  suscriptores.forEach((avisar) => avisar());
  AsyncStorage.setItem(clave(solicitudId), String(mensajeId)).catch(() => {});
}

/**
 * Cantidad de mensajes del otro participante que llegaron despues de la ultima vez que se abrio el chat.
 * Se pausa con `activo = false` (por ejemplo mientras el chat esta en pantalla).
 */
export function useMensajesNoLeidos(solicitudId: number, usuarioId: number | undefined, activo: boolean) {
  const [idsAjenos, setIdsAjenos] = useState<number[]>([]);
  const [visto, setVisto] = useState(vistos.get(solicitudId) ?? 0);
  const ultimoId = useRef(0);

  useEffect(() => {
    let vivo = true;
    if (!vistos.has(solicitudId)) {
      AsyncStorage.getItem(clave(solicitudId))
        .then((v) => {
          const n = Number(v) || 0;
          if (n > (vistos.get(solicitudId) ?? 0)) vistos.set(solicitudId, n);
          if (vivo) setVisto(vistos.get(solicitudId) ?? 0);
        })
        .catch(() => {});
    }
    const avisar = () => setVisto(vistos.get(solicitudId) ?? 0);
    suscriptores.add(avisar);
    return () => {
      vivo = false;
      suscriptores.delete(avisar);
    };
  }, [solicitudId]);

  const cargar = useCallback(async () => {
    try {
      const nuevos = await ChatApi.listarMensajes(solicitudId, ultimoId.current);
      if (!nuevos.length) return;
      ultimoId.current = nuevos[nuevos.length - 1].id;
      const ajenos = nuevos.filter((m) => m.remitente_id !== usuarioId).map((m) => m.id);
      if (ajenos.length) setIdsAjenos((prev) => [...prev, ...ajenos]);
    } catch {
      // el proximo ciclo reintenta
    }
  }, [solicitudId, usuarioId]);

  usePolling(cargar, 5000, activo && !!usuarioId);

  return idsAjenos.filter((id) => id > visto).length;
}
