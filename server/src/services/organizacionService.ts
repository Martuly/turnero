import { organizacionRepository } from '../repository/organizacionRepository.js';

function normalizarSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export const organizacionService = {
  async obtenerPorSlug(slug: string) {
    const slugNormalizado = normalizarSlug(slug);

    if (!slugNormalizado) {
      const error = new Error(
        'El slug de la organización es obligatorio.',
      );

      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const organizacion =
      await organizacionRepository.findPublicBySlug(
        slugNormalizado,
      );

    if (!organizacion) {
      const error = new Error(
        'Organización no encontrada.',
      );

      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return organizacion;
  },

  async obtenerPublicaPorSlug(slug: string) {
    const organizacion = await this.obtenerPorSlug(slug);

    return {
      idOrganizacion: organizacion.id_organizacion,
      nombre:
        organizacion.nombre_publico ??
        organizacion.nombre,
      descripcion: organizacion.descripcion,
      email: organizacion.email,
      telefono: organizacion.telefono,
      slug: organizacion.slug,
      logoUrl: organizacion.logo_url,
      timezone:
        organizacion.timezone ??
        'America/Argentina/Buenos_Aires',
    };
  },
};