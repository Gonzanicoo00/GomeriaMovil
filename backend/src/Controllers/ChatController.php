<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Mensaje;
use Gomeria\Models\Solicitud;

class ChatController
{
    /**
     * Lista mensajes de una solicitud. Acepta ?since_id= para polling incremental.
     */
    public static function listar(array $params): void
    {
        $user = AuthMiddleware::user();
        $solicitudId = (int) $params['id'];

        if (!Solicitud::perteneceA($solicitudId, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta conversacion', 403);
        }

        $sinceId = isset($_GET['since_id']) ? (int) $_GET['since_id'] : 0;
        $mensajes = Mensaje::listBySolicitud($solicitudId, $sinceId);

        Mensaje::marcarLeidos($solicitudId, (int) $user['sub']);

        Response::success($mensajes);
    }

    public static function enviar(array $params): void
    {
        $user = AuthMiddleware::user();
        $solicitudId = (int) $params['id'];

        if (!Solicitud::perteneceA($solicitudId, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta conversacion', 403);
        }

        $body = self::input();
        $errors = Validator::validate($body, ['contenido' => 'required|max:1000']);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        $id = Mensaje::create($solicitudId, (int) $user['sub'], trim($body['contenido']));

        Response::success(Mensaje::findById($id), 201);
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
