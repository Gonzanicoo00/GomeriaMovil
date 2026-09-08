<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;

class Gomero
{
    public static function createForUsuario(int $usuarioId): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO gomeros (usuario_id) VALUES (:usuario_id)'
        );
        $stmt->execute(['usuario_id' => $usuarioId]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function findByUsuarioId(int $usuarioId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT g.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil
             FROM gomeros g
             JOIN usuarios u ON u.id = g.usuario_id
             WHERE g.usuario_id = :usuario_id LIMIT 1'
        );
        $stmt->execute(['usuario_id' => $usuarioId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function updateUbicacion(int $usuarioId, float $lat, float $lng): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE gomeros SET latitud = :lat, longitud = :lng, ubicacion_actualizada_en = NOW()
             WHERE usuario_id = :usuario_id'
        );
        $stmt->execute(['lat' => $lat, 'lng' => $lng, 'usuario_id' => $usuarioId]);
    }

    public static function updateDisponibilidad(int $usuarioId, bool $disponible): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE gomeros SET disponible = :disponible WHERE usuario_id = :usuario_id'
        );
        $stmt->execute(['disponible' => $disponible ? 1 : 0, 'usuario_id' => $usuarioId]);
    }

    /**
     * Busca gomeros disponibles ordenados por distancia (formula haversine) a un punto dado.
     */
    public static function findDisponiblesCercanos(float $lat, float $lng, int $limit = 10): array
    {
        $sql = "SELECT g.*, u.nombre, u.apellido, u.telefono, u.foto_perfil,
                    (6371 * ACOS(
                        COS(RADIANS(:lat)) * COS(RADIANS(g.latitud)) *
                        COS(RADIANS(g.longitud) - RADIANS(:lng)) +
                        SIN(RADIANS(:lat)) * SIN(RADIANS(g.latitud))
                    )) AS distancia_km
                FROM gomeros g
                JOIN usuarios u ON u.id = g.usuario_id
                WHERE g.disponible = 1
                    AND g.latitud IS NOT NULL
                    AND g.longitud IS NOT NULL
                    AND u.activo = 1
                HAVING distancia_km <= g.radio_cobertura_km
                ORDER BY distancia_km ASC
                LIMIT :limit";

        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue('lat', $lat);
        $stmt->bindValue('lng', $lng);
        $stmt->bindValue('limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function recalcularCalificacion(int $usuarioId): void
    {
        $stmt = Database::connection()->prepare(
            'SELECT AVG(puntuacion) AS promedio FROM calificaciones WHERE calificado_id = :id'
        );
        $stmt->execute(['id' => $usuarioId]);
        $promedio = (float) ($stmt->fetch()['promedio'] ?? 0);

        $update = Database::connection()->prepare(
            'UPDATE gomeros SET calificacion_promedio = :promedio WHERE usuario_id = :usuario_id'
        );
        $update->execute(['promedio' => round($promedio, 2), 'usuario_id' => $usuarioId]);
    }
}
