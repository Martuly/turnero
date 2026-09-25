-- ============================================================
-- AgendaPro — Datos de prueba (seed)
-- ============================================================

INSERT INTO organizacion (id_organizacion, nombre, descripcion, email, telefono, activo)
VALUES (1, 'Centro Profesional Demo', 'Ejemplo genérico para reservas de turnos', 'contacto@demo.com', '+54 11 5555-5555', true)
ON CONFLICT (id_organizacion) DO NOTHING;

-- Profesionales
INSERT INTO profesional (id_profesional, id_organizacion, nombre, apellido, email, telefono, activo) VALUES
(1, 1, 'Ana', 'López', 'ana@demo.com', '+54 11 1111-1111', true),
(2, 1, 'Carlos', 'Pérez', 'carlos@demo.com', '+54 11 2222-2222', true),
(3, 1, 'María', 'Gómez', 'maria@demo.com', '+54 11 3333-3333', true)
ON CONFLICT (id_profesional) DO NOTHING;

-- Servicios
INSERT INTO servicio (id_servicio, id_organizacion, nombre, descripcion, duracion_minutos, precio, activo) VALUES
(1, 1, 'Consulta', 'Sesión estándar de 60 minutos', 60, 5000, true),
(2, 1, 'Sesión corta', 'Sesión de 30 minutos', 30, 3000, true),
(3, 1, 'Tratamiento intensivo', 'Sesión extendida de 90 minutos', 90, 8000, true),
(4, 1, 'Asesoría', 'Consultoría de 45 minutos', 45, 4500, true)
ON CONFLICT (id_servicio) DO NOTHING;

-- profesional_servicio
INSERT INTO profesional_servicio (id_profesional, id_servicio) VALUES
(1, 1), (1, 2), (1, 4),
(2, 1), (2, 3),
(3, 1), (3, 2), (3, 4)
ON CONFLICT DO NOTHING;

-- Disponibilidad (dia_semana: 1=Lunes ... 6=Sábado, 0=Domingo)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_desde, hora_hasta, activo) VALUES
(1, 1, '09:00', '13:00', true),
(1, 1, '15:00', '19:00', true),
(1, 2, '09:00', '18:00', true),
(1, 3, '09:00', '13:00', true),
(1, 4, '15:00', '19:00', true),
(1, 5, '09:00', '18:00', true),

(2, 1, '10:00', '20:00', true),
(2, 2, '10:00', '20:00', true),
(2, 3, '10:00', '14:00', true),
(2, 5, '10:00', '20:00', true),
(2, 6, '10:00', '14:00', true),

(3, 2, '08:00', '12:00', true),
(3, 2, '16:00', '20:00', true),
(3, 4, '08:00', '12:00', true),
(3, 5, '16:00', '20:00', true),
(3, 6, '08:00', '12:00', true)
ON CONFLICT DO NOTHING;

-- Clientes
INSERT INTO cliente (id_cliente, nombre, apellido, email, telefono) VALUES
(1, 'Juan', 'Ruiz', 'juan@example.com', '+54 11 4444-4444'),
(2, 'Lucía', 'Fernández', 'lucia@example.com', '+54 11 5555-5555')
ON CONFLICT (id_cliente) DO NOTHING;

-- Turnos de ejemplo (fecha actual)
INSERT INTO turno (id_organizacion, id_profesional, id_servicio, id_cliente, fecha, hora_inicio, hora_fin, estado)
VALUES
(1, 1, 1, 1, CURRENT_DATE, '10:00', '11:00', 'CONFIRMADO'),
(1, 2, 3, 2, CURRENT_DATE, '11:00', '12:30', 'PENDIENTE')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Usuario administrador de prueba
-- Email: admin@demo.com  Contraseña: admin123
-- ============================================================
INSERT INTO usuario (id_usuario, nombre, email, password_hash, activo)
VALUES (1, 'Administrador', 'admin@demo.com', '$2b$10$8rDGjl3hzx6shI3ooV6/AekZXg917t0uPzwBPiY.9iznNnKONdSQC', true)
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO usuario_organizacion (id_usuario, id_organizacion, rol)
VALUES (1, 1, 'ADMIN')
ON CONFLICT DO NOTHING;
