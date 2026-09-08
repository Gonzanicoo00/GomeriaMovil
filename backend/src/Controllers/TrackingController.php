<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Gomero;
use Gomeria\Models\Solicitud;
use Gomeria\Models\UbicacionTracking;

class TrackingController
{
    /**
     * El gomero envia su posicion actual mientras va camino a una solicitud asignada.
     */
    public static function registrar(array $params): void
    {
        $user = AuthMiddleware::user();
        $solicitudId = (int) $params['id'];

        if (!Solicitud::perteneceA($solicitudId, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta solicitud', 403);
        }

        $body = self::input();
        $errors = Validator::validate($body, [
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        UbicacionTracking::registrar($solicitudId, (int) $user['sub'], (float) $body['latitud'], (float) $body['longitud']);
        Gomero::updateUbicacion((int) $user['sub'], (float) $body['latitud'], (float) $body['longitud']);

        Response::success(['ok' => true]);
    }

    /**
     * El cliente consulta la ultima posicion conocida del gomero asignado (para el mapa en vivo).
     */
    public static function ultimaPosicion(array $params): void
    {
        $user = AuthMiddleware::user();
        $solicitudId = (int) $params['id'];

        if (!Solicitud::perteneceA($solicitudId, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta solicitud', 403);
        }

        $posicion = UbicacionTracking::ultimaPosicion($solicitudId);

        if (!$posicion) {
            Response::error('Todavia no hay ubicacion registrada', 404);
        }

        Response::success($posicion);
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
