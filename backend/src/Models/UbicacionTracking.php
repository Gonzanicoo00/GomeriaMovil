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
             ORDER BY id DESC LIMIT 1'
        );
        $stmt->execute(['solicitud_id' => $solicitudId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Posiciones registradas para la solicitud, en orden. Con $desdeId solo devuelve las posteriores
     * a ese id, para que el cliente pida el recorrido de forma incremental.
     */
    public static function historial(int $solicitudId, int $desdeId = 0, int $limite = 2000): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, latitud, longitud, registrado_en FROM ubicaciones_tracking
             WHERE solicitud_id = :solicitud_id AND id > :desde
             ORDER BY id ASC LIMIT ' . max(1, min($limite, 5000))
        );
        $stmt->execute(['solicitud_id' => $solicitudId, 'desde' => $desdeId]);
        return $stmt->fetchAll();
    }
}
