<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Gomero;

class GomeroController
{
    /**
     * Actualiza la posicion en vivo del gomero (se llama periodicamente desde la app).
     */
    public static function actualizarUbicacion(): void
    {
        $user = AuthMiddleware::user();
        $body = self::input();

        $errors = Validator::validate($body, [
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        Gomero::updateUbicacion((int) $user['sub'], (float) $body['latitud'], (float) $body['longitud']);

        Response::success(Gomero::findByUsuarioId((int) $user['sub']));
    }

    public static function actualizarDisponibilidad(): void
    {
        $user = AuthMiddleware::user();
        $body = self::input();

        $errors = Validator::validate($body, [
            'disponible' => 'required',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        Gomero::updateDisponibilidad((int) $user['sub'], (bool) $body['disponible']);

        Response::success(Gomero::findByUsuarioId((int) $user['sub']));
    }

    /**
     * Busqueda de gomeros disponibles cerca de un punto (usada por el cliente antes de pedir el servicio).
     */
    public static function cercanos(): void
    {
        $lat = $_GET['lat'] ?? null;
        $lng = $_GET['lng'] ?? null;

        if ($lat === null || $lng === null) {
            Response::error('Faltan parametros lat y lng', 422);
        }

        Response::success(Gomero::findDisponiblesCercanos((float) $lat, (float) $lng));
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
