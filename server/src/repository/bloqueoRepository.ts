import { query, queryOne } from '../db/pool.js';
import type { BloqueoRow } from '../types.js';

export const bloqueoRepository = {
  async findAll(idProfesional?: number): Promise<BloqueoRow[]> {
    if (idProfesional != null) {
      return query<BloqueoRow>(
        'SELECT * FROM bloqueo_agenda WHERE id_profesional = $1 ORDER BY fecha_desde',
        [idProfesional],
      );
    }
    return query<BloqueoRow>('SELECT * FROM bloqueo_agenda ORDER BY fecha_desde');
  },

  async findByProfesionalAndDateRange(
    idProfesional: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<BloqueoRow[]> {
    return query<BloqueoRow>(
      `SELECT * FROM bloqueo_agenda
       WHERE id_profesional = $1 AND fecha_desde <= $2 AND fecha_hasta >= $3
       ORDER BY fecha_desde`,
      [idProfesional, fechaHasta, fechaDesde],
    );
  },

  async create(data: {
    id_profesional: number;
    fecha_desde: string;
    fecha_hasta: string;
    hora_desde: string | null;
    hora_hasta: string | null;
    motivo: string;
  }): Promise<BloqueoRow> {
    const row = await queryOne<BloqueoRow>(
      `INSERT INTO bloqueo_agenda (id_profesional, fecha_desde, fecha_hasta, hora_desde, hora_hasta, motivo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.id_profesional, data.fecha_desde, data.fecha_hasta, data.hora_desde, data.hora_hasta, data.motivo],
    );
    if (!row) throw new Error('Error al crear bloqueo');
    return row;
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM bloqueo_agenda WHERE id_bloqueo = $1', [id]);
  },
};
