import { query, queryOne } from '../db/pool.js';
import type { ClienteRow } from '../types.js';

export const clienteRepository = {
  async findAll(): Promise<ClienteRow[]> {
    return query<ClienteRow>('SELECT * FROM cliente ORDER BY id_cliente');
  },

  async findByEmail(email: string): Promise<ClienteRow | null> {
    return queryOne<ClienteRow>('SELECT * FROM cliente WHERE LOWER(email) = LOWER($1)', [email]);
  },

  async create(data: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  }): Promise<ClienteRow> {
    const row = await queryOne<ClienteRow>(
      `INSERT INTO cliente (nombre, apellido, email, telefono)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.nombre, data.apellido, data.email, data.telefono],
    );
    if (!row) throw new Error('Error al crear cliente');
    return row;
  },

  async findOrCreate(data: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  }): Promise<ClienteRow> {
    const existing = await this.findByEmail(data.email);
    if (existing) return existing;
    return this.create(data);
  },
};
