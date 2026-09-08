<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;
use PDOException;

class Calificacion
{
    public static function create(int $solicitudId, int $calificadorId, int $calificadoId, int $puntuacion, ?string $comentario): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO calificaciones (solicitud_id, calificador_id, calificado_id, puntuacion, comentario)
             VALUES (:solicitud_id, :calificador_id, :calificado_id, :puntuacion, :comentario)'
        );

        try {
            $stmt->execute([
                'solicitud_id' => $solicitudId,
                'calificador_id' => $calificadorId,
                'calificado_id' => $calificadoId,
                'puntuacion' => $puntuacion,
                'comentario' => $comentario,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                return 0;
            }
            throw $e;
        }

        return (int) Database::connection()->lastInsertId();
    }

    public static function listByUsuarioCalificado(int $usuarioId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT c.*, u.nombre AS calificador_nombre, u.apellido AS calificador_apellido
             FROM calificaciones c
             JOIN usuarios u ON u.id = c.calificador_id
             WHERE c.calificado_id = :usuario_id
             ORDER BY c.created_at DESC'
        );
        $stmt->execute(['usuario_id' => $usuarioId]);
        return $stmt->fetchAll();
    }

    public static function yaCalifico(int $solicitudId, int $calificadorId): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM calificaciones WHERE solicitud_id = :solicitud_id AND calificador_id = :calificador_id LIMIT 1'
        );
        $stmt->execute(['solicitud_id' => $solicitudId, 'calificador_id' => $calificadorId]);
        return (bool) $stmt->fetchColumn();
    }
}
