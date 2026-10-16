import { apiClient } from './client';

export async function actualizarPushToken(pushToken: string) {
  await apiClient.put('/usuarios/push-token', { push_token: pushToken });
}
