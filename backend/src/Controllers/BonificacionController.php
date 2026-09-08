<?php

namespace Gomeria\Controllers;

use Gomeria\Helpers\Response;
use Gomeria\Middleware\AuthMiddleware;
use Gomeria\Models\Bonificacion;

class BonificacionController
{
    public static function misBonificaciones(): void
    {
        $user = AuthMiddleware::user();
        Response::success(Bonificacion::listByGomero((int) $user['sub']));
    }
}
