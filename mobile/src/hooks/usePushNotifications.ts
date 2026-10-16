import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, registrarPushToken } from '../notifications/push';
import * as UsuariosApi from '../api/usuarios';
import { navigationRef } from '../navigation/navigationRef';

interface NotificacionData {
  solicitudId?: number;
  paraRol?: 'cliente' | 'gomero';
}

/**
 * Registra el push token del usuario logueado en el backend y navega a la
 * solicitud correspondiente cuando el usuario toca una notificacion.
 */
export function usePushNotifications() {
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const token = await registrarPushToken();
      if (!token) return;
      try {
        await UsuariosApi.actualizarPushToken(token);
      } catch {
        // no es critico: la app sigue funcionando via polling
      }
    })();
  }, [usuario?.id]);

  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificacionData | undefined;
      if (!data?.solicitudId || !navigationRef.isReady()) return;

      const pantalla = data.paraRol === 'gomero' ? 'SolicitudActiva' : 'SolicitudDetalle';
      (navigationRef.navigate as (name: string, params: object) => void)(pantalla, {
        solicitudId: data.solicitudId,
      });
    });

    return () => sub.remove();
  }, []);
}
