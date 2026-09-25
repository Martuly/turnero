import { query, queryOne, withTransaction, type PoolClient } from '../db/pool.js';
import type { DisponibilidadRow } from '../types.js';

export const disponibilidadRepository = {
  async findByProfesional(idProfesional: number): Promise<DisponibilidadRow[]> {
    return query<DisponibilidadRow>(
      'SELECT * FROM disponibilidad WHERE id_profesional = $1 ORDER BY dia_semana, hora_desde',
      [idProfesional],
    );
  },

  async findByProfesionalAndDay(idProfesional: number, diaSemana: number): Promise<DisponibilidadRow[]> {
    return query<DisponibilidadRow>(
      'SELECT * FROM disponibilidad WHERE id_profesional = $1 AND dia_semana = $2 AND activo = true ORDER BY hora_desde',
      [idProfesional, diaSemana],
    );
  },

  async replaceForProfesional(
    idProfesional: number,
    items: { dia_semana: number; hora_desde: string; hora_hasta: string; activo: boolean }[],
  ): Promise<DisponibilidadRow[]> {
    await withTransaction(async (client: PoolClient) => {
      await client.query('DELETE FROM disponibilidad WHERE id_profesional = $1', [idProfesional]);
      for (const it of items) {
        await client.query(
          `INSERT INTO disponibilidad (id_profesional, dia_semana, hora_desde, hora_hasta, activo)
           VALUES ($1, $2, $3, $4, $5)`,
          [idProfesional, it.dia_semana, it.hora_desde, it.hora_hasta, it.activo],
        );
      }
    });
    return this.findByProfesional(idProfesional);
  },
};
