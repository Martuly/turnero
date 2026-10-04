import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  createRemoteJWKSet,
  jwtVerify,
} from 'jose';

import { config } from '../config/env.js';
import { usuarioRepository } from '../repository/usuarioRepository.js';


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
  sub: string;
  idUsuario: number;
  email: string;
  nombre: string;
  rol: string;
  idOrganizacion: number;
  username?: string;
}


// ======================================================
// KEYCLOAK
// ======================================================

const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL ?? 'http://localhost:8081';

const KEYCLOAK_REALM =
  process.env.KEYCLOAK_REALM ?? 'tuturno';

const KEYCLOAK_ISSUER =
  `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

const JWKS = createRemoteJWKSet(
  new URL(
    `${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
  ),
);


export const authService = {

  // ====================================================
  // LOGIN VIEJO DE clickturno
  // LO DEJAMOS TEMPORALMENTE
  // ====================================================

  async login(
    email: string,
    password: string,
  ): Promise<{
    token: string;
    usuario: AuthUser;
  }> {

    if (!email || !password) {
      throw new AuthError(
        'Email y contraseña son obligatorios.',
        400,
      );
    }

    const user =
      await usuarioRepository.findByEmail(email);

    if (!user) {
      throw new AuthError(
        'Credenciales inválidas.',
        401,
      );
    }

    const valid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!valid) {
      throw new AuthError(
        'Credenciales inválidas.',
        401,
      );
    }

    const orgs =
      await usuarioRepository.getOrganizaciones(
        user.id_usuario,
      );

    if (orgs.length === 0) {
      throw new AuthError(
        'El usuario no tiene organizaciones asignadas.',
        403,
      );
    }

    const org = orgs[0];

    const legacyPayload = {
      sub: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      rol: org.rol,
      idOrganizacion: org.id_organizacion,
    };

    const token = jwt.sign(
      legacyPayload,
      config.JWT_SECRET,
      {
        expiresIn:
          config.JWT_EXPIRES_IN as never,
      },
    );

    return {
      token,
      usuario: {
        idUsuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: org.rol,
        idOrganizacion:
          org.id_organizacion,
      },
    };
  },


  // ====================================================
  // VALIDAR TOKEN
  //
  // Primero intenta Keycloak.
  // Si no es un token Keycloak, temporalmente intenta
  // validar el JWT viejo de clickturno.
  // ====================================================

  async verifyToken(
    token: string,
  ): Promise<JwtPayload> {

    try {

      // ----------------------------------------------
      // TOKEN KEYCLOAK
      // ----------------------------------------------

      const { payload } = await jwtVerify(
        token,
        JWKS,
        {
          issuer: KEYCLOAK_ISSUER,
        },
      );

      if (!payload.sub) {
        throw new AuthError(
          'El token no contiene identificador de usuario.',
          401,
        );
      }

      // Buscar el usuario local usando el SUB de Keycloak
      const user =
        await usuarioRepository.findByKeycloakUserId(
          payload.sub,
        );

      if (!user) {
        throw new AuthError(
          'El usuario autenticado no está registrado en clickturno.',
          403,
        );
      }

      // Buscar organización y rol actuales de clickturno
      const orgs =
        await usuarioRepository.getOrganizaciones(
          user.id_usuario,
        );

      if (orgs.length === 0) {
        throw new AuthError(
          'El usuario no tiene organizaciones asignadas.',
          403,
        );
      }

      // Por ahora tomamos la primera organización.
      // Más adelante permitiremos seleccionar organización.
      const org = orgs[0];

      return {
        sub: payload.sub,

        idUsuario:
          user.id_usuario,

        email:
          typeof payload.email === 'string'
            ? payload.email
            : user.email,

        nombre:
          typeof payload.name === 'string'
            ? payload.name
            : user.nombre,

        username:
          typeof payload.preferred_username === 'string'
            ? payload.preferred_username
            : undefined,

        rol:
          org.rol,

        idOrganizacion:
          org.id_organizacion,
      };

    } catch (keycloakError) {

      // Si Keycloak validó el token pero clickturno encontró
      // un problema funcional, mantenemos ese error.
      if (keycloakError instanceof AuthError) {
        throw keycloakError;
      }


      // ----------------------------------------------
      // TOKEN VIEJO DE clickturno
      // SOLO DURANTE LA MIGRACIÓN
      // ----------------------------------------------

      try {

        const decoded = jwt.verify(
          token,
          config.JWT_SECRET,
        ) as unknown as {
          sub: number;
          email: string;
          nombre: string;
          rol: string;
          idOrganizacion: number;
        };

        return {
          sub:
            String(decoded.sub),

          idUsuario:
            Number(decoded.sub),

          email:
            decoded.email,

          nombre:
            decoded.nombre,

          rol:
            decoded.rol,

          idOrganizacion:
            decoded.idOrganizacion,
        };

      } catch {

        throw new AuthError(
          'Token inválido o expirado.',
          401,
        );
      }
    }
  },
};