import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  organizacionAdminRepository,
} from '../repository/organizacionAdminRepository.js';

declare module 'express-serve-static-core' {
  interface Request {
    tenant?: {
      idOrganizacion: number;
      nombre: string;
      slug: string;
      timezone: string;
    };
  }
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug =
      req.headers['x-tenant-slug'];

    if (
      !slug ||
      Array.isArray(slug)
    ) {
      return res.status(400).json({
        error:
          'Falta identificar la organización.',
      });
    }

    const organizacion =
      await organizacionAdminRepository.findBySlug(
        slug,
      );

    if (!organizacion) {
      return res.status(404).json({
        error:
          'Organización no encontrada.',
      });
    }

    req.tenant = {
      idOrganizacion:
        organizacion.id_organizacion,

      nombre:
        organizacion.nombre,

      slug:
        organizacion.slug,

      timezone:
        organizacion.timezone,
    };

    next();
  } catch (error) {
    console.error(
      'Error resolviendo tenant:',
      error,
    );

    return res.status(500).json({
      error:
        'No se pudo resolver la organización.',
    });
  }
}