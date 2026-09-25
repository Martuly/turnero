import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { organizacionService } from '../services/organizacionService.js';

export async function obtenerOrganizacionPublica(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { slug } = req.params;

    const organizacion =
      await organizacionService.obtenerPublicaPorSlug(slug);

    res.status(200).json(organizacion);
  } catch (error) {
    next(error);
  }
}