import type { Request, Response, NextFunction } from 'express';
import { authService, AuthError, type JwtPayload } from '../services/authService.js';

// Augment Express Request with the authenticated user
declare module 'express-serve-static-core' {
  interface Request {
    authUser?: JwtPayload;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token de autenticación.' });
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = authService.verifyToken(token);
    req.authUser = payload;
    next();
  } catch (err) {
    const message = err instanceof AuthError ? err.message : 'Token inválido.';
    return res.status(401).json({ error: message });
  }
}
