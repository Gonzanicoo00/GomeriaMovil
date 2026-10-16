<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\PushNotifier;
use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Gomero;
use Gomeria\Models\Solicitud;
use Gomeria\Models\Usuario;

class SolicitudController
{
    /**
     * El cliente crea una solicitud de servicio.
     */
    public static function crear(): void
    {
        $user = AuthMiddleware::user();
        $body = self::input();

        $errors = Validator::validate($body, [
            'servicio_id' => 'required|numeric',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        $id = Solicitud::create([
            'cliente_id' => $user['sub'],
            'servicio_id' => (int) $body['servicio_id'],
            'descripcion' => $body['descripcion'] ?? null,
            'latitud' => $body['latitud'],
            'longitud' => $body['longitud'],
            'direccion' => $body['direccion'] ?? null,
            'precio_estimado' => $body['precio_estimado'] ?? null,
            'metodo_pago' => $body['metodo_pago'] ?? null,
        ]);

        Response::success(Solicitud::findById($id), 201);
    }

    /**
     * Historial de solicitudes del usuario logueado (cliente o gomero).
     */
    public static function misSolicitudes(): void
    {
        $user = AuthMiddleware::user();

        $lista = $user['rol'] === 'gomero'
            ? Solicitud::listByGomero((int) $user['sub'])
            : Solicitud::listByCliente((int) $user['sub']);

        Response::success($lista);
    }

    /**
     * Matching: solicitudes pendientes dentro del radio de cobertura del gomero logueado.
     */
    public static function disponibles(): void
    {
        $user = AuthMiddleware::user();
        $gomero = Gomero::findByUsuarioId((int) $user['sub']);

        if (!$gomero || $gomero['latitud'] === null || $gomero['longitud'] === null) {
            Response::error('Necesitas activar tu ubicacion para ver solicitudes disponibles', 422);
        }

        $lista = Solicitud::listPendientesParaGomero(
            (float) $gomero['latitud'],
            (float) $gomero['longitud'],
            (float) $gomero['radio_cobertura_km']
        );

        Response::success($lista);
    }

    public static function ver(array $params): void
    {
        $user = AuthMiddleware::user();
        $id = (int) $params['id'];

        if (!Solicitud::perteneceA($id, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta solicitud', 403);
        }

        $solicitud = Solicitud::findById($id);

        if (!$solicitud) {
            Response::error('Solicitud no encontrada', 404);
        }

        Response::success($solicitud);
    }

    /**
     * El gomero acepta una solicitud pendiente (primero en aceptar, se la queda).
     */
    public static function aceptar(array $params): void
    {
        $user = AuthMiddleware::user();
        $id = (int) $params['id'];

        $ok = Solicitud::asignarGomero($id, (int) $user['sub']);

        if (!$ok) {
            Response::error('La solicitud ya no esta disponible', 409);
        }

        $solicitud = Solicitud::findById($id);

        $cliente = Usuario::findById((int) $solicitud['cliente_id']);
        PushNotifier::enviar(
            $cliente['push_token'] ?? null,
            'Encontramos un gomero',
            "{$solicitud['gomero_nombre']} viene en camino a tu ubicacion",
            ['solicitudId' => $id, 'paraRol' => 'cliente']
        );

        Response::success($solicitud);
    }

    public static function cambiarEstado(array $params): void
    {
        $user = AuthMiddleware::user();
        $id = (int) $params['id'];
        $body = self::input();

        if (!Solicitud::perteneceA($id, (int) $user['sub'])) {
            Response::error('No tenes acceso a esta solicitud', 403);
        }

        $errors = Validator::validate($body, [
            'estado' => 'required|in:en_camino,en_proceso,completada,cancelada',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        $solicitud = Solicitud::findById($id);
        $transicionesValidas = [
            'asignada' => ['en_camino', 'cancelada'],
            'en_camino' => ['en_proceso', 'cancelada'],
            'en_proceso' => ['completada', 'cancelada'],
        ];

        $estadoActual = $solicitud['estado'];
        $nuevoEstado = $body['estado'];

        if (!isset($transicionesValidas[$estadoActual]) || !in_array($nuevoEstado, $transicionesValidas[$estadoActual], true)) {
            Response::error("No se puede pasar de '{$estadoActual}' a '{$nuevoEstado}'", 409);
        }

        $extra = [];
        if ($nuevoEstado === 'completada' && isset($body['precio_final'])) {
            $extra['precio_final'] = $body['precio_final'];
        }
        if ($nuevoEstado === 'cancelada' && isset($body['motivo_cancelacion'])) {
            $extra['motivo_cancelacion'] = $body['motivo_cancelacion'];
        }

        Solicitud::cambiarEstado($id, $nuevoEstado, $extra);
        $actualizada = Solicitud::findById($id);

        self::notificarCambioEstado($actualizada, $nuevoEstado, (string) $user['rol']);

        Response::success($actualizada);
    }

    /**
     * Avisa a la otra parte (cliente o gomero) cuando cambia el estado de la solicitud.
     */
    private static function notificarCambioEstado(array $solicitud, string $nuevoEstado, string $rolQueCambio): void
    {
        $mensajes = [
            'en_camino' => ['Tu gomero esta en camino', "{$solicitud['gomero_nombre']} se dirige a tu ubicacion"],
            'en_proceso' => ['Servicio en proceso', "{$solicitud['gomero_nombre']} empezo a trabajar en tu vehiculo"],
            'completada' => ['¡Servicio completado!', 'Conta que tal te fue calificando a tu gomero'],
            'cancelada' => ['Solicitud cancelada', $rolQueCambio === 'gomero' ? 'El gomero cancelo la solicitud' : 'El cliente cancelo la solicitud'],
        ];

        if (!isset($mensajes[$nuevoEstado])) {
            return;
        }
        [$titulo, $cuerpo] = $mensajes[$nuevoEstado];

        // El gomero cambia el estado -> avisamos al cliente, y viceversa (cancelacion del cliente).
        $destinoId = $rolQueCambio === 'gomero' ? $solicitud['cliente_id'] : $solicitud['gomero_id'];
        if (!$destinoId) {
            return;
        }

        $destino = Usuario::findById((int) $destinoId);
        PushNotifier::enviar(
            $destino['push_token'] ?? null,
            $titulo,
            $cuerpo,
            ['solicitudId' => $solicitud['id'], 'paraRol' => $rolQueCambio === 'gomero' ? 'cliente' : 'gomero']
        );
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
