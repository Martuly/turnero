import type {
  Request,
  Response,
} from 'express';

import {
  asyncHandler,
  HttpError,
} from '../middleware/errorHandler.js';

import {
  dashboardService,
} from '../services/dashboardService.js';

import {
  dashboardStatsService,
} from '../services/dashboardStatsService.js';

export const dashboardController = {
  estadisticas: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      if (!req.tenant) {
        throw new HttpError(
          'No se pudo identificar la organización.',
          400,
        );
      }

      const desde =
        String(
          req.query.desde ?? '',
        );

      const hasta =
        String(
          req.query.hasta ?? '',
        );

      const profesional =
        req.query.idProfesional;

      const datePattern =
        /^\d{4}-\d{2}-\d{2}$/;

      const start =
        new Date(
          `${desde}T00:00:00Z`,
        );

      const end =
        new Date(
          `${hasta}T00:00:00Z`,
        );

      const days =
        (
          end.getTime() -
          start.getTime()
        ) / 86400000;

      if (
        !datePattern.test(desde) ||
        !datePattern.test(hasta) ||
        !Number.isFinite(days) ||
        days < 0 ||
        days > 89 ||
        start
          .toISOString()
          .slice(0, 10) !== desde ||
        end
          .toISOString()
          .slice(0, 10) !== hasta
      ) {
        res.status(400).json({
          error:
            'Ingresá un período válido de hasta 90 días.',
        });

        return;
      }

      const idProfesional =
        profesional == null
          ? undefined
          : Number(profesional);

      if (
        idProfesional !== undefined &&
        (
          !Number.isSafeInteger(
            idProfesional,
          ) ||
          idProfesional <= 0
        )
      ) {
        res.status(400).json({
          error:
            'Profesional inválido.',
        });

        return;
      }

      const stats =
        await dashboardStatsService
          .getStats(
            req.tenant.idOrganizacion,
            desde,
            hasta,
            idProfesional,
          );

      res.json(stats);
    },
  ),

  resumen: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      if (!req.tenant) {
        throw new HttpError(
          'No se pudo identificar la organización.',
          400,
        );
      }

      const resumen =
        await dashboardService
          .getResumen(
            req.tenant.idOrganizacion,
          );

      res.json(resumen);
    },
  ),
};