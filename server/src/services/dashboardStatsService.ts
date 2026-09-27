import { query } from '../db/pool.js';

interface StatsRow {
  fecha: string;
  hora: number;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'FINALIZADO' | 'AUSENTE';
  servicio: string;
  profesional: string;
}

export const dashboardStatsService = {
  async getStats(idOrganizacion: number, desde: string, hasta: string, idProfesional?: number) {
    const rows = await query<StatsRow>(
      `SELECT t.fecha::text AS fecha, EXTRACT(HOUR FROM t.hora_inicio)::int AS hora,
              t.estado, s.nombre AS servicio,
              p.nombre || ' ' || p.apellido AS profesional
       FROM turno t
       JOIN servicio s ON s.id_servicio = t.id_servicio
       JOIN profesional p ON p.id_profesional = t.id_profesional
       WHERE t.id_organizacion = $1 AND t.fecha BETWEEN $2::date AND $3::date
         AND ($4::int IS NULL OR t.id_profesional = $4)
       ORDER BY t.fecha, t.hora_inicio`,
      [idOrganizacion, desde, hasta, idProfesional ?? null],
    );
    const estados = { PENDIENTE: 0, CONFIRMADO: 0, CANCELADO: 0, FINALIZADO: 0, AUSENTE: 0 };
    const porDia = new Map<string, number>();
    const porServicio = new Map<string, number>();
    const porHora = new Map<number, number>();
    for (const row of rows) {
      estados[row.estado]++;
      if (row.estado === 'CANCELADO') continue;
      porDia.set(row.fecha, (porDia.get(row.fecha) ?? 0) + 1);
      porServicio.set(row.servicio, (porServicio.get(row.servicio) ?? 0) + 1);
      porHora.set(row.hora, (porHora.get(row.hora) ?? 0) + 1);
    }
    return {
      desde, hasta, total: rows.length, estados,
      por_dia: [...porDia].map(([fecha, cantidad]) => ({ fecha, cantidad })),
      por_servicio: [...porServicio].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5),
      por_hora: [...porHora].map(([hora, cantidad]) => ({ hora, cantidad })).sort((a, b) => a.hora - b.hora),
    };
  },
};
