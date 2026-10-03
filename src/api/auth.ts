import keycloak from '../auth/keycloak';

export interface AuthUser {
  idUsuario?: number;
  nombre: string;
  email: string;
  rol?: string;
  idOrganizacion?: number;
  username?: string;
}

export const auth = {
  getToken(): string | null {
    return keycloak.token ?? null;
  },

  getUser(): AuthUser | null {
    const token = keycloak.tokenParsed;

    if (!token) {
      return null;
    }

    const realmAccess = token.realm_access as
      | { roles?: string[] }
      | undefined;

    const roles = realmAccess?.roles ?? [];

    const rol =
      roles.includes('SUPER_ADMIN')
        ? 'SUPER_ADMIN'
        : roles.includes('ADMIN')
          ? 'ADMIN'
          : roles.includes('RECEPCION')
            ? 'RECEPCION'
            : roles.includes('PROFESIONAL')
              ? 'PROFESIONAL'
              : undefined;

    return {
      nombre:
        typeof token.name === 'string'
          ? token.name
          : '',

      email:
        typeof token.email === 'string'
          ? token.email
          : '',

      username:
        typeof token.preferred_username === 'string'
          ? token.preferred_username
          : undefined,

      rol,
    };
  },

  async getValidToken(): Promise<string | null> {
    try {
      await keycloak.updateToken(30);
      return keycloak.token ?? null;
    } catch {
      return null;
    }
  },

  clear(): void {
    void keycloak.logout({
      redirectUri: window.location.origin,
    });
  },

  isAuthenticated(): boolean {
    return !!keycloak.authenticated;
  },
};