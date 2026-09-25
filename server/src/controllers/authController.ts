import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authService, AuthError } from '../services/authService.js';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const result = await authService.login(email, password);
      res.json(result);
    } catch (e) {
      const status = e instanceof AuthError ? e.status : 500;
      res.status(status).json({ error: e instanceof Error ? e.message : 'Error al iniciar sesión.' });
    }
  }),
};
