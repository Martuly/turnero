import type {
  Request,
  Response,
} from 'express';

import {
  asyncHandler,
  HttpError,
} from '../middleware/errorHandler.js';

import {
  bloqueoRepository,
} from '../repository/bloqueoRepository.js';

function obtenerIdOrganizacion(
  req: Request,
): number {
  const idOrganizacion =
    req.authUser?.idOrganizacion;

  if (!idOrganizacion) {
    throw new HttpError(
      'No se pudo identificar la organización.',
      401,
    );
  }

  return idOrganizacion;
}

function validarId(
  value: string | undefined,
): number {
  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new HttpError(
      'El identificador no es válido.',
      400,
    );
  }

  return id;
}

export const bloqueoController = {
  list: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const idOrganizacion =
        obtenerIdOrganizacion(
          req,
        );

      const idProfesional =
        req.query.idProfesional
          ? Number(
              req.query.idProfesional,
            )
          : undefined;

      if (
        idProfesional !== undefined &&
        (
          !Number.isInteger(
            idProfesional,
          ) ||
          idProfesional <= 0
        )
      ) {
        throw new HttpError(
          'El identificador del profesional no es válido.',
          400,
        );
      }

      const items =
        await bloqueoRepository.findAll(
          idOrganizacion,
          idProfesional,
        );

      res.json(items);
    },
  ),

  create: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const idOrganizacion =
        obtenerIdOrganizacion(
          req,
        );

      const {
        id_profesional,
        fecha_desde,
        fecha_hasta,
        hora_desde,
        hora_hasta,
        motivo,
      } = req.body;

      if (
        !id_profesional ||
        !fecha_desde ||
        !fecha_hasta ||
        !motivo
      ) {
        throw new HttpError(
          'Faltan campos obligatorios.',
          400,
        );
      }

      const idProfesional =
        Number(
          id_profesional,
        );

      if (
        !Number.isInteger(
          idProfesional,
        ) ||
        idProfesional <= 0
      ) {
        throw new HttpError(
          'El identificador del profesional no es válido.',
          400,
        );
      }

      const item =
        await bloqueoRepository.create(
          idOrganizacion,
          {
            id_profesional:
              idProfesional,

            fecha_desde,

            fecha_hasta,

            hora_desde:
              hora_desde || null,

            hora_hasta:
              hora_hasta || null,

            motivo:
              motivo.trim(),
          },
        );

      res
        .status(201)
        .json(item);
    },
  ),

  remove: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const idOrganizacion =
        obtenerIdOrganizacion(
          req,
        );

      const id =
        validarId(
          req.params.id,
        );

      const eliminado =
        await bloqueoRepository.delete(
          id,
          idOrganizacion,
        );

      if (!eliminado) {
        throw new HttpError(
          'Bloqueo no encontrado.',
          404,
        );
      }

      res
        .status(204)
        .send();
    },
  ),
};