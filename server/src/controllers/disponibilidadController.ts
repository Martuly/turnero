import type {
  Request,
  Response,
} from 'express';

import {
  asyncHandler,
  HttpError,
} from '../middleware/errorHandler.js';

import {
  disponibilidadRepository,
} from '../repository/disponibilidadRepository.js';

import {
  profesionalRepository,
} from '../repository/profesionalRepository.js';

export const disponibilidadController = {
  list: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const idProfesional =
        req.query.idProfesional
          ? Number(
              req.query.idProfesional,
            )
          : undefined;

      if (
        !idProfesional ||
        !Number.isSafeInteger(
          idProfesional,
        ) ||
        idProfesional <= 0
      ) {
        throw new HttpError(
          'idProfesional es obligatorio y debe ser válido.',
          400,
        );
      }

      if (!req.tenant) {
        throw new HttpError(
          'No se pudo identificar la organización.',
          400,
        );
      }

      const profesional =
        await profesionalRepository
          .findById(
            idProfesional,
            req.tenant.idOrganizacion,
          );

      if (!profesional) {
        throw new HttpError(
          'El profesional no pertenece a la organización.',
          404,
        );
      }

      const items =
        await disponibilidadRepository
          .findByProfesional(
            idProfesional,
          );

      res.json(items);
    },
  ),

  replace: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const idProfesional =
        req.query.idProfesional
          ? Number(
              req.query.idProfesional,
            )
          : undefined;

      if (
        !idProfesional ||
        !Number.isSafeInteger(
          idProfesional,
        ) ||
        idProfesional <= 0
      ) {
        throw new HttpError(
          'idProfesional es obligatorio y debe ser válido.',
          400,
        );
      }

      if (!req.tenant) {
        throw new HttpError(
          'No se pudo identificar la organización.',
          400,
        );
      }

      const profesional =
        await profesionalRepository
          .findById(
            idProfesional,
            req.tenant.idOrganizacion,
          );

      if (!profesional) {
        throw new HttpError(
          'El profesional no pertenece a la organización.',
          404,
        );
      }

      const items = req.body;

      if (!Array.isArray(items)) {
        throw new HttpError(
          'El body debe ser un array de franjas horarias.',
          400,
        );
      }

      const result =
        await disponibilidadRepository
          .replaceForProfesional(
            idProfesional,
            items.map(
              (it: {
                dia_semana: number;
                hora_desde: string;
                hora_hasta: string;
                activo: boolean;
              }) => ({
                dia_semana:
                  it.dia_semana,

                hora_desde:
                  it.hora_desde,

                hora_hasta:
                  it.hora_hasta,

                activo:
                  it.activo,
              }),
            ),
          );

      res.json(result);
    },
  ),
};