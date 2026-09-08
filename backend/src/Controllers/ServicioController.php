<?php

namespace Gomeria\Controllers;

use Gomeria\Config\Database;
use Gomeria\Helpers\Response;

class ServicioController
{
    public static function listar(): void
    {
        $stmt = Database::connection()->query(
            'SELECT * FROM servicios WHERE activo = 1 ORDER BY nombre ASC'
        );

        Response::success($stmt->fetchAll());
    }
}
