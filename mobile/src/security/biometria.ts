import * as LocalAuthentication from 'expo-local-authentication';

/** true si el telefono tiene algun bloqueo configurado: huella, rostro, PIN, patron o contraseña. */
export async function dispositivoProtegido(): Promise<boolean> {
  try {
    const nivel = await LocalAuthentication.getEnrolledLevelAsync();
    return nivel !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

export type ResultadoDesbloqueo = 'ok' | 'cancelado' | 'bloqueado' | 'sin_seguridad' | 'error';

/**
 * Pide la huella o el rostro. Si el usuario no tiene o falla varias veces,
 * el sistema ofrece el PIN, patron o contraseña del telefono.
 */
export async function pedirDesbloqueo(): Promise<ResultadoDesbloqueo> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloqueá Gomería Móvil',
      promptSubtitle: 'Usá tu huella o el bloqueo de pantalla',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (res.success) return 'ok';
    switch (res.error) {
      case 'user_cancel':
      case 'system_cancel':
      case 'app_cancel':
        return 'cancelado';
      case 'lockout':
        return 'bloqueado';
      case 'not_enrolled':
      case 'passcode_not_set':
      case 'not_available':
        return 'sin_seguridad';
      default:
        return 'error';
    }
  } catch {
    return 'error';
  }
}
