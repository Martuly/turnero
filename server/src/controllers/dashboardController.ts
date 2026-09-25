import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  resumen: asyncHandler(async (_req: Request, res: Response) => {
    const resumen = await dashboardService.getResumen();
    res.json(resumen);
  }),
};
