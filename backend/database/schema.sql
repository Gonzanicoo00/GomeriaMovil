-- Esquema de base de datos para Gomeria Movil
-- Base de datos: gomeria

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- usuarios: clientes, gomeros y admins comparten la misma
-- tabla de autenticacion; el rol determina el comportamiento.
-- =========================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(30) NULL,
    rol ENUM('cliente', 'gomero', 'admin') NOT NULL DEFAULT 'cliente',
    foto_perfil VARCHAR(255) NULL,
    push_token VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Compatibilidad con bases ya creadas antes de agregar push_token.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS push_token VARCHAR(255) NULL;

-- =========================================================
-- gomeros: datos especificos del prestador de servicio,
-- 1 a 1 con usuarios (rol = 'gomero')
-- =========================================================
CREATE TABLE IF NOT EXISTS gomeros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    nombre_taller VARCHAR(150) NULL,
    descripcion TEXT NULL,
    latitud DECIMAL(10,7) NULL,
    longitud DECIMAL(10,7) NULL,
    direccion VARCHAR(255) NULL,
    disponible TINYINT(1) NOT NULL DEFAULT 0,
    radio_cobertura_km DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    calificacion_promedio DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_servicios INT UNSIGNED NOT NULL DEFAULT 0,
    documento_verificado TINYINT(1) NOT NULL DEFAULT 0,
    ubicacion_actualizada_en DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gomeros_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_gomeros_disponible (disponible),
    INDEX idx_gomeros_ubicacion (latitud, longitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- servicios: catalogo de tipos de servicio ofrecidos
-- =========================================================
CREATE TABLE IF NOT EXISTS servicios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    precio_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    icono VARCHAR(100) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- solicitudes: pedidos de servicio de un cliente
-- =========================================================
CREATE TABLE IF NOT EXISTS solicitudes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT UNSIGNED NOT NULL,
    gomero_id INT UNSIGNED NULL,
    servicio_id INT UNSIGNED NOT NULL,
    estado ENUM('pendiente', 'asignada', 'en_camino', 'en_proceso', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    descripcion TEXT NULL,
    latitud DECIMAL(10,7) NOT NULL,
    longitud DECIMAL(10,7) NOT NULL,
    direccion VARCHAR(255) NULL,
    precio_estimado DECIMAL(10,2) NULL,
    precio_final DECIMAL(10,2) NULL,
    metodo_pago VARCHAR(50) NULL,
    motivo_cancelacion VARCHAR(255) NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_asignacion DATETIME NULL,
    fecha_inicio DATETIME NULL,
    fecha_completado DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicitudes_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_solicitudes_gomero FOREIGN KEY (gomero_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitudes_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    INDEX idx_solicitudes_estado (estado),
    INDEX idx_solicitudes_cliente (cliente_id),
    INDEX idx_solicitudes_gomero (gomero_id),
    INDEX idx_solicitudes_ubicacion (latitud, longitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- ubicaciones_tracking: historial de posiciones del gomero
-- durante una solicitud activa (para el mapa en vivo)
-- =========================================================
CREATE TABLE IF NOT EXISTS ubicaciones_tracking (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT UNSIGNED NOT NULL,
    gomero_id INT UNSIGNED NOT NULL,
    latitud DECIMAL(10,7) NOT NULL,
    longitud DECIMAL(10,7) NOT NULL,
    registrado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    CONSTRAINT fk_tracking_gomero FOREIGN KEY (gomero_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_tracking_solicitud (solicitud_id, registrado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- calificaciones: rating mutuo cliente <-> gomero por solicitud
-- =========================================================
CREATE TABLE IF NOT EXISTS calificaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT UNSIGNED NOT NULL,
    calificador_id INT UNSIGNED NOT NULL,
    calificado_id INT UNSIGNED NOT NULL,
    puntuacion TINYINT UNSIGNED NOT NULL,
    comentario TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calificaciones_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    CONSTRAINT fk_calificaciones_calificador FOREIGN KEY (calificador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_calificaciones_calificado FOREIGN KEY (calificado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_puntuacion CHECK (puntuacion BETWEEN 1 AND 5),
    UNIQUE KEY uq_calificacion_por_solicitud (solicitud_id, calificador_id),
    INDEX idx_calificaciones_calificado (calificado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- mensajes: chat entre cliente y gomero dentro de una solicitud
-- (consumido via polling desde el mobile)
-- =========================================================
CREATE TABLE IF NOT EXISTS mensajes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT UNSIGNED NOT NULL,
    remitente_id INT UNSIGNED NOT NULL,
    contenido TEXT NOT NULL,
    leido TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    CONSTRAINT fk_mensajes_remitente FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_mensajes_solicitud (solicitud_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- bonificaciones: incentivos/premios otorgados a gomeros
-- =========================================================
CREATE TABLE IF NOT EXISTS bonificaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gomero_id INT UNSIGNED NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado ENUM('activa', 'usada', 'expirada') NOT NULL DEFAULT 'activa',
    fecha_otorgada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NULL,
    fecha_uso DATETIME NULL,
    CONSTRAINT fk_bonificaciones_gomero FOREIGN KEY (gomero_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_bonificaciones_gomero (gomero_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- Datos iniciales: catalogo base de servicios
-- =========================================================
INSERT INTO servicios (nombre, descripcion, precio_base, icono) VALUES
    ('Cambio de neumático', 'Reemplazo de neumático dañado por el de auxilio', 3000.00, 'tire'),
    ('Reparación de pinchadura', 'Parche o reparación de pinchadura en el lugar', 2000.00, 'patch'),
    ('Inflado de neumáticos', 'Ajuste de presión de aire en los cuatro neumáticos', 1000.00, 'air'),
    ('Auxilio con llave de tuercas', 'Asistencia para aflojar tuercas trabadas', 1500.00, 'wrench'),
    ('Revisión general', 'Chequeo de estado de neumáticos y presión', 1200.00, 'inspect')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
