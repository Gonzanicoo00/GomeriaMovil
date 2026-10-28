import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go (desde SDK 53) ya no soporta push en Android y tira un error rojo
 * apenas se carga expo-notifications. Por eso en Expo Go no se carga el modulo:
 * la app funciona igual via polling. En un development build (expo run:android) si.
 */
export const pushDisponible = !isRunningInExpoGo() && Constants.appOwnership !== 'expo';

let notifications: NotificationsModule | null = null;
let fallo = false;

/** Devuelve expo-notifications cargado bajo demanda, o null si estamos en Expo Go o no se pudo cargar. */
export function getNotifications(): NotificationsModule | null {
  if (!pushDisponible || fallo) return null;
  if (!notifications) {
    // Si al build le falta algun modulo nativo de expo-notifications, el require falla:
    // en ese caso se sigue sin push en lugar de romper la app.
    try {
      const modulo = require('expo-notifications') as NotificationsModule;
      modulo.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      notifications = modulo;
    } catch (err) {
      fallo = true;
      console.warn('expo-notifications no esta disponible en este build, se sigue sin push:', err);
      return null;
    }
  }
  return notifications;
}

/**
 * Pide permiso y devuelve el Expo push token del dispositivo, o null si no se
 * pudo obtener (Expo Go, permiso denegado, simulador de iOS, o falta configurar el
 * proyecto EAS / Firebase). En esos casos la app sigue funcionando
 * normalmente via polling, solo no recibe push remotos.
 */
export async function registrarPushToken(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  if (Platform.OS === 'ios' && !Device.isDevice) {
    return null;
  }

  const { status: existente } = await Notifications.getPermissionsAsync();
  let status = existente;
  if (status !== 'granted') {
    const solicitado = await Notifications.requestPermissionsAsync();
    status = solicitado.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EA580C',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return data;
  } catch (err) {
    console.warn('No se pudo obtener el push token (falta configurar EAS/Firebase):', err);
    return null;
  }
}
