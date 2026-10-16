<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Usuario;

class UsuarioController
{
    /**
     * Guarda (o borra, si viene null) el Expo push token del dispositivo
     * del usuario logueado para poder enviarle notificaciones remotas.
     */
    public static function actualizarPushToken(): void
    {
        $user = AuthMiddleware::user();
        $body = self::input();

        $errors = Validator::validate($body, ['push_token' => 'required|max:255']);
        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        Usuario::updatePushToken((int) $user['sub'], $body['push_token']);

        Response::success(['guardado' => true]);
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
