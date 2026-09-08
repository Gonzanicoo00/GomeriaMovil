<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;

class Mensaje
{
    public static function create(int $solicitudId, int $remitenteId, string $contenido): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO mensajes (solicitud_id, remitente_id, contenido) VALUES (:solicitud_id, :remitente_id, :contenido)'
        );
        $stmt->execute([
            'solicitud_id' => $solicitudId,
            'remitente_id' => $remitenteId,
            'contenido' => $contenido,
        ]);

        return (int) Database::connection()->lastInsertId();
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM mensajes WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Trae los mensajes de una solicitud. Si se pasa $sinceId, solo devuelve los posteriores
     * (para polling incremental desde la app movil).
     */
    public static function listBySolicitud(int $solicitudId, int $sinceId = 0): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT m.*, u.nombre AS remitente_nombre, u.rol AS remitente_rol
             FROM mensajes m
             JOIN usuarios u ON u.id = m.remitente_id
             WHERE m.solicitud_id = :solicitud_id AND m.id > :since_id
             ORDER BY m.id ASC'
        );
        $stmt->execute(['solicitud_id' => $solicitudId, 'since_id' => $sinceId]);
        return $stmt->fetchAll();
    }

    public static function marcarLeidos(int $solicitudId, int $usuarioId): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE mensajes SET leido = 1 WHERE solicitud_id = :solicitud_id AND remitente_id != :usuario_id'
        );
        $stmt->execute(['solicitud_id' => $solicitudId, 'usuario_id' => $usuarioId]);
    }
}
