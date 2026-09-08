<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;

class Bonificacion
{
    public static function listByGomero(int $gomeroId): array
    {
        $stmt = Database::connection()->prepare(
            "UPDATE bonificaciones SET estado = 'expirada'
             WHERE gomero_id = :gomero_id AND estado = 'activa' AND fecha_expiracion IS NOT NULL AND fecha_expiracion < NOW()"
        );
        $stmt->execute(['gomero_id' => $gomeroId]);

        $stmt = Database::connection()->prepare(
            'SELECT * FROM bonificaciones WHERE gomero_id = :gomero_id ORDER BY fecha_otorgada DESC'
        );
        $stmt->execute(['gomero_id' => $gomeroId]);
        return $stmt->fetchAll();
    }
}
