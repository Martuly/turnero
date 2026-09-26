import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarDays, CalendarRange, Users, XCircle, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        { label: 'Turnos de hoy', value: resumen.turnos_hoy, icon: CalendarCheck, color: 'text-[#6652e8] bg-[#f1edff]' },
        { label: 'Turnos de la semana', value: resumen.turnos_semana, icon: CalendarRange, color: 'text-blue-600 bg-blue-50' },
        { label: 'Turnos confirmados', value: resumen.turnos_confirmados, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Turnos cancelados', value: resumen.turnos_cancelados, icon: XCircle, color: 'text-red-600 bg-red-50' },
        { label: 'Total de clientes', value: resumen.total_clientes, icon: Users, color: 'text-slate-600 bg-slate-100' },
      ]
    : [];

  return (
    <AdminLayout>
      <PageHeader title="Tu agenda, de un vistazo" subtitle="Todo lo importante para organizar tu jornada." action={<Link to="/admin/turnos" className="inline-flex items-center gap-2 rounded-xl bg-[#6652e8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-[#5540d5]"><Plus className="h-4 w-4" /> Gestionar turnos</Link>} />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white border border-[#ebe9f3] p-6 shadow-sm shadow-indigo-100/40">
              <div className={`inline-flex h-10 w-10 rounded-lg items-center justify-center mb-3 ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-[#242044]">{c.value}</p>
              <p className="text-sm text-slate-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && resumen && (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <Link to="/admin/agenda" className="group rounded-2xl border border-[#ebe9f3] bg-white p-6 shadow-sm shadow-indigo-100/40 transition hover:border-[#b9adff] hover:shadow-md">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1edff] text-[#6652e8]"><CalendarDays className="h-5 w-5" /></div>
            <h2 className="text-lg font-bold text-[#242044]">Abrí tu agenda</h2>
            <p className="mt-1 text-sm text-[#77758c]">Consultá los horarios y turnos de los próximos días.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#6652e8]">Ver agenda <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
          <Link to="/admin/disponibilidad" className="group rounded-2xl border border-[#ebe9f3] bg-white p-6 shadow-sm shadow-indigo-100/40 transition hover:border-[#b9adff] hover:shadow-md">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f8f4] text-[#159c82]"><CalendarRange className="h-5 w-5" /></div>
            <h2 className="text-lg font-bold text-[#242044]">Organizá tus horarios</h2>
            <p className="mt-1 text-sm text-[#77758c]">Gestioná disponibilidad y mantené tu agenda al día.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#6652e8]">Ver disponibilidad <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        </div>
      )}
    </AdminLayout>
  );
}
