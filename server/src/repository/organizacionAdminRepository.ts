import {
  queryOne,
} from '../db/pool.js';

export interface OrganizacionAdminRow {
  id_organizacion: number;
  nombre: string;
  descripcion: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
  slug: string;
  nombre_publico: string | null;
  logo_url: string | null;
  timezone: string;
}

export const organizacionAdminRepository = {
  async findBySlug(
    slug: string,
  ): Promise<OrganizacionAdminRow | null> {
    return queryOne<OrganizacionAdminRow>(
      `
        SELECT
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
        WHERE slug = $1
          AND activo = true
        LIMIT 1
      `,
      [slug],
    );
  },
};