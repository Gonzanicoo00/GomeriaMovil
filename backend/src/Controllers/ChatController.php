<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\PushNotifier;
use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Mensaje;
use Gomeria\Models\Solicitud;
use Gomeria\Models\Usuario;

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
        $mensaje = Mensaje::findById($id);

        self::notificarMensaje($solicitudId, (int) $user['sub']);

        Response::success($mensaje, 201);
    }

    /**
     * Avisa al otro participante de la solicitud (el que no escribio) que llego un mensaje nuevo.
     */
    private static function notificarMensaje(int $solicitudId, int $remitenteId): void
    {
        $solicitud = Solicitud::findById($solicitudId);
        if (!$solicitud) {
            return;
        }

        $destinoId = $remitenteId === (int) $solicitud['cliente_id']
            ? $solicitud['gomero_id']
            : $solicitud['cliente_id'];

        if (!$destinoId) {
            return;
        }

        $remitente = Usuario::findById($remitenteId);
        $destino = Usuario::findById((int) $destinoId);

        PushNotifier::enviar(
            $destino['push_token'] ?? null,
            "Mensaje de {$remitente['nombre']}",
            'Toca para ver la conversacion',
            ['solicitudId' => $solicitudId, 'paraRol' => $destino['rol'] ?? null]
        );
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
