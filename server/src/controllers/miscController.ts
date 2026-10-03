import type {
  Request,
  Response,
} from 'express';

import {
  asyncHandler,
  HttpError,
} from '../middleware/errorHandler.js';

import {
  clienteRepository,
} from '../repository/clienteRepository.js';

import {
  organizacionRepository,
} from '../repository/organizacionRepository.js';

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

export const clienteController = {
  list: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const idOrganizacion =
        obtenerIdOrganizacion(
          req,
        );

      const items =
        await clienteRepository.findAll(
          idOrganizacion,
        );

      res.json(items);
    },
  ),
};

export const organizacionController = {
  get: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      const id =
        Number(
          req.params.id,
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        throw new HttpError(
          'El identificador de la organización no es válido.',
          400,
        );
      }

      const item =
        await organizacionRepository.findActiveById(
          id,
        );

      if (!item) {
        throw new HttpError(
          'Organización no encontrada.',
          404,
        );
      }

      res.json(item);
    },
  ),
};