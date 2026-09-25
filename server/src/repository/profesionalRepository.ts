import {
  query,
  queryOne,
  withTransaction,
  type PoolClient,
} from '../db/pool.js';

import type {
  ProfesionalRow,
  ServicioRow,
} from '../types.js';

export const profesionalRepository = {
  async findAll(
    idOrganizacion: number,
  ): Promise<ProfesionalRow[]> {
    return query<ProfesionalRow>(
      `SELECT *
       FROM profesional
       WHERE id_organizacion = $1
       ORDER BY id_profesional`,
      [idOrganizacion],
    );
  },

  async findAllActive(
    idOrganizacion: number,
  ): Promise<ProfesionalRow[]> {
    return query<ProfesionalRow>(
      `SELECT *
       FROM profesional
       WHERE id_organizacion = $1
         AND activo = true
       ORDER BY id_profesional`,
      [idOrganizacion],
    );
  },

  async findById(
    id: number,
    idOrganizacion: number,
  ): Promise<ProfesionalRow | null> {
    return queryOne<ProfesionalRow>(
      `SELECT *
       FROM profesional
       WHERE id_profesional = $1
         AND id_organizacion = $2`,
      [id, idOrganizacion],
    );
  },

  async create(data: {
    id_organizacion: number;
    nombre: string;
    apellido: string;
    email: string | null;
    telefono: string | null;
    activo: boolean;
  }): Promise<ProfesionalRow> {
    const row = await queryOne<ProfesionalRow>(
      `INSERT INTO profesional (
        id_organizacion,
        nombre,
        apellido,
        email,
        telefono,
        activo
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.id_organizacion,
        data.nombre,
        data.apellido,
        data.email,
        data.telefono,
        data.activo,
      ],
    );

    if (!row) {
      throw new Error('Error al crear profesional');
    }

    return row;
  },

  async update(
    id: number,
    idOrganizacion: number,
    data: {
      nombre?: string;
      apellido?: string;
      email?: string | null;
      telefono?: string | null;
      activo?: boolean;
    },
  ): Promise<ProfesionalRow | null> {
    const existing = await this.findById(
      id,
      idOrganizacion,
    );

    if (!existing) {
      return null;
    }

    return queryOne<ProfesionalRow>(
      `UPDATE profesional
       SET nombre = $1,
           apellido = $2,
           email = $3,
           telefono = $4,
           activo = $5
       WHERE id_profesional = $6
         AND id_organizacion = $7
       RETURNING *`,
      [
        data.nombre ?? existing.nombre,
        data.apellido ?? existing.apellido,
        data.email ?? existing.email,
        data.telefono ?? existing.telefono,
        data.activo ?? existing.activo,
        id,
        idOrganizacion,
      ],
    );
  },

  async delete(
    id: number,
    idOrganizacion: number,
  ): Promise<boolean> {
    const rows = await query<{ id_profesional: number }>(
      `DELETE FROM profesional
       WHERE id_profesional = $1
         AND id_organizacion = $2
       RETURNING id_profesional`,
      [id, idOrganizacion],
    );

    return rows.length > 0;
  },

  async getServiciosByProfesional(
    idProfesional: number,
    idOrganizacion: number,
  ): Promise<ServicioRow[]> {
    return query<ServicioRow>(
      `SELECT s.*
       FROM servicio s
       JOIN profesional_servicio ps
         ON ps.id_servicio = s.id_servicio
       JOIN profesional p
         ON p.id_profesional = ps.id_profesional
       WHERE ps.id_profesional = $1
         AND p.id_organizacion = $2
         AND s.id_organizacion = $2
       ORDER BY s.id_servicio`,
      [idProfesional, idOrganizacion],
    );
  },

  async getProfesionalesByServicio(
    idServicio: number,
    idOrganizacion: number,
  ): Promise<ProfesionalRow[]> {
    return query<ProfesionalRow>(
      `SELECT p.*
       FROM profesional p
       JOIN profesional_servicio ps
         ON ps.id_profesional = p.id_profesional
       JOIN servicio s
         ON s.id_servicio = ps.id_servicio
       WHERE ps.id_servicio = $1
         AND p.id_organizacion = $2
         AND s.id_organizacion = $2
         AND p.activo = true
       ORDER BY p.id_profesional`,
      [idServicio, idOrganizacion],
    );
  },

  async replaceServiciosProfesional(
    idProfesional: number,
    idOrganizacion: number,
    idServicios: number[],
  ): Promise<boolean> {
    const profesional = await this.findById(
      idProfesional,
      idOrganizacion,
    );

    if (!profesional) {
      return false;
    }

    await withTransaction(async (client: PoolClient) => {
      await client.query(
        `DELETE FROM profesional_servicio
         WHERE id_profesional = $1`,
        [idProfesional],
      );

      for (const idServicio of idServicios) {
        const servicio = await client.query(
          `SELECT id_servicio
           FROM servicio
           WHERE id_servicio = $1
             AND id_organizacion = $2`,
          [idServicio, idOrganizacion],
        );

        if (servicio.rowCount === 0) {
          throw new Error(
            `El servicio ${idServicio} no pertenece a la organización.`,
          );
        }

        await client.query(
          `INSERT INTO profesional_servicio (
            id_profesional,
            id_servicio
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING`,
          [idProfesional, idServicio],
        );
      }
    });

    return true;
  },
};