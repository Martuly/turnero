import { query, queryOne } from '../db/pool.js';

export interface UsuarioRow {
  id_usuario: number;
  nombre: string;
  email: string;
  password_hash: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioOrgRow {
  id_usuario: number;
  id_organizacion: number;
  rol: string;
}

export const usuarioRepository = {
  async findByEmail(email: string): Promise<UsuarioRow | null> {
    return queryOne<UsuarioRow>(
      'SELECT * FROM usuario WHERE LOWER(email) = LOWER($1) AND activo = true',
      [email],
    );
  },

  async getOrganizaciones(idUsuario: number): Promise<UsuarioOrgRow[]> {
    return query<UsuarioOrgRow>(
      'SELECT * FROM usuario_organizacion WHERE id_usuario = $1',
      [idUsuario],
    );
  },
};
