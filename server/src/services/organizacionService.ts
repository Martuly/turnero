import {
  organizacionAdminRepository,
} from '../repository/organizacionAdminRepository.js';

function normalizarSlug(
  slug: string,
): string {
  return slug
    .trim()
    .toLowerCase();
}

export const organizacionService = {
  async obtenerPorSlug(
    slug: string,
  ) {
    const slugNormalizado =
      normalizarSlug(slug);

    if (!slugNormalizado) {
      const error =
        new Error(
          'El slug de la organización es obligatorio.',
        );

      Object.assign(
        error,
        {
          statusCode: 400,
        },
      );

      throw error;
    }

    const organizacion =
      await organizacionAdminRepository
        .findBySlug(
          slugNormalizado,
        );

    if (!organizacion) {
      const error =
        new Error(
          'Organización no encontrada.',
        );

      Object.assign(
        error,
        {
          statusCode: 404,
        },
      );

      throw error;
    }

    return organizacion;
  },

  async obtenerPublicaPorSlug(
    slug: string,
  ) {
    const organizacion =
      await this.obtenerPorSlug(
        slug,
      );

    return {
      idOrganizacion:
        organizacion.id_organizacion,

      nombre:
        organizacion.nombre,

      nombrePublico:
        organizacion.nombre_publico,

      slug:
        organizacion.slug,

      logoUrl:
        organizacion.logo_url,

      timezone:
        organizacion.timezone,
    };
  },
};