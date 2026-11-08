-- Migraciones para bases LOCALES (XAMPP / MariaDB) creadas con versiones
-- viejas de schema.sql. "ADD COLUMN IF NOT EXISTS" es sintaxis de MariaDB:
-- NO correr esto en MySQL 8 (Aiven, TiDB, etc.). En el servidor se usa
-- schema.sql directamente, que ya trae todas las columnas.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS push_token VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS terminos_aceptados_en DATETIME NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS terminos_version VARCHAR(20) NULL;

ALTER TABLE gomeros ADD COLUMN IF NOT EXISTS vehiculo_tipo ENUM('moto', 'auto', 'camioneta') NULL AFTER documento_verificado;
ALTER TABLE gomeros ADD COLUMN IF NOT EXISTS vehiculo_marca_modelo VARCHAR(80) NULL AFTER vehiculo_tipo;
ALTER TABLE gomeros ADD COLUMN IF NOT EXISTS vehiculo_color VARCHAR(30) NULL AFTER vehiculo_marca_modelo;
ALTER TABLE gomeros ADD COLUMN IF NOT EXISTS vehiculo_patente VARCHAR(10) NULL AFTER vehiculo_color;
