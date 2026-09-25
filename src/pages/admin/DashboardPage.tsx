import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarDays, CalendarRange, Users, XCircle, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import type { DashboardResumen } from '@/types';

export function DashboardPage() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setResumen(await api.getDashboardResumen());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar el resumen.');
    } finally {
      setLoading(false);
    }
  }

  const cards = resumen
    ? [
        { label: 'Turnos de hoy', value: resumen.turnos_hoy, icon: CalendarCheck, color: 'text-blue-600 bg-blue-50' },
        { label: 'Turnos de la semana', value: resumen.turnos_semana, icon: CalendarRange, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Turnos confirmados', value: resumen.turnos_confirmados, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Turnos cancelados', value: resumen.turnos_cancelados, icon: XCircle, color: 'text-red-600 bg-red-50' },
        { label: 'Total de clientes', value: resumen.total_clientes, icon: Users, color: 'text-slate-600 bg-slate-100' },
      ]
    : [];

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" subtitle="Resumen general de la actividad" />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className={`inline-flex h-10 w-10 rounded-lg items-center justify-center mb-3 ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">{c.value}</p>
              <p className="text-sm text-slate-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && resumen && (
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Próximos pasos</h2>
          </div>
          <p className="text-sm text-slate-500">
            Desde el panel podés gestionar servicios, profesionales, disponibilidad y bloqueos de agenda.
            La página pública de reserva está disponible en <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/reservar</code>.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
