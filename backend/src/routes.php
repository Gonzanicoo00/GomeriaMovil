<?php

declare(strict_types=1);

use Gomeria\Controllers\AuthController;
use Gomeria\Controllers\BonificacionController;
use Gomeria\Controllers\CalificacionController;
use Gomeria\Controllers\ChatController;
use Gomeria\Controllers\GomeroController;
use Gomeria\Controllers\ServicioController;
use Gomeria\Controllers\SolicitudController;
use Gomeria\Controllers\TrackingController;
use Gomeria\Middleware\AuthMiddleware;

/** @var Gomeria\Core\Router $router */

$auth = fn () => AuthMiddleware::handle();
$soloGomero = AuthMiddleware::role('gomero');
$soloCliente = AuthMiddleware::role('cliente');

// ---- Health check ----
$router->get('/api/health', function () {
    \Gomeria\Helpers\Response::success(['status' => 'ok', 'time' => date('c')]);
});

// ---- Auth ----
$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/me', [AuthController::class, 'me'], [$auth]);

// ---- Servicios (catalogo) ----
$router->get('/api/servicios', [ServicioController::class, 'listar']);

// ---- Gomeros ----
$router->get('/api/gomeros/cercanos', [GomeroController::class, 'cercanos']);
$router->put('/api/gomeros/ubicacion', [GomeroController::class, 'actualizarUbicacion'], [$soloGomero]);
$router->put('/api/gomeros/disponibilidad', [GomeroController::class, 'actualizarDisponibilidad'], [$soloGomero]);
$router->get('/api/gomeros/{id}/calificaciones', [CalificacionController::class, 'porUsuario']);
$router->get('/api/gomeros/bonificaciones', [BonificacionController::class, 'misBonificaciones'], [$soloGomero]);

// ---- Solicitudes ----
$router->post('/api/solicitudes', [SolicitudController::class, 'crear'], [$soloCliente]);
$router->get('/api/solicitudes', [SolicitudController::class, 'misSolicitudes'], [$auth]);
$router->get('/api/solicitudes/disponibles', [SolicitudController::class, 'disponibles'], [$soloGomero]);
$router->get('/api/solicitudes/{id}', [SolicitudController::class, 'ver'], [$auth]);
$router->post('/api/solicitudes/{id}/aceptar', [SolicitudController::class, 'aceptar'], [$soloGomero]);
$router->put('/api/solicitudes/{id}/estado', [SolicitudController::class, 'cambiarEstado'], [$auth]);

// ---- Calificaciones ----
$router->post('/api/solicitudes/{id}/calificacion', [CalificacionController::class, 'crear'], [$auth]);

// ---- Chat (polling) ----
$router->get('/api/solicitudes/{id}/mensajes', [ChatController::class, 'listar'], [$auth]);
$router->post('/api/solicitudes/{id}/mensajes', [ChatController::class, 'enviar'], [$auth]);

// ---- Tracking de ubicacion ----
$router->post('/api/solicitudes/{id}/tracking', [TrackingController::class, 'registrar'], [$soloGomero]);
$router->get('/api/solicitudes/{id}/tracking', [TrackingController::class, 'ultimaPosicion'], [$auth]);
