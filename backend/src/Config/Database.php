<?php

namespace Gomeria\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance === null) {
            $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
            $port = $_ENV['DB_PORT'] ?? '3306';
            $db   = $_ENV['DB_DATABASE'] ?? 'gomeria';
            $user = $_ENV['DB_USERNAME'] ?? 'root';
            $pass = $_ENV['DB_PASSWORD'] ?? '';

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // true: permite reutilizar el mismo parametro nombrado varias veces
                // en una misma query (ej. la formula haversine usa :lat y :lng 3 veces).
                PDO::ATTR_EMULATE_PREPARES => true,
            ];

            // Las bases en la nube (Aiven, TiDB) exigen conexion cifrada.
            // DB_SSL_CA: ruta al certificado del proveedor (ej. /etc/secrets/ca.pem en Render).
            // Sin DB_SSL_CA se usan los certificados raiz del sistema.
            if (($_ENV['DB_SSL'] ?? 'false') === 'true') {
                $ca = $_ENV['DB_SSL_CA'] ?? '';
                $options[PDO::MYSQL_ATTR_SSL_CA] = $ca !== '' ? $ca : '/etc/ssl/certs/ca-certificates.crt';
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
            }

            // Los servidores en la nube corren en UTC; NOW() y CURRENT_TIMESTAMP
            // tienen que guardar la hora argentina igual que en XAMPP.
            // Formato de offset, ej. "-03:00".
            $tz = $_ENV['DB_TIMEZONE'] ?? '';
            if (preg_match('/^[+-]\d{2}:\d{2}$/', $tz)) {
                $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET time_zone = '{$tz}'";
            }

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                error_log('Error de conexion a la base de datos: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'No se pudo conectar a la base de datos']);
                exit;
            }
        }

        return self::$instance;
    }
}
