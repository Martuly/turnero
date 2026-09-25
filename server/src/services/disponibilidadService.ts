// Slot generation — mirrors the frontend availability logic but runs server-side
// using data fetched from the repository.
import { bloqueoRepository } from '../repository/bloqueoRepository.js';
import { disponibilidadRepository } from '../repository/disponibilidadRepository.js';
import { profesionalRepository } from '../repository/profesionalRepository.js';
import { servicioRepository } from '../repository/servicioRepository.js';
import { turnoRepository } from '../repository/turnoRepository.js';
import type { DisponibilidadResponse } from '../types.js';

const SLOT_INTERVAL = 30; // minutes

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
// JS Date.getDay(): 0=Sun..6=Sat — matches our dia_semana convention
function dayOfWeek(iso: string): number {
  return new Date(iso + 'T00:00:00').getDay();
}

function isBlocked(
  bloqueos: { fecha_desde: string; fecha_hasta: string; hora_desde: string | null; hora_hasta: string | null }[],
  iso: string,
  startMin: number,
  endMin: number,
): boolean {
  return bloqueos.some((b) => {
    if (iso < b.fecha_desde || iso > b.fecha_hasta) return false;
    if (b.hora_desde == null || b.hora_hasta == null) return true; // full day
    const bStart = toMinutes(b.hora_desde);
    const bEnd = toMinutes(b.hora_hasta);
    return startMin < bEnd && endMin > bStart;
  });
}

function overlapsExisting(
  turnos: { hora_inicio: string; hora_fin: string }[],
  startMin: number,
  endMin: number,
): boolean {
  return turnos.some((t) => {
    const tStart = toMinutes(t.hora_inicio);
    const tEnd = toMinutes(t.hora_fin);
    return startMin < tEnd && endMin > tStart;
  });
}

export async function getHorariosDisponibles(params: {
  idOrganizacion: number;
  idServicio: number;
  idProfesional: number | null;
  fecha: string;
  excludeTurnoId?: number;
}): Promise<DisponibilidadResponse> {
  const servicio = await servicioRepository.findById(
  params.idServicio,
  params.idOrganizacion,
);
  if (!servicio || !servicio.activo) {
    return { fecha: params.fecha, id_profesional: params.idProfesional, id_servicio: params.idServicio, horarios: [] };
  }

  // Determine candidate professionals
  let profIds: number[];
  if (params.idProfesional != null) {
    profIds = [params.idProfesional];
  } else {
    const profs =
    await profesionalRepository.getProfesionalesByServicio(
      params.idServicio,
      params.idOrganizacion,
    );
    profIds = profs.map((p) => p.id_profesional);
  }

  const dow = dayOfWeek(params.fecha);
  const duration = servicio.duracion_minutos;
  const slots = new Set<string>();

  for (const profId of profIds) {
    const dayRanges = await disponibilidadRepository.findByProfesionalAndDay(profId, dow);
    if (dayRanges.length === 0) continue;
    
    const turnos = await turnoRepository.findActiveByProfesionalAndDate(profId, params.fecha, );

    const turnosAConsiderar = params.excludeTurnoId
      ? turnos.filter(
          (t) => t.id_turno !== params.excludeTurnoId,
        )
      : turnos;

    const bloqueos = await bloqueoRepository.findByProfesionalAndDateRange(profId, params.fecha, params.fecha);

    for (const range of dayRanges) {
      const rangeStart = toMinutes(range.hora_desde);
      const rangeEnd = toMinutes(range.hora_hasta);
      for (let start = rangeStart; start + duration <= rangeEnd; start += SLOT_INTERVAL) {
        const end = start + duration;
        if (isBlocked(bloqueos, params.fecha, start, end)) continue;
        if (
          overlapsExisting(
            turnosAConsiderar,
            start,
            end,
          )
        ) {
          continue;
        }
        slots.add(toHHMM(start));
      }
    }
  }

  return {
    fecha: params.fecha,
    id_profesional: params.idProfesional,
    id_servicio: params.idServicio,
    horarios: Array.from(slots).sort(),
  };
}

export { toMinutes, toHHMM };
