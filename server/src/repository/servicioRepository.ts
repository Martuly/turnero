import { query, queryOne } from '../db/pool.js';
import type { ServicioRow } from '../types.js';

export const servicioRepository = {
  async findAll(idOrganizacion: number): Promise<ServicioRow[]> {
    return query<ServicioRow>(
      `SELECT *
       FROM servicio
       WHERE id_organizacion = $1
       ORDER BY id_servicio`,
      [idOrganizacion],
    );
  },

  async findAllActive(idOrganizacion: number): Promise<ServicioRow[]> {
    return query<ServicioRow>(
      `SELECT *
       FROM servicio
       WHERE id_organizacion = $1
         AND activo = true
       ORDER BY nombre`,
      [idOrganizacion],
    );
  },

  async findById(
    id: number,
    idOrganizacion: number,
  ): Promise<ServicioRow | null> {
    return queryOne<ServicioRow>(
      `SELECT *
       FROM servicio
       WHERE id_servicio = $1
         AND id_organizacion = $2`,
      [id, idOrganizacion],
    );
  },

  async create(data: {
    id_organizacion: number;
    nombre: string;
    descripcion: string | null;
    duracion_minutos: number;
    precio: number;
    activo: boolean;
  }): Promise<ServicioRow> {
    const row = await queryOne<ServicioRow>(
      `INSERT INTO servicio (
        id_organizacion,
        nombre,
        descripcion,
        duracion_minutos,
        precio,
        activo
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.id_organizacion,
        data.nombre,
        data.descripcion,
        data.duracion_minutos,
        data.precio,
        data.activo,
      ],
    );

    if (!row) {
      throw new Error('Error al crear servicio');
    }

    return row;
  },

  async update(
    id: number,
    idOrganizacion: number,
    data: {
      nombre?: string;
      descripcion?: string | null;
      duracion_minutos?: number;
      precio?: number;
      activo?: boolean;
    },
  ): Promise<ServicioRow | null> {
    const existing = await this.findById(id, idOrganizacion);

    if (!existing) {
      return null;
    }

    return queryOne<ServicioRow>(
      `UPDATE servicio
       SET nombre = $1,
           descripcion = $2,
           duracion_minutos = $3,
           precio = $4,
           activo = $5
       WHERE id_servicio = $6
         AND id_organizacion = $7
       RETURNING *`,
      [
        data.nombre ?? existing.nombre,
        data.descripcion ?? existing.descripcion,
        data.duracion_minutos ?? existing.duracion_minutos,
        data.precio ?? existing.precio,
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
    const row = await queryOne<{ id_servicio: number }>(
      `UPDATE servicio
      SET activo = false
      WHERE id_servicio = $1
        AND id_organizacion = $2
      RETURNING id_servicio`,
      [id, idOrganizacion],
    );

    return row !== null;
  },
};