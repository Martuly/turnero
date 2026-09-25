import type { Request, Response } from 'express';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { bloqueoRepository } from '../repository/bloqueoRepository.js';

export const bloqueoController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const idProfesional = req.query.idProfesional ? Number(req.query.idProfesional) : undefined;
    const items = await bloqueoRepository.findAll(idProfesional);
    res.json(items);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { id_profesional, fecha_desde, fecha_hasta, hora_desde, hora_hasta, motivo } = req.body;
    if (!id_profesional || !fecha_desde || !fecha_hasta || !motivo) {
      throw new HttpError('Faltan campos obligatorios.');
    }
    const item = await bloqueoRepository.create({
      id_profesional: Number(id_profesional),
      fecha_desde,
      fecha_hasta,
      hora_desde: hora_desde || null,
      hora_hasta: hora_hasta || null,
      motivo,
    });
    res.status(201).json(item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await bloqueoRepository.delete(id);
    res.status(204).send();
  }),
};
