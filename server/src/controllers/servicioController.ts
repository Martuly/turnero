import type { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { servicioRepository } from '../repository/servicioRepository.js';
import { organizacionService } from '../services/organizacionService.js';

function obtenerIdOrganizacion(req: Request): number {
  const idOrganizacion = req.authUser?.idOrganizacion;

  if (!idOrganizacion) {
    throw new HttpError('No se pudo identificar la organización.', 401);
  }

  return idOrganizacion;
}

export const servicioController = {
    publicList: asyncHandler(async (_req: Request, res: Response) => {
    // Temporal: organización usada por el circuito público actual.
    // Después se obtendrá mediante el slug de la URL.
    const idOrganizacion = 1;

    const items = await servicioRepository.findAll(idOrganizacion);

    res.json(items);
  }),

  publicListActive: asyncHandler(async (_req: Request, res: Response) => {
    // Temporal: organización usada por el circuito público actual.
    const idOrganizacion = 1;

    const items = await servicioRepository.findAllActive(idOrganizacion);

    res.json(items);
  }),

  publicListActiveBySlug: asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;

    const organizacion =
      await organizacionService.obtenerPorSlug(slug);

    const items =
      await servicioRepository.findAllActive(
        organizacion.id_organizacion,
      );

    res.json(items);
    },
  ),

  publicGet: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idOrganizacion = 1;

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(
        'El identificador del servicio no es válido.',
        400,
      );
    }

    const item = await servicioRepository.findById(
      id,
      idOrganizacion,
    );

    if (!item) {
      throw new HttpError('Servicio no encontrado.', 404);
    }

    res.json(item);
  }),
  list: asyncHandler(async (req: Request, res: Response) => {
    const idOrganizacion = obtenerIdOrganizacion(req);

    const items = await servicioRepository.findAll(idOrganizacion);

    res.json(items);
  }),

  listActive: asyncHandler(async (req: Request, res: Response) => {
    const idOrganizacion = obtenerIdOrganizacion(req);

    const items = await servicioRepository.findAllActive(idOrganizacion);

    res.json(items);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idOrganizacion = obtenerIdOrganizacion(req);

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError('El identificador del servicio no es válido.', 400);
    }

    const item = await servicioRepository.findById(
      id,
      idOrganizacion,
    );

    if (!item) {
      throw new HttpError('Servicio no encontrado.', 404);
    }

    res.json(item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const idOrganizacion = obtenerIdOrganizacion(req);

    const {
      nombre,
      descripcion,
      duracion_minutos,
      precio,
      activo,
    } = req.body;

    if (!nombre?.trim()) {
      throw new HttpError('El nombre es obligatorio.', 400);
    }

    const duracion = Number(duracion_minutos);
    const precioNumerico = Number(precio);

    if (!Number.isFinite(duracion) || duracion <= 0) {
      throw new HttpError(
        'La duración debe ser mayor que cero.',
        400,
      );
    }

    if (!Number.isFinite(precioNumerico) || precioNumerico < 0) {
      throw new HttpError(
        'El precio no puede ser negativo.',
        400,
      );
    }

    const item = await servicioRepository.create({
      id_organizacion: idOrganizacion,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      duracion_minutos: duracion,
      precio: precioNumerico,
      activo: activo ?? true,
    });

    res.status(201).json(item);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idOrganizacion = obtenerIdOrganizacion(req);

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError('El identificador del servicio no es válido.', 400);
    }

    const item = await servicioRepository.update(
      id,
      idOrganizacion,
      req.body,
    );

    if (!item) {
      throw new HttpError('Servicio no encontrado.', 404);
    }

    res.json(item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idOrganizacion = obtenerIdOrganizacion(req);

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError('El identificador del servicio no es válido.', 400);
    }

    const eliminado = await servicioRepository.delete(
      id,
      idOrganizacion,
    );

    if (!eliminado) {
      throw new HttpError('Servicio no encontrado.', 404);
    }

    res.status(204).send();
  }),
};