// Availability calculation used by MOCK MODE. The backend has an equivalent
// implementation in SQL/repository, but we replicate the logic here so the
// public booking page works fully without a server.
import type {
  BloqueoAgenda,
  Disponibilidad,
  ProfesionalServicio,
  Servicio,
  Turno,
} from '@/types';
import { APP_CONFIG } from '@/config/app';

const SLOT = APP_CONFIG.slotIntervalMinutes; // 30

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
// JS getDay(): 0=Sun..6=Sat. Our dia_semana uses the same mapping.
function dayOfWeekISO(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  return d.getDay();
}

function isBlocked(
  profesionalId: number,
  iso: string,
  startMin: number,
  endMin: number,
  bloqueos: BloqueoAgenda[],
): boolean {
  return bloqueos.some((b) => {
    if (b.id_profesional !== profesionalId) return false;
    if (iso < b.fecha_desde || iso > b.fecha_hasta) return false;
    if (b.hora_desde == null || b.hora_hasta == null) return true; // full-day block
    const bStart = toMinutes(b.hora_desde);
    const bEnd = toMinutes(b.hora_hasta);
    return startMin < bEnd && endMin > bStart;
  });
}

function overlapsExisting(
  profesionalId: number,
  iso: string,
  startMin: number,
  endMin: number,
  turnos: Turno[],
): boolean {
  return turnos.some((t) => {
    if (t.id_profesional !== profesionalId) return false;
    if (t.fecha !== iso) return false;
    if (t.estado === 'CANCELADO') return false;
    const tStart = toMinutes(t.hora_inicio);
    const tEnd = toMinutes(t.hora_fin);
    return startMin < tEnd && endMin > tStart;
  });
}

export interface AvailabilityParams {
  fecha: string; // YYYY-MM-DD
  idServicio: number;
  idProfesional: number | null;
  servicios: Servicio[];
  profesionalServicio: ProfesionalServicio[];
  disponibilidad: Disponibilidad[];
  turnos: Turno[];
  bloqueos: BloqueoAgenda[];
}

export function computeAvailableSlots(params: AvailabilityParams): string[] {
  const { fecha, idServicio, idProfesional, servicios, profesionalServicio, disponibilidad, turnos, bloqueos } = params;
  const servicio = servicios.find((s) => s.id_servicio === idServicio);
  if (!servicio || !servicio.activo) return [];

  // Determine candidate professionals
  let profIds: number[] = [];
  if (idProfesional != null) {
    profIds = [idProfesional];
  } else {
    profIds = profesionalServicio
      .filter((ps) => ps.id_servicio === idServicio)
      .map((ps) => ps.id_profesional);
  }

  const dow = dayOfWeekISO(fecha);
  const duration = servicio.duracion_minutos;
  const slots = new Set<string>();

  for (const profId of profIds) {
    const dayRanges = disponibilidad.filter(
      (d) => d.id_profesional === profId && d.dia_semana === dow && d.activo,
    );
    for (const range of dayRanges) {
      const rangeStart = toMinutes(range.hora_desde);
      const rangeEnd = toMinutes(range.hora_hasta);
      for (let start = rangeStart; start + duration <= rangeEnd; start += SLOT) {
        const end = start + duration;
        if (isBlocked(profId, fecha, start, end, bloqueos)) continue;
        if (overlapsExisting(profId, fecha, start, end, turnos)) continue;
        slots.add(toHHMM(start));
      }
    }
  }

  return Array.from(slots).sort();
}

export function isDateAvailable(
  fecha: string,
  idServicio: number,
  idProfesional: number | null,
  servicios: Servicio[],
  profesionalServicio: ProfesionalServicio[],
  disponibilidad: Disponibilidad[],
  turnos: Turno[],
  bloqueos: BloqueoAgenda[],
): boolean {
  return (
    computeAvailableSlots({
      fecha,
      idServicio,
      idProfesional,
      servicios,
      profesionalServicio,
      disponibilidad,
      turnos,
      bloqueos,
    }).length > 0
  );
}

export { toMinutes, toHHMM };
