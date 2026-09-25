// In-memory mock data for MOCK MODE. Mirrors the backend schema.
import type {
  BloqueoAgenda,
  Cliente,
  DashboardResumen,
  Disponibilidad,
  DisponibilidadResponse,
  EstadoTurno,
  Organizacion,
  Profesional,
  Servicio,
  TurnoDetalle,
} from '@/types';
import { APP_CONFIG } from '@/config/app';

const ORG_ID = APP_CONFIG.defaultOrganizacionId;

export const mockOrganizacion: Organizacion = {
  id_organizacion: ORG_ID,
  nombre: 'Centro Profesional Demo',
  descripcion: 'Ejemplo genérico para reservas de turnos',
  email: 'contacto@demo.com',
  telefono: '+54 11 5555-5555',
  activo: true,
  created_at: '2024-01-01T00:00:00.000Z',
};

export const mockProfesionales: Profesional[] = [
  { id_profesional: 1, id_organizacion: ORG_ID, nombre: 'Ana', apellido: 'López', email: 'ana@demo.com', telefono: '+54 11 1111-1111', activo: true },
  { id_profesional: 2, id_organizacion: ORG_ID, nombre: 'Carlos', apellido: 'Pérez', email: 'carlos@demo.com', telefono: '+54 11 2222-2222', activo: true },
  { id_profesional: 3, id_organizacion: ORG_ID, nombre: 'María', apellido: 'Gómez', email: 'maria@demo.com', telefono: '+54 11 3333-3333', activo: true },
];

export const mockServicios: Servicio[] = [
  { id_servicio: 1, id_organizacion: ORG_ID, nombre: 'Consulta', descripcion: 'Sesión estándar de 60 minutos', duracion_minutos: 60, precio: 5000, activo: true },
  { id_servicio: 2, id_organizacion: ORG_ID, nombre: 'Sesión corta', descripcion: 'Sesión de 30 minutos', duracion_minutos: 30, precio: 3000, activo: true },
  { id_servicio: 3, id_organizacion: ORG_ID, nombre: 'Tratamiento intensivo', descripcion: 'Sesión extendida de 90 minutos', duracion_minutos: 90, precio: 8000, activo: true },
  { id_servicio: 4, id_organizacion: ORG_ID, nombre: 'Asesoría', descripcion: 'Consultoría de 45 minutos', duracion_minutos: 45, precio: 4500, activo: true },
];

// Which professional performs which service
export const mockProfesionalServicio: { id_profesional: number; id_servicio: number }[] = [
  { id_profesional: 1, id_servicio: 1 },
  { id_profesional: 1, id_servicio: 2 },
  { id_profesional: 1, id_servicio: 4 },
  { id_profesional: 2, id_servicio: 1 },
  { id_profesional: 2, id_servicio: 3 },
  { id_profesional: 3, id_servicio: 1 },
  { id_profesional: 3, id_servicio: 2 },
  { id_profesional: 3, id_servicio: 4 },
];

// Weekly availability. dia_semana: 1=Lunes ... 6=Sábado, 0=Domingo
export const mockDisponibilidad: Disponibilidad[] = [
  { id_disponibilidad: 1, id_profesional: 1, dia_semana: 1, hora_desde: '09:00', hora_hasta: '13:00', activo: true },
  { id_disponibilidad: 2, id_profesional: 1, dia_semana: 1, hora_desde: '15:00', hora_hasta: '19:00', activo: true },
  { id_disponibilidad: 3, id_profesional: 1, dia_semana: 2, hora_desde: '09:00', hora_hasta: '18:00', activo: true },
  { id_disponibilidad: 4, id_profesional: 1, dia_semana: 3, hora_desde: '09:00', hora_hasta: '13:00', activo: true },
  { id_disponibilidad: 5, id_profesional: 1, dia_semana: 4, hora_desde: '15:00', hora_hasta: '19:00', activo: true },
  { id_disponibilidad: 6, id_profesional: 1, dia_semana: 5, hora_desde: '09:00', hora_hasta: '18:00', activo: true },

  { id_disponibilidad: 7, id_profesional: 2, dia_semana: 1, hora_desde: '10:00', hora_hasta: '20:00', activo: true },
  { id_disponibilidad: 8, id_profesional: 2, dia_semana: 2, hora_desde: '10:00', hora_hasta: '20:00', activo: true },
  { id_disponibilidad: 9, id_profesional: 2, dia_semana: 3, hora_desde: '10:00', hora_hasta: '14:00', activo: true },
  { id_disponibilidad: 10, id_profesional: 2, dia_semana: 5, hora_desde: '10:00', hora_hasta: '20:00', activo: true },
  { id_disponibilidad: 11, id_profesional: 2, dia_semana: 6, hora_desde: '10:00', hora_hasta: '14:00', activo: true },

  { id_disponibilidad: 12, id_profesional: 3, dia_semana: 2, hora_desde: '08:00', hora_hasta: '12:00', activo: true },
  { id_disponibilidad: 13, id_profesional: 3, dia_semana: 2, hora_desde: '16:00', hora_hasta: '20:00', activo: true },
  { id_disponibilidad: 14, id_profesional: 3, dia_semana: 4, hora_desde: '08:00', hora_hasta: '12:00', activo: true },
  { id_disponibilidad: 15, id_profesional: 3, dia_semana: 5, hora_desde: '16:00', hora_hasta: '20:00', activo: true },
  { id_disponibilidad: 16, id_profesional: 3, dia_semana: 6, hora_desde: '08:00', hora_hasta: '12:00', activo: true },
];

export const mockBloqueos: BloqueoAgenda[] = [
  // Example: a 3-day vacation block for profesional 1, starting next Monday
  {
    id_bloqueo: 1,
    id_profesional: 1,
    fecha_desde: nextMonday(),
    fecha_hasta: nextMonday(3),
    hora_desde: null,
    hora_hasta: null,
    motivo: 'Vacaciones',
  },
];

export const mockClientes: Cliente[] = [
  { id_cliente: 1, nombre: 'Juan', apellido: 'Ruiz', email: 'juan@example.com', telefono: '+54 11 4444-4444', created_at: '2024-02-01T00:00:00.000Z' },
  { id_cliente: 2, nombre: 'Lucía', apellido: 'Fernández', email: 'lucia@example.com', telefono: '+54 11 5555-5555', created_at: '2024-02-05T00:00:00.000Z' },
];

export const mockTurnos: TurnoDetalle[] = [
  {
    id_turno: 1,
    id_organizacion: ORG_ID,
    id_profesional: 1,
    id_servicio: 1,
    id_cliente: 1,
    fecha: todayISO(),
    hora_inicio: '10:00',
    hora_fin: '11:00',
    estado: 'CONFIRMADO',
    calendar_event_id: null,
    mail_confirmacion_enviado: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cliente_nombre: 'Juan',
    cliente_apellido: 'Ruiz',
    cliente_email: 'juan@example.com',
    cliente_telefono: '+54 11 4444-4444',
    profesional_nombre: 'Ana',
    profesional_apellido: 'López',
    servicio_nombre: 'Consulta',
    servicio_duracion_minutos: 60,
    servicio_precio: 5000,
  },
  {
    id_turno: 2,
    id_organizacion: ORG_ID,
    id_profesional: 2,
    id_servicio: 3,
    id_cliente: 2,
    fecha: todayISO(),
    hora_inicio: '11:00',
    hora_fin: '12:30',
    estado: 'PENDIENTE',
    calendar_event_id: null,
    mail_confirmacion_enviado: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cliente_nombre: 'Lucía',
    cliente_apellido: 'Fernández',
    cliente_email: 'lucia@example.com',
    cliente_telefono: '+54 11 5555-5555',
    profesional_nombre: 'Carlos',
    profesional_apellido: 'Pérez',
    servicio_nombre: 'Tratamiento intensivo',
    servicio_duracion_minutos: 90,
    servicio_precio: 8000,
  },
];

// --- helpers for mock seed ---
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function nextMonday(extraDays = 0): string {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (8 - day) % 7 || 7; // days until Monday
  d.setDate(d.getDate() + diff + extraDays);
  return d.toISOString().slice(0, 10);
}

// --- computed mock responses ---
export function mockDashboardResumen(): DashboardResumen {
  const today = todayISO();
  const now = new Date();
  const weekStart = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(now.getDate() + diff);
  const weekStartISO = weekStart.toISOString().slice(0, 10);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);

  return {
    turnos_hoy: mockTurnos.filter((t) => t.fecha === today && t.estado !== 'CANCELADO').length,
    turnos_semana: mockTurnos.filter((t) => t.fecha >= weekStartISO && t.fecha <= weekEndISO && t.estado !== 'CANCELADO').length,
    turnos_confirmados: mockTurnos.filter((t) => t.estado === 'CONFIRMADO').length,
    turnos_cancelados: mockTurnos.filter((t) => t.estado === 'CANCELADO').length,
    total_clientes: mockClientes.length,
  };
}

export { ORG_ID };
export type { EstadoTurno, DisponibilidadResponse };
