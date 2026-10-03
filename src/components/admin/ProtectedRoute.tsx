import { type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { auth } from '@/api/auth';

export function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { slug } = useParams<{ slug: string }>();

  if (!auth.isAuthenticated()) {
    return (
      <Navigate
        to={slug ? `/${slug}/login` : '/'}
        replace
      />
    );
  }

  return <>{children}</>;
}