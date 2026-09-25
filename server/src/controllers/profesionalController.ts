import type { Request, Response } from 'express';

import {
  asyncHandler,
  HttpError,
} from '../middleware/errorHandler.js';

import { profesionalRepository } from '../repository/profesionalRepository.js';

function obtenerIdOrganizacion(req: Request): number {
  const idOrganizacion = req.authUser?.idOrganizacion;

  if (!idOrganizacion) {
    throw new HttpError(
      'No se pudo identificar la organización.',
      401,
    );
  }

  return idOrganizacion;
}

function validarId(value: string | undefined): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(
      'El identificador no es válido.',
      400,
    );
  }

  return id;
}

export const profesionalController = {
    publicList: asyncHandler(
    async (_req: Request, res: Response) => {
      // Temporal: organización del circuito público actual.
      // Después se resolverá mediante el slug.
      const idOrganizacion = 1;

      const items =
        await profesionalRepository.findAll(
          idOrganizacion,
        );

      res.json(items);
    },
  ),

  publicListActive: asyncHandler(
    async (_req: Request, res: Response) => {
      const idOrganizacion = 1;

      const items =
        await profesionalRepository.findAllActive(
          idOrganizacion,
        );

      res.json(items);
    },
  ),

  publicGet: asyncHandler(
    async (req: Request, res: Response) => {
      const id = validarId(req.params.id);
      const idOrganizacion = 1;

      const item =
        await profesionalRepository.findById(
          id,
          idOrganizacion,
        );

      if (!item) {
        throw new HttpError(
          'Profesional no encontrado.',
          404,
        );
      }

      res.json(item);
    },
  ),

  publicGetServicios: asyncHandler(
    async (req: Request, res: Response) => {
      const id = validarId(req.params.id);
      const idOrganizacion = 1;

      const profesional =
        await profesionalRepository.findById(
          id,
          idOrganizacion,
        );

      if (!profesional) {
        throw new HttpError(
          'Profesional no encontrado.',
          404,
        );
      }

      const items =
        await profesionalRepository
          .getServiciosByProfesional(
            id,
            idOrganizacion,
          );

      res.json(items);
    },
  ),

  list: asyncHandler(async (req: Request, res: Response) => {
    const idOrganizacion = obtenerIdOrganizacion(req);

    const items =
      await profesionalRepository.findAll(
        idOrganizacion,
      );

    res.json(items);
  }),

  listActive: asyncHandler(
    async (req: Request, res: Response) => {
      const idOrganizacion =
        obtenerIdOrganizacion(req);

      const items =
        await profesionalRepository.findAllActive(
          idOrganizacion,
        );

      res.json(items);
    },
  ),

  get: asyncHandler(async (req: Request, res: Response) => {
    const id = validarId(req.params.id);
    const idOrganizacion = obtenerIdOrganizacion(req);

    const item =
      await profesionalRepository.findById(
        id,
        idOrganizacion,
      );

    if (!item) {
      throw new HttpError(
        'Profesional no encontrado.',
        404,
      );
    }

    res.json(item);
  }),

  create: asyncHandler(
    async (req: Request, res: Response) => {
      const idOrganizacion =
        obtenerIdOrganizacion(req);

      const {
        nombre,
        apellido,
        email,
        telefono,
        activo,
      } = req.body;

      if (!nombre?.trim() || !apellido?.trim()) {
        throw new HttpError(
          'Nombre y apellido son obligatorios.',
          400,
        );
      }

      const item =
        await profesionalRepository.create({
          id_organizacion: idOrganizacion,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email?.trim() || null,
          telefono: telefono?.trim() || null,
          activo: activo ?? true,
        });

      res.status(201).json(item);
    },
  ),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const id = validarId(req.params.id);
      const idOrganizacion =
        obtenerIdOrganizacion(req);

      const item =
        await profesionalRepository.update(
          id,
          idOrganizacion,
          req.body,
        );

      if (!item) {
        throw new HttpError(
          'Profesional no encontrado.',
          404,
        );
      }

      res.json(item);
    },
  ),

  remove: asyncHandler(
    async (req: Request, res: Response) => {
      const id = validarId(req.params.id);
      const idOrganizacion =
        obtenerIdOrganizacion(req);

      const eliminado =
        await profesionalRepository.delete(
          id,
          idOrganizacion,
        );

      if (!eliminado) {
        throw new HttpError(
          'Profesional no encontrado.',
          404,
        );
      }

      res.status(204).send();
    },
  ),

  getServicios: asyncHandler(
    async (req: Request, res: Response) => {
      const id = validarId(req.params.id);
      const idOrganizacion =
        obtenerIdOrganizacion(req);

      const profesional =
        await profesionalRepository.findById(
          id,
          idOrganizacion,
        );

      if (!profesional) {
        throw new HttpError(
          'Profesional no encontrado.',
          404,
        );
      }

      const items =
        await profesionalRepository
          .getServiciosByProfesional(
            id,
            idOrganizacion,
          );

      res.json(items);
    },
  ),

  updateServicios: asyncHandler(
    async (req: Request, res: Response) => {
      const id = validarId(req.params.id);
      const idOrganizacion =
        obtenerIdOrganizacion(req);

      const { id_servicios } = req.body;

      if (!Array.isArray(id_servicios)) {
        throw new HttpError(
          'id_servicios debe ser un array.',
          400,
        );
      }

      const idsValidos = id_servicios.every(
        (value: unknown) =>
          Number.isInteger(value) &&
          Number(value) > 0,
      );

      if (!idsValidos) {
        throw new HttpError(
          'Todos los servicios deben tener un identificador válido.',
          400,
        );
      }

      const actualizado =
        await profesionalRepository
          .replaceServiciosProfesional(
            id,
            idOrganizacion,
            id_servicios,
          );

      if (!actualizado) {
        throw new HttpError(
          'Profesional no encontrado.',
          404,
        );
      }

      res.json({ ok: true });
    },
  ),
};