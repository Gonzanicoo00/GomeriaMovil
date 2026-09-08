<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;

class UbicacionTracking
{
    public static function registrar(int $solicitudId, int $gomeroId, float $lat, float $lng): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO ubicaciones_tracking (solicitud_id, gomero_id, latitud, longitud)
             VALUES (:solicitud_id, :gomero_id, :lat, :lng)'
        );
        $stmt->execute([
            'solicitud_id' => $solicitudId,
            'gomero_id' => $gomeroId,
            'lat' => $lat,
            'lng' => $lng,
        ]);
    }

    public static function ultimaPosicion(int $solicitudId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM ubicaciones_tracking WHERE solicitud_id = :solicitud_id
             ORDER BY registrado_en DESC LIMIT 1'
        );
        $stmt->execute(['solicitud_id' => $solicitudId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function historial(int $solicitudId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM ubicaciones_tracking WHERE solicitud_id = :solicitud_id ORDER BY registrado_en ASC'
        );
        $stmt->execute(['solicitud_id' => $solicitudId]);
        return $stmt->fetchAll();
    }
}
