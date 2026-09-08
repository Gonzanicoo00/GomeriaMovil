<?php

namespace Gomeria\Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use UnexpectedValueException;

class JwtHelper
{
    public static function generate(array $claims): string
    {
        $secret = $_ENV['JWT_SECRET'];
        $algo = $_ENV['JWT_ALGO'] ?? 'HS256';
        $ttl = (int) ($_ENV['JWT_TTL'] ?? 86400);
        $now = time();

        $payload = array_merge($claims, [
            'iat' => $now,
            'exp' => $now + $ttl,
        ]);

        return JWT::encode($payload, $secret, $algo);
    }

    /**
     * Decodifica el token. Devuelve el payload como array o null si es invalido/expirado.
     */
    public static function verify(string $token): ?array
    {
        try {
            $secret = $_ENV['JWT_SECRET'];
            $algo = $_ENV['JWT_ALGO'] ?? 'HS256';
            $decoded = JWT::decode($token, new Key($secret, $algo));
            return (array) $decoded;
        } catch (ExpiredException|SignatureInvalidException|UnexpectedValueException $e) {
            return null;
        }
    }
}
