<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\FotoValidator;
use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Helpers\VehiculoValidator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Gomero;
use Gomeria\Models\Usuario;

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

    /**
     * El gomero edita sus datos personales, su foto y los datos de su vehiculo.
     * La foto es opcional si ya tenia una: si no viene, se conserva la guardada.
     */
    public static function actualizarPerfil(): void
    {
        $usuarioId = (int) AuthMiddleware::user()['sub'];
        $body = self::input();

        $errors = Validator::validate($body, [
            'nombre' => 'required|min:2|max:100',
            'apellido' => 'required|min:2|max:100',
            'telefono' => 'max:30',
        ]);

        $tieneFoto = Gomero::foto($usuarioId) !== null;
        [$vehiculo, $erroresVehiculo] = VehiculoValidator::validar($body['vehiculo'] ?? null);
        [$foto, $erroresFoto] = FotoValidator::validar($body['foto'] ?? null, !$tieneFoto);
        $errors = array_merge($errors, $erroresVehiculo, $erroresFoto);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        Usuario::updateProfile($usuarioId, [
            'nombre' => trim($body['nombre']),
            'apellido' => trim($body['apellido']),
            'telefono' => trim((string) ($body['telefono'] ?? '')) ?: null,
        ]);
        Gomero::actualizarVehiculo($usuarioId, $vehiculo);
        if ($foto !== null) {
            Gomero::guardarFoto($usuarioId, $foto);
        }

        $data = Usuario::toPublicArray(Usuario::findById($usuarioId));
        $data['gomero'] = Gomero::findByUsuarioId($usuarioId);
        Response::success($data);
    }

    /**
     * Foto de la cara de un gomero. Solo la ve el propio gomero o un cliente al que atendio.
     */
    public static function foto(array $params): void
    {
        $user = AuthMiddleware::user();
        $gomeroId = (int) $params['id'];

        if (!Gomero::puedeVerFoto($gomeroId, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta foto', 403);
        }

        $foto = Gomero::foto($gomeroId);
        if ($foto === null) {
            Response::error('El gomero no cargo su foto', 404);
        }

        Response::success(['foto' => $foto]);
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
