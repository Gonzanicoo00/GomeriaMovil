<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;

class Gomero
{
    public static function createForUsuario(int $usuarioId, array $vehiculo = []): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO gomeros (usuario_id, vehiculo_tipo, vehiculo_marca_modelo, vehiculo_color, vehiculo_patente)
             VALUES (:usuario_id, :tipo, :marca_modelo, :color, :patente)'
        );
        $stmt->execute([
            'usuario_id' => $usuarioId,
            'tipo' => $vehiculo['tipo'] ?? null,
            'marca_modelo' => $vehiculo['marca_modelo'] ?? null,
            'color' => $vehiculo['color'] ?? null,
            'patente' => $vehiculo['patente'] ?? null,
        ]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function actualizarVehiculo(int $usuarioId, array $vehiculo): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE gomeros SET vehiculo_tipo = :tipo, vehiculo_marca_modelo = :marca_modelo,
                vehiculo_color = :color, vehiculo_patente = :patente
             WHERE usuario_id = :usuario_id'
        );
        $stmt->execute([
            'usuario_id' => $usuarioId,
            'tipo' => $vehiculo['tipo'],
            'marca_modelo' => $vehiculo['marca_modelo'],
            'color' => $vehiculo['color'],
            'patente' => $vehiculo['patente'],
        ]);
    }

    public static function guardarFotoVehiculo(int $usuarioId, string $base64): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO vehiculo_fotos (usuario_id, imagen) VALUES (:usuario_id, :imagen)
             ON DUPLICATE KEY UPDATE imagen = VALUES(imagen)'
        );
        $stmt->execute(['usuario_id' => $usuarioId, 'imagen' => $base64]);
    }

    public static function fotoVehiculo(int $usuarioId): ?string
    {
        $stmt = Database::connection()->prepare(
            'SELECT imagen FROM vehiculo_fotos WHERE usuario_id = :usuario_id LIMIT 1'
        );
        $stmt->execute(['usuario_id' => $usuarioId]);
        $imagen = $stmt->fetchColumn();
        return $imagen === false ? null : $imagen;
    }

    /**
     * La foto del vehiculo la ve el propio gomero o un cliente al que le haya tomado algun pedido.
     */
    public static function puedeVerVehiculo(int $gomeroId, int $usuarioId): bool
    {
        if ($gomeroId === $usuarioId) {
            return true;
        }
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM solicitudes WHERE gomero_id = :gomero_id AND cliente_id = :cliente_id LIMIT 1'
        );
        $stmt->execute(['gomero_id' => $gomeroId, 'cliente_id' => $usuarioId]);
        return (bool) $stmt->fetchColumn();
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
