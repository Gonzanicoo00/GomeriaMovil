import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// En Android se usa performAndroidHapticsAsync: es la vibracion corta nativa del sistema
// (la misma del teclado) y no depende del servicio Vibrator. En iOS se usa el Taptic Engine.
const esAndroid = Platform.OS === 'android';

function seguro(promesa: Promise<void>) {
  promesa.catch(() => {
    // si el dispositivo no soporta haptics no pasa nada
  });
}

export const haptics = {
  /** Toque liviano: botones y acciones comunes. */
  tap() {
    seguro(
      esAndroid
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
  },
  /** Cambio de seleccion: estrellas, switches. */
  seleccion() {
    seguro(
      esAndroid
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
        : Haptics.selectionAsync()
    );
  },
  exito() {
    seguro(
      esAndroid
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
  },
  error() {
    seguro(
      esAndroid
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    );
  },
};
