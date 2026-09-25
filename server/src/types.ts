// Shared domain types (mirrors the frontend types)
export type EstadoTurno = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'FINALIZADO' | 'AUSENTE';

export const ESTADOS_TURNO: EstadoTurno[] = [
  'PENDIENTE',
  'CONFIRMADO',
  'CANCELADO',
  'FINALIZADO',
  'AUSENTE',
];


export interface ProfesionalRow {
  id_profesional: number;
  id_organizacion: number;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface ServicioRow {
  id_servicio: number;
  id_organizacion: number;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
}

export interface DisponibilidadRow {
  id_disponibilidad: number;
  id_profesional: number;
  dia_semana: number;
  hora_desde: string;
  hora_hasta: string;
  activo: boolean;
}

export interface BloqueoRow {
  id_bloqueo: number;
  id_profesional: number;
  fecha_desde: string;
  fecha_hasta: string;
  hora_desde: string | null;
  hora_hasta: string | null;
  motivo: string;
}

export interface ClienteRow {
  id_cliente: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  created_at: string;
}

export interface TurnoRow {
  id_turno: number;
  id_organizacion: number;
  id_profesional: number;
  id_servicio: number;
  id_cliente: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoTurno;
  calendar_event_id: string | null;
  token_gestion: string | null;
  fecha_confirmacion: string | null;
  fecha_cancelacion: string | null;
  motivo_cancelacion: string | null;
  mail_confirmacion_enviado: boolean;
  created_at: string;
  updated_at: string;
}

export interface TurnoDetalleRow extends TurnoRow {
  cliente_nombre: string | null;
  cliente_apellido: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  profesional_nombre: string | null;
  profesional_apellido: string | null;
  servicio_nombre: string | null;
  servicio_duracion_minutos: number | null;
  servicio_precio: number | null;
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
  horarios: string[];
}

export interface CrearTurnoPayload {
  id_servicio: number;
  id_profesional: number | null;
  fecha: string;
  hora_inicio: string;
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
}

export interface OrganizacionRow {
  id_organizacion: number;
  nombre: string;
  descripcion: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: Date;
  slug: string | null;
  nombre_publico: string | null;
  logo_url: string | null;
  timezone: string | null;
}