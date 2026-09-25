import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { clienteRepository } from '../repository/clienteRepository.js';
import { organizacionRepository } from '../repository/organizacionRepository.js';

export const clienteController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const items = await clienteRepository.findAll();
    res.json(items);
  }),
};

export const organizacionController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = await organizacionRepository.findActiveById(id);
    if (!item) return res.status(404).json({ error: 'Organización no encontrada' });
    res.json(item);
  }),
};
