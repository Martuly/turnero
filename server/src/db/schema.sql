-- ============================================================
-- AgendaPro — Esquema de base de datos PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS organizacion (
    id_organizacion SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    email VARCHAR(200),
    telefono VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profesional (
    id_profesional SERIAL PRIMARY KEY,
    id_organizacion INTEGER NOT NULL REFERENCES organizacion(id_organizacion),
    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150) NOT NULL,
    email VARCHAR(200),
    telefono VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS servicio (
    id_servicio SERIAL PRIMARY KEY,
    id_organizacion INTEGER NOT NULL REFERENCES organizacion(id_organizacion),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    duracion_minutos INTEGER NOT NULL DEFAULT 30,
    precio NUMERIC(10,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS profesional_servicio (
    id_profesional INTEGER NOT NULL REFERENCES profesional(id_profesional) ON DELETE CASCADE,
    id_servicio INTEGER NOT NULL REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    PRIMARY KEY (id_profesional, id_servicio)
);

CREATE TABLE IF NOT EXISTS disponibilidad (
    id_disponibilidad SERIAL PRIMARY KEY,
    id_profesional INTEGER NOT NULL REFERENCES profesional(id_profesional) ON DELETE CASCADE,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_desde TIME NOT NULL,
    hora_hasta TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    CHECK (hora_hasta > hora_desde)
);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_prof_dia ON disponibilidad(id_profesional, dia_semana);

CREATE TABLE IF NOT EXISTS bloqueo_agenda (
    id_bloqueo SERIAL PRIMARY KEY,
    id_profesional INTEGER NOT NULL REFERENCES profesional(id_profesional) ON DELETE CASCADE,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    hora_desde TIME,
    hora_hasta TIME,
    motivo VARCHAR(300) NOT NULL,
    CHECK (fecha_hasta >= fecha_desde),
    CHECK (
        (hora_desde IS NULL AND hora_hasta IS NULL)
        OR (hora_desde IS NOT NULL AND hora_hasta IS NOT NULL AND hora_hasta > hora_desde)
    )
);

CREATE INDEX IF NOT EXISTS idx_bloqueo_prof_fecha ON bloqueo_agenda(id_profesional, fecha_desde, fecha_hasta);

CREATE TABLE IF NOT EXISTS cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL,
    telefono VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cliente_email_lower ON cliente(LOWER(email));

CREATE TABLE IF NOT EXISTS turno (
    id_turno SERIAL PRIMARY KEY,
    id_organizacion INTEGER NOT NULL REFERENCES organizacion(id_organizacion),
    id_profesional INTEGER NOT NULL REFERENCES profesional(id_profesional),
    id_servicio INTEGER NOT NULL REFERENCES servicio(id_servicio),
    id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','CONFIRMADO','CANCELADO','FINALIZADO','AUSENTE')),
    calendar_event_id VARCHAR(300),
    mail_confirmacion_enviado BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (hora_fin > hora_inicio)
);

-- Exclusion constraint to prevent double-booking the same professional at overlapping times.
-- Uses a time range (tsrange) and excludes cancelled turnos.
-- Requires the btree_gist extension for the estado exclusion.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop and recreate the exclusion constraint so re-running the schema is safe.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'turno_no_overlap') THEN
        ALTER TABLE turno DROP CONSTRAINT turno_no_overlap;
    END IF;
END $$;

ALTER TABLE turno
    ADD CONSTRAINT turno_no_overlap
    EXCLUDE USING gist (
        id_profesional WITH =,
        fecha WITH =,
        tsrange(fecha + hora_inicio, fecha + hora_fin) WITH &&
    ) WHERE (estado != 'CANCELADO');

CREATE INDEX IF NOT EXISTS idx_turno_prof_fecha ON turno(id_profesional, fecha);
CREATE INDEX IF NOT EXISTS idx_turno_fecha ON turno(fecha);
CREATE INDEX IF NOT EXISTS idx_turno_estado ON turno(estado);

-- ============================================================
-- Autenticación administrativa
-- ============================================================

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
    id_organizacion INTEGER NOT NULL REFERENCES organizacion(id_organizacion) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    PRIMARY KEY (id_usuario, id_organizacion)
);
