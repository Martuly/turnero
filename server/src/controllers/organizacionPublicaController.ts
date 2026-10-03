import type {
  Request,
  Response,
} from 'express';

import {
  organizacionService,
} from '../services/organizacionService.js';

export const organizacionPublicaController = {
  async getBySlug(
    req: Request,
    res: Response,
  ) {
    try {
      const { slug } =
        req.params;

      const organizacion =
        await organizacionService
          .obtenerPublicaPorSlug(
            slug,
          );

      return res.json(
        organizacion,
      );
    } catch (error) {
      const statusCode =
        (
          error as {
            statusCode?: number;
          }
        ).statusCode ?? 500;

      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo obtener la organización.';

      console.error(
        'Error obteniendo organización pública:',
        error,
      );

      return res
        .status(statusCode)
        .json({
          error: message,
        });
    }
  },
};