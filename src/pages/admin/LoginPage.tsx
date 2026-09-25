import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CalendarDays, Lock, Mail, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { auth } from '@/api/auth';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Ingresá email y contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token, usuario } = await api.login(email, password);
      auth.setSession(token, usuario);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/reservar" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">{APP_CONFIG.name}</span>
          </Link>
          <Link to="/reservar" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Página de reserva
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl bg-white border border-slate-200 p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Panel administrativo</h1>
              <p className="text-sm text-slate-500 mt-1">Iniciá sesión para continuar</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-9 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@demo.com"
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-9 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Ingresar <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            Demo: admin@demo.com / admin123
          </p>
        </div>
      </main>
    </div>
  );
}
