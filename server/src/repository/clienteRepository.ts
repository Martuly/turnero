import {
  query,
  queryOne,
} from '../db/pool.js';

import type {
  ClienteRow,
} from '../types.js';

export const clienteRepository = {
  async findAll(
    idOrganizacion: number,
  ): Promise<ClienteRow[]> {
    return query<ClienteRow>(
      `
        SELECT *
        FROM cliente
        WHERE id_organizacion = $1
        ORDER BY id_cliente
      `,
      [idOrganizacion],
    );
  },

  async findByEmail(
    email: string,
    idOrganizacion: number,
  ): Promise<ClienteRow | null> {
    return queryOne<ClienteRow>(
      `
        SELECT *
        FROM cliente
        WHERE id_organizacion = $1
          AND LOWER(email) = LOWER($2)
        LIMIT 1
      `,
      [
        idOrganizacion,
        email,
      ],
    );
  },

  async create(data: {
    id_organizacion: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  }): Promise<ClienteRow> {
    const row =
      await queryOne<ClienteRow>(
        `
          INSERT INTO cliente (
            id_organizacion,
            nombre,
            apellido,
            email,
            telefono
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        [
          data.id_organizacion,
          data.nombre,
          data.apellido,
          data.email,
          data.telefono,
        ],
      );

    if (!row) {
      throw new Error(
        'Error al crear cliente',
      );
    }

    return row;
  },

  async findOrCreate(data: {
    id_organizacion: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  }): Promise<ClienteRow> {
    const existing =
      await this.findByEmail(
        data.email,
        data.id_organizacion,
      );

    if (existing) {
      return existing;
    }

    return this.create(data);
  },
};