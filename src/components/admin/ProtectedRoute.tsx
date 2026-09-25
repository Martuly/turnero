import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '@/api/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
