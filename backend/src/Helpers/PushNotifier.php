<?php

namespace Gomeria\Helpers;

class PushNotifier
{
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Envia una notificacion push via Expo. Best-effort: si falla (token
     * invalido, sin conexion, servicio caido) no interrumpe el flujo
     * principal del request, solo lo registra.
     */
    public static function enviar(?string $pushToken, string $titulo, string $cuerpo, array $data = []): void
    {
        if (!$pushToken || !str_starts_with($pushToken, 'ExponentPushToken')) {
            return;
        }

        $payload = json_encode([
            'to' => $pushToken,
            'title' => $titulo,
            'body' => $cuerpo,
            'data' => $data,
            'sound' => 'default',
            'priority' => 'high',
        ]);

        $ch = curl_init(self::EXPO_PUSH_URL);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
        ]);

        curl_exec($ch);
        if (curl_errno($ch)) {
            error_log('PushNotifier: ' . curl_error($ch));
        }
        curl_close($ch);
    }
}
