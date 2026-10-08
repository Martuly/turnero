import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useParams } from 'react-router-dom';

type OrganizacionActual = {
  idOrganizacion: number;
  codigo: string;
  nombre: string;
  slug: string;
  timezone: string;
};

type OrganizacionContextType = {
  organizacion: OrganizacionActual | null;
  loading: boolean;
  error: string | null;
};

const OrganizacionContext =
  createContext<OrganizacionContextType>({
    organizacion: null,
    loading: true,
    error: null,
  });

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:4000/api';

export function OrganizacionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { slug } = useParams();

  const [organizacion, setOrganizacion] =
    useState<OrganizacionActual | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function cargarOrganizacion() {
      if (!slug) {
        setError(
          'No se indicó una organización.',
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_URL}/public/organizaciones/${slug}`,
        );

        if (!response.ok) {
          throw new Error(
            'Organización no encontrada.',
          );
        }

        const data =
          (await response.json()) as OrganizacionActual;

        setOrganizacion(data);
      } catch (err) {
        setOrganizacion(null);

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la organización.',
        );
      } finally {
        setLoading(false);
      }
    }

    void cargarOrganizacion();
  }, [slug]);

  return (
    <OrganizacionContext.Provider
      value={{
        organizacion,
        loading,
        error,
      }}
    >
      {children}
    </OrganizacionContext.Provider>
  );
}

export function useOrganizacion() {
  return useContext(
    OrganizacionContext,
  );
}