import {
  query,
  queryOne,
} from '../db/pool.js';

import type {
  BloqueoRow,
} from '../types.js';

export const bloqueoRepository = {
  // =====================================================
  // LISTAR BLOQUEOS DE UNA ORGANIZACION
  // Opcionalmente filtra por profesional
  // =====================================================

  async findAll(
    idOrganizacion: number,
    idProfesional?: number,
  ): Promise<BloqueoRow[]> {
    if (idProfesional != null) {
      return query<BloqueoRow>(
        `
          SELECT b.*
          FROM bloqueo_agenda b
          JOIN profesional p
            ON p.id_profesional = b.id_profesional
          WHERE p.id_organizacion = $1
            AND b.id_profesional = $2
          ORDER BY b.fecha_desde
        `,
        [
          idOrganizacion,
          idProfesional,
        ],
      );
    }

    return query<BloqueoRow>(
      `
        SELECT b.*
        FROM bloqueo_agenda b
        JOIN profesional p
          ON p.id_profesional = b.id_profesional
        WHERE p.id_organizacion = $1
        ORDER BY b.fecha_desde
      `,
      [
        idOrganizacion,
      ],
    );
  },

  // =====================================================
  // BUSCAR BLOQUEOS DE UN PROFESIONAL EN UN RANGO
  // =====================================================

  async findByProfesionalAndDateRange(
    idOrganizacion: number,
    idProfesional: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<BloqueoRow[]> {
    return query<BloqueoRow>(
      `
        SELECT b.*
        FROM bloqueo_agenda b
        JOIN profesional p
          ON p.id_profesional = b.id_profesional
        WHERE p.id_organizacion = $1
          AND b.id_profesional = $2
          AND b.fecha_desde <= $3
          AND b.fecha_hasta >= $4
        ORDER BY b.fecha_desde
      `,
      [
        idOrganizacion,
        idProfesional,
        fechaHasta,
        fechaDesde,
      ],
    );
  },

  // =====================================================
  // CREAR BLOQUEO
  // Solo permite crear si el profesional pertenece
  // a la organizacion indicada
  // =====================================================

  async create(
    idOrganizacion: number,
    data: {
      id_profesional: number;
      fecha_desde: string;
      fecha_hasta: string;
      hora_desde: string | null;
      hora_hasta: string | null;
      motivo: string;
    },
  ): Promise<BloqueoRow> {
    const row =
      await queryOne<BloqueoRow>(
        `
          INSERT INTO bloqueo_agenda (
            id_profesional,
            fecha_desde,
            fecha_hasta,
            hora_desde,
            hora_hasta,
            motivo
          )
          SELECT
            p.id_profesional,
            $3,
            $4,
            $5,
            $6,
            $7
          FROM profesional p
          WHERE p.id_profesional = $1
            AND p.id_organizacion = $2
          RETURNING *
        `,
        [
          data.id_profesional,
          idOrganizacion,
          data.fecha_desde,
          data.fecha_hasta,
          data.hora_desde,
          data.hora_hasta,
          data.motivo,
        ],
      );

    if (!row) {
      throw new Error(
        'No se pudo crear el bloqueo. El profesional no pertenece a la organización.',
      );
    }

    return row;
  },

  // =====================================================
  // ELIMINAR BLOQUEO
  // Solo elimina si pertenece a un profesional
  // de la organizacion indicada
  // =====================================================

  async delete(
    id: number,
    idOrganizacion: number,
  ): Promise<boolean> {
    const row =
      await queryOne<{
        id_bloqueo: number;
      }>(
        `
          DELETE FROM bloqueo_agenda b
          USING profesional p
          WHERE b.id_bloqueo = $1
            AND b.id_profesional = p.id_profesional
            AND p.id_organizacion = $2
          RETURNING b.id_bloqueo
        `,
        [
          id,
          idOrganizacion,
        ],
      );

    return Boolean(row);
  },
};