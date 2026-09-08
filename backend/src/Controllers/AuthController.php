<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\JwtHelper;
use Gomeria\Helpers\Response;
use Gomeria\Helpers\Validator;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Gomero;
use Gomeria\Models\Usuario;

class AuthController
{
    public static function register(): void
    {
        $body = self::input();

        $errors = Validator::validate($body, [
            'nombre' => 'required|min:2|max:100',
            'apellido' => 'required|min:2|max:100',
            'email' => 'required|email|max:150',
            'password' => 'required|min:6',
            'rol' => 'required|in:cliente,gomero',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        if (Usuario::findByEmail($body['email'])) {
            Response::error('Ese email ya esta registrado', 409);
        }

        $hashedPassword = password_hash($body['password'], PASSWORD_BCRYPT);

        $userId = Usuario::create([
            'nombre' => $body['nombre'],
            'apellido' => $body['apellido'],
            'email' => $body['email'],
            'password' => $hashedPassword,
            'telefono' => $body['telefono'] ?? null,
            'rol' => $body['rol'],
        ]);

        if ($body['rol'] === 'gomero') {
            Gomero::createForUsuario($userId);
        }

        $user = Usuario::toPublicArray(Usuario::findById($userId));
        $token = JwtHelper::generate([
            'sub' => $userId,
            'email' => $user['email'],
            'rol' => $user['rol'],
        ]);

        Response::success(['usuario' => $user, 'token' => $token], 201);
    }

    public static function login(): void
    {
        $body = self::input();

        $errors = Validator::validate($body, [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!empty($errors)) {
            Response::error('Datos invalidos', 422, ['errores' => $errors]);
        }

        $user = Usuario::findByEmail($body['email']);

        if (!$user || !password_verify($body['password'], $user['password'])) {
            Response::error('Credenciales invalidas', 401);
        }

        if (!$user['activo']) {
            Response::error('Tu cuenta esta desactivada', 403);
        }

        $token = JwtHelper::generate([
            'sub' => $user['id'],
            'email' => $user['email'],
            'rol' => $user['rol'],
        ]);

        Response::success(['usuario' => Usuario::toPublicArray($user), 'token' => $token]);
    }

    public static function me(): void
    {
        $authUser = AuthMiddleware::user();
        $user = Usuario::findById((int) $authUser['sub']);

        if (!$user) {
            Response::error('Usuario no encontrado', 404);
        }

        $data = Usuario::toPublicArray($user);

        if ($user['rol'] === 'gomero') {
            $data['gomero'] = Gomero::findByUsuarioId($user['id']);
        }

        Response::success($data);
    }

    private static function input(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
