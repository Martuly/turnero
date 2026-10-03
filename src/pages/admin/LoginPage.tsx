import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Lock, ArrowRight } from 'lucide-react';

import keycloak from '@/auth/keycloak';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const { slug } = useParams<{ slug: string }>();

  async function handleLogin() {
    if (!slug) return;

    await keycloak.login({
      redirectUri: `${window.location.origin}/${slug}/admin`,
    });
  }

  const reservarUrl = slug
    ? `/${slug}/reservar`
    : '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2efff] via-[#fbfaff] to-[#eafaf7] flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link
            to={reservarUrl}
            className="flex items-center gap-2"
          >
            <div className="h-9 w-9 rounded-xl bg-[#6652e8] flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>

            <span className="text-lg font-semibold text-slate-900">
              {APP_CONFIG.name}
            </span>
          </Link>

          <Link
            to={reservarUrl}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            Página de reserva
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-white border border-[#ece9f8] p-8 shadow-xl shadow-indigo-100/50">
            <div className="mb-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#6652e8] flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-[#242044]">
                Bienvenido a clickturno
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Ingresá para organizar tu agenda
              </p>
            </div>

            <Button
              type="button"
              onClick={handleLogin}
              className="w-full"
              size="lg"
            >
              Ingresar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Tu agenda, simple.
          </p>
        </div>
      </main>
    </div>
  );
}