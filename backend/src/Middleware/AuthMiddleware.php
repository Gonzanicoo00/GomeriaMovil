<?php

namespace Gomeria\Middleware;

use Gomeria\Helpers\JwtHelper;
use Gomeria\Helpers\Response;

class AuthMiddleware
{
    private static ?array $user = null;

    /**
     * Verifica el header Authorization: Bearer <token>.
     * Si es valido, guarda el payload para que los controllers lo lean con user().
     * Si no, corta la ejecucion con 401.
     */
    public static function handle(): void
    {
        $token = self::extractToken();

        if (!$token) {
            Response::error('Token no proporcionado', 401);
        }

        $payload = JwtHelper::verify($token);

        if (!$payload) {
            Response::error('Token invalido o expirado', 401);
        }

        self::$user = $payload;
    }

    /**
     * Middleware adicional para restringir por rol. Uso: AuthMiddleware::role('gomero')
     */
    public static function role(string ...$roles): callable
    {
        return function () use ($roles) {
            self::handle();
            if (!in_array(self::$user['rol'] ?? null, $roles, true)) {
                Response::error('No tenes permisos para acceder a este recurso', 403);
            }
        };
    }

    public static function user(): array
    {
        return self::$user ?? [];
    }

    private static function extractToken(): ?string
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization']
            ?? $headers['authorization']
            ?? $_SERVER['HTTP_AUTHORIZATION']
            ?? null;

        if (!$authHeader) {
            return null;
        }

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}
