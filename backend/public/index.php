<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Gomeria\Core\Router;
use Gomeria\Helpers\Response;

// En local se lee el .env; en produccion (Railway) las variables vienen del entorno.
$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();
$_ENV = array_merge(getenv(), $_ENV);

if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

// CORS: la app movil (Expo/React Native) consume esta API desde otro origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage() . "\n" . $e->getTraceAsString());
    $debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
    Response::error(
        'Error interno del servidor',
        500,
        $debug ? ['detalle' => $e->getMessage()] : []
    );
});

$router = new Router();
require __DIR__ . '/../src/routes.php';

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
