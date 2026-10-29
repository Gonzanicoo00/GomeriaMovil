<?php

namespace Gomeria\Models;

use Gomeria\Config\Database;
use PDO;

class Solicitud
{
    public static function create(array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO solicitudes (cliente_id, servicio_id, descripcion, latitud, longitud, direccion, precio_estimado, metodo_pago)
             VALUES (:cliente_id, :servicio_id, :descripcion, :latitud, :longitud, :direccion, :precio_estimado, :metodo_pago)'
        );
        $stmt->execute([
            'cliente_id' => $data['cliente_id'],
            'servicio_id' => $data['servicio_id'],
            'descripcion' => $data['descripcion'] ?? null,
            'latitud' => $data['latitud'],
            'longitud' => $data['longitud'],
            'direccion' => $data['direccion'] ?? null,
            'precio_estimado' => $data['precio_estimado'] ?? null,
            'metodo_pago' => $data['metodo_pago'] ?? null,
        ]);

        return (int) Database::connection()->lastInsertId();
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT s.*, sv.nombre AS servicio_nombre, sv.icono AS servicio_icono,
                    c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.telefono AS cliente_telefono,
                    g.nombre AS gomero_nombre, g.apellido AS gomero_apellido, g.telefono AS gomero_telefono,
                    gp.vehiculo_tipo, gp.vehiculo_marca_modelo, gp.vehiculo_color, gp.vehiculo_patente,
                    (vf.usuario_id IS NOT NULL) AS vehiculo_tiene_foto
             FROM solicitudes s
             JOIN servicios sv ON sv.id = s.servicio_id
             JOIN usuarios c ON c.id = s.cliente_id
             LEFT JOIN usuarios g ON g.id = s.gomero_id
             LEFT JOIN gomeros gp ON gp.usuario_id = s.gomero_id
             LEFT JOIN vehiculo_fotos vf ON vf.usuario_id = s.gomero_id
             WHERE s.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function listByCliente(int $clienteId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT s.*, sv.nombre AS servicio_nombre, sv.icono AS servicio_icono
             FROM solicitudes s
             JOIN servicios sv ON sv.id = s.servicio_id
             WHERE s.cliente_id = :cliente_id
             ORDER BY s.created_at DESC'
        );
        $stmt->execute(['cliente_id' => $clienteId]);
        return $stmt->fetchAll();
    }

    public static function listByGomero(int $gomeroId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT s.*, sv.nombre AS servicio_nombre, sv.icono AS servicio_icono,
                    c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.telefono AS cliente_telefono
             FROM solicitudes s
             JOIN servicios sv ON sv.id = s.servicio_id
             JOIN usuarios c ON c.id = s.cliente_id
             WHERE s.gomero_id = :gomero_id
             ORDER BY s.created_at DESC'
        );
        $stmt->execute(['gomero_id' => $gomeroId]);
        return $stmt->fetchAll();
    }

    /**
     * Solicitudes pendientes visibles para un gomero: sin asignar, dentro de su radio de cobertura.
     */
    public static function listPendientesParaGomero(float $lat, float $lng, float $radioKm): array
    {
        $sql = "SELECT s.*, sv.nombre AS servicio_nombre, sv.icono AS servicio_icono,
                    c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                    (6371 * ACOS(
                        COS(RADIANS(:lat)) * COS(RADIANS(s.latitud)) *
                        COS(RADIANS(s.longitud) - RADIANS(:lng)) +
                        SIN(RADIANS(:lat)) * SIN(RADIANS(s.latitud))
                    )) AS distancia_km
                FROM solicitudes s
                JOIN servicios sv ON sv.id = s.servicio_id
                JOIN usuarios c ON c.id = s.cliente_id
                WHERE s.estado = 'pendiente'
                HAVING distancia_km <= :radio
                ORDER BY distancia_km ASC";

        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue('lat', $lat);
        $stmt->bindValue('lng', $lng);
        $stmt->bindValue('radio', $radioKm);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function asignarGomero(int $solicitudId, int $gomeroId): bool
    {
        $stmt = Database::connection()->prepare(
            "UPDATE solicitudes SET gomero_id = :gomero_id, estado = 'asignada', fecha_asignacion = NOW()
             WHERE id = :id AND estado = 'pendiente'"
        );
        $stmt->execute(['gomero_id' => $gomeroId, 'id' => $solicitudId]);
        return $stmt->rowCount() > 0;
    }

    public static function cambiarEstado(int $solicitudId, string $estado, array $extra = []): void
    {
        $fields = ['estado = :estado'];
        $params = ['estado' => $estado, 'id' => $solicitudId];

        if ($estado === 'en_proceso') {
            $fields[] = 'fecha_inicio = NOW()';
        }
        if ($estado === 'completada') {
            $fields[] = 'fecha_completado = NOW()';
        }
        if (isset($extra['precio_final'])) {
            $fields[] = 'precio_final = :precio_final';
            $params['precio_final'] = $extra['precio_final'];
        }
        if (isset($extra['motivo_cancelacion'])) {
            $fields[] = 'motivo_cancelacion = :motivo_cancelacion';
            $params['motivo_cancelacion'] = $extra['motivo_cancelacion'];
        }

        $sql = 'UPDATE solicitudes SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
    }

    public static function perteneceA(int $solicitudId, int $usuarioId): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM solicitudes WHERE id = :id AND (cliente_id = :uid OR gomero_id = :uid) LIMIT 1'
        );
        $stmt->execute(['id' => $solicitudId, 'uid' => $usuarioId]);
        return (bool) $stmt->fetchColumn();
    }
}
