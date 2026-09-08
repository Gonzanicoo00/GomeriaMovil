<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Calificacion;
use Gomeria\Models\Gomero;
use Gomeria\Models\Solicitud;

class CalificacionController
{
    public static function crear(array $params): void
    {
        $user = AuthMiddleware::user();
        $solicitudId = (int) $params['id'];
        $usuarioId = (int) $user['sub'];

        $solicitud = Solicitud::findById($solicitudId);

        if (!$solicitud || !Solicitud::perteneceA($solicitudId, $usuarioId)) {
            Response::error('No tenes acceso a esta solicitud', 403);
        }

        if ($solicitud['estado'] !== 'completada') {
            Response::error('Solo se puede calificar una solicitud completada', 409);
        }

        if (Calificacion::yaCalifico($solicitudId, $usuarioId)) {
            Response::error('Ya calificaste esta solicitud', 409);
        }

        $body = self::input();
        $errors = Validator::validate($body, [
            'puntuacion' => 'required|numeric|min:1|max:5',
            'comentario' => 'max:500',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        $calificadoId = $usuarioId === (int) $solicitud['cliente_id']
            ? (int) $solicitud['gomero_id']
            : (int) $solicitud['cliente_id'];

        $id = Calificacion::create($solicitudId, $usuarioId, $calificadoId, (int) $body['puntuacion'], $body['comentario'] ?? null);

        if (!$id) {
            Response::error('Ya calificaste esta solicitud', 409);
        }

        Gomero::recalcularCalificacion($calificadoId);

        Response::success(['ok' => true], 201);
    }

    public static function porUsuario(array $params): void
    {
        $usuarioId = (int) $params['id'];
        Response::success(Calificacion::listByUsuarioCalificado($usuarioId));
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
