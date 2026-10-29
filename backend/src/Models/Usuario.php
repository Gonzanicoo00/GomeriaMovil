<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;
use PDO;

class Usuario
{
    public static function findByEmail(string $email): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function create(array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol, terminos_aceptados_en, terminos_version)
             VALUES (:nombre, :apellido, :email, :password, :telefono, :rol, NOW(), :terminos_version)'
        );
        $stmt->execute([
            'nombre' => $data['nombre'],
            'apellido' => $data['apellido'],
            'email' => $data['email'],
            'password' => $data['password'],
            'telefono' => $data['telefono'] ?? null,
            'rol' => $data['rol'],
            'terminos_version' => $data['terminos_version'] ?? null,
        ]);

        return (int) Database::connection()->lastInsertId();
    }

    public static function updateProfile(int $id, array $data): void
    {
        $fields = [];
        $params = ['id' => $id];

        foreach (['nombre', 'apellido', 'telefono', 'foto_perfil'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return;
        }

        $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
    }

    public static function updatePassword(int $id, string $hashedPassword): void
    {
        $stmt = Database::connection()->prepare('UPDATE usuarios SET password = :password WHERE id = :id');
        $stmt->execute(['password' => $hashedPassword, 'id' => $id]);
    }

    public static function updatePushToken(int $id, ?string $pushToken): void
    {
        $stmt = Database::connection()->prepare('UPDATE usuarios SET push_token = :push_token WHERE id = :id');
        $stmt->execute(['push_token' => $pushToken, 'id' => $id]);
    }

    public static function toPublicArray(array $user): array
    {
        unset($user['password']);
        return $user;
    }
}
