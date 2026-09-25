-- ============================================================
-- AgendaPro — Autenticación administrativa (script independiente)
-- Tablas: usuario, usuario_organizacion
-- ============================================================

-- Requiere que la tabla organizacion ya exista (ver schema.sql).

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario_organizacion (
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_organizacion BIGINT NOT NULL REFERENCES organizacion(id_organizacion) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    PRIMARY KEY (id_usuario, id_organizacion)
);

CREATE INDEX IF NOT EXISTS idx_usuario_organizacion_usuario ON usuario_organizacion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_organizacion_org ON usuario_organizacion(id_organizacion);
