import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { usuarioRepository, type UsuarioRow, type UsuarioOrgRow } from '../repository/usuarioRepository.js';

export interface AuthUser {
  idUsuario: number;
  nombre: string;
  email: string;
  rol: string;
  idOrganizacion: number;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export interface JwtPayload {
  sub: number;
  email: string;
  nombre: string;
  rol: string;
  idOrganizacion: number;
}

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; usuario: AuthUser }> {
    if (!email || !password) {
      throw new AuthError('Email y contraseña son obligatorios.', 400);
    }
    const user = await usuarioRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Credenciales inválidas.', 401);
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AuthError('Credenciales inválidas.', 401);
    }
    const orgs = await usuarioRepository.getOrganizaciones(user.id_usuario);
    if (orgs.length === 0) {
      throw new AuthError('El usuario no tiene organizaciones asignadas.', 403);
    }
    const org = orgs[0];

    const payload: JwtPayload = {
      sub: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      rol: org.rol,
      idOrganizacion: org.id_organizacion,
    };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN as never });

    return {
      token,
      usuario: {
        idUsuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: org.rol,
        idOrganizacion: org.id_organizacion,
      },
    };
  },

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as unknown;
      return decoded as JwtPayload;
    } catch {
      throw new AuthError('Token inválido o expirado.', 401);
    }
  },
};

// keep imports referenced for type-only usage
void (undefined as unknown as UsuarioRow);
void (undefined as unknown as UsuarioOrgRow);
