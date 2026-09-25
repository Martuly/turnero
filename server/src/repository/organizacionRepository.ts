import { queryOne } from '../db/pool.js';
import type { OrganizacionRow } from '../types.js';

export const organizacionRepository = {
  async findPublicBySlug(
    slug: string,
  ): Promise<OrganizacionRow | null> {
    return queryOne<OrganizacionRow>(
      `SELECT
         id_organizacion,
         nombre,
         descripcion,
         email,
         telefono,
         activo,
         created_at,
         slug,
         nombre_publico,
         logo_url,
         timezone
       FROM organizacion
       WHERE lower(slug) = lower($1)
         AND activo = true
       LIMIT 1`,
      [slug],
    );
  },

  async findActiveById(
    idOrganizacion: number,
  ): Promise<OrganizacionRow | null> {
    return queryOne<OrganizacionRow>(
      `SELECT
         id_organizacion,
         nombre,
         descripcion,
         email,
         telefono,
         activo,
         created_at,
         slug,
         nombre_publico,
         logo_url,
         timezone
       FROM organizacion
       WHERE id_organizacion = $1
         AND activo = true
       LIMIT 1`,
      [idOrganizacion],
    );
  },
};