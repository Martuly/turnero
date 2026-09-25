// Shared domain types for AgendaPro

export type EstadoTurno = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'FINALIZADO' | 'AUSENTE';

export const ESTADOS_TURNO: EstadoTurno[] = [
  'PENDIENTE',
  'CONFIRMADO',
  'CANCELADO',
  'FINALIZADO',
  'AUSENTE',
];

export interface Organizacion {
  id_organizacion: number;
  nombre: string;
  descripcion: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

export interface Profesional {
  id_profesional: number;
  id_organizacion: number;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface Servicio {
  id_servicio: number;
  id_organizacion: number;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
}

export interface ProfesionalServicio {
  id_profesional: number;
  id_servicio: number;
}

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo

export const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export interface Disponibilidad {
  id_disponibilidad: number;
  id_profesional: number;
  dia_semana: DiaSemana;
  hora_desde: string; // "HH:MM"
  hora_hasta: string; // "HH:MM"
  activo: boolean;
}

export interface BloqueoAgenda {
  id_bloqueo: number;
  id_profesional: number;
  fecha_desde: string; // ISO date
  fecha_hasta: string; // ISO date
  hora_desde: string | null; // "HH:MM" | null (null = full day)
  hora_hasta: string | null;
  motivo: string;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  created_at: string;
}

export interface Turno {
  id_turno: number;
  id_organizacion: number;
  id_profesional: number;
  id_servicio: number;
  id_cliente: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  estado: EstadoTurno;
  calendar_event_id: string | null;
  mail_confirmacion_enviado: boolean;
  created_at: string;
  updated_at: string;
}

export interface TurnoDetalle extends Turno {
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  profesional_nombre?: string;
  profesional_apellido?: string;
  servicio_nombre?: string;
  servicio_duracion_minutos?: number;
  servicio_precio?: number;
}

export interface DashboardResumen {
  turnos_hoy: number;
  turnos_semana: number;
  turnos_confirmados: number;
  turnos_cancelados: number;
  total_clientes: number;
}

export interface DisponibilidadResponse {
  fecha: string;
  id_profesional: number | null;
  id_servicio: number;
  horarios: string[]; // ["09:00", "09:30", ...]
}

export interface CrearTurnoPayload {
  id_servicio: number;
  id_profesional: number | null;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
}

export interface CrearTurnoResponse {
  turno: TurnoDetalle;
}
