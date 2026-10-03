import {
  queryOne,
} from '../db/pool.js';

import type {
  DashboardResumen,
} from '../types.js';

export const dashboardService = {
  async getResumen(
    idOrganizacion: number,
  ): Promise<DashboardResumen> {
    const [
      turnosHoy,
      turnosSemana,
      confirmados,
      cancelados,
      clientes,
    ] = await Promise.all([
      queryOne<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM turno
          WHERE id_organizacion = $1
            AND fecha = CURRENT_DATE
            AND estado != 'CANCELADO'
        `,
        [idOrganizacion],
      ),

      queryOne<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM turno
          WHERE id_organizacion = $1
            AND fecha >= date_trunc(
              'week',
              CURRENT_DATE
            )
            AND fecha <
              date_trunc(
                'week',
                CURRENT_DATE
              ) + interval '7 days'
            AND estado != 'CANCELADO'
        `,
        [idOrganizacion],
      ),

      queryOne<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM turno
          WHERE id_organizacion = $1
            AND estado = 'CONFIRMADO'
        `,
        [idOrganizacion],
      ),

      queryOne<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM turno
          WHERE id_organizacion = $1
            AND estado = 'CANCELADO'
        `,
        [idOrganizacion],
      ),

      queryOne<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM cliente
          WHERE id_organizacion = $1
        `,
        [idOrganizacion],
      ),
    ]);

    return {
      turnos_hoy: Number(
        turnosHoy?.count ?? 0,
      ),

      turnos_semana: Number(
        turnosSemana?.count ?? 0,
      ),

      turnos_confirmados: Number(
        confirmados?.count ?? 0,
      ),

      turnos_cancelados: Number(
        cancelados?.count ?? 0,
      ),

      total_clientes: Number(
        clientes?.count ?? 0,
      ),
    };
  },
};