import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CheckCircle2, Clock3, Plus, XCircle } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import type { DashboardEstadisticas, Profesional } from '@/types';

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateAtOffset(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return isoDate(d);
}
function labelDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

const panel = 'rounded-2xl border border-[#ebe9f3] bg-white p-5 sm:p-6 shadow-sm shadow-indigo-100/40';

export function DashboardPage() {
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30);
  const [idProfesional, setIdProfesional] = useState<number | undefined>();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [stats, setStats] = useState<DashboardEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasta = dateAtOffset(0);
  const desde = dateAtOffset(1 - periodo);

  useEffect(() => {
    void api.getProfesionales().then(setProfesionales).catch(() => setProfesionales([]));
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void api.getDashboardEstadisticas(desde, hasta, idProfesional)
      .then((data) => { if (active) setStats(data); })
      .catch((e) => { if (active) setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las estadísticas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [desde, hasta, idProfesional]);

  const dias = useMemo(() => {
    const map = new Map(stats?.por_dia.map((d) => [d.fecha, d.cantidad]) ?? []);
    const result: { fecha: string; cantidad: number }[] = [];
    const cursor = new Date(`${desde}T12:00:00Z`);
    for (let i = 0; i < periodo; i++) {
      const fecha = cursor.toISOString().slice(0, 10);
      result.push({ fecha, cantidad: map.get(fecha) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }, [stats, desde, periodo]);

  const maxDia = Math.max(1, ...dias.map((d) => d.cantidad));
  const points = dias.map((d, i) => `${(i / Math.max(1, dias.length - 1)) * 600},${130 - (d.cantidad / maxDia) * 112}`).join(' ');
  const maxServicio = Math.max(1, ...(stats?.por_servicio.map((s) => s.cantidad) ?? []));
  const maxHora = Math.max(1, ...(stats?.por_hora.map((h) => h.cantidad) ?? []));
  const kpis = stats ? [
    { label: 'Turnos del período', value: stats.total, icon: CalendarCheck, tone: 'bg-[#f0edff] text-[#6652e8]' },
    { label: 'Confirmados', value: stats.estados.CONFIRMADO, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pendientes', value: stats.estados.PENDIENTE, icon: Clock3, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Cancelados', value: stats.estados.CANCELADO, icon: XCircle, tone: 'bg-rose-50 text-rose-600' },
  ] : [];

  return (
    <AdminLayout>
      <PageHeader title="Estadísticas de tu agenda" subtitle="Conocé la actividad y descubrí cómo se distribuyen tus turnos."
        action={<Link to="/admin/turnos" className="inline-flex items-center gap-2 rounded-xl bg-[#6652e8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5540d5]"><Plus className="h-4 w-4" /> Gestionar turnos</Link>} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-[#e8e5f2] bg-white p-1" aria-label="Período">
          {([7, 30, 90] as const).map((n) => <button key={n} type="button" onClick={() => setPeriodo(n)}
            aria-pressed={periodo === n} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${periodo === n ? 'bg-[#eeeaff] text-[#5842d5]' : 'text-[#77758c] hover:bg-slate-50'}`}>{n} días</button>)}
        </div>
        <select aria-label="Filtrar por profesional" value={idProfesional ?? ''} onChange={(e) => setIdProfesional(e.target.value ? Number(e.target.value) : undefined)}
          className="h-11 min-w-52 rounded-xl border border-[#e8e5f2] bg-white px-3 text-sm text-[#242044] focus:border-[#6652e8] focus:outline-none">
          <option value="">Todos los profesionales</option>
          {profesionales.map((p) => <option key={p.id_profesional} value={p.id_profesional}>{p.nombre} {p.apellido}</option>)}
        </select>
        <span className="text-sm text-[#77758c]">{labelDate(desde)} al {labelDate(hasta)}</span>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : stats && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => <div key={k.label} className={panel}>
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${k.tone}`}><k.icon className="h-5 w-5" /></div>
            <p className="text-4xl font-bold tracking-tight text-[#242044]">{k.value}</p><p className="mt-1 text-sm text-[#77758c]">{k.label}</p>
            {k.label !== 'Turnos del período' && <p className="mt-3 text-xs font-medium text-[#6652e8]">{stats.total ? Math.round(k.value / stats.total * 100) : 0}% del total</p>}
          </div>)}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className={panel}>
            <h2 className="text-lg font-bold text-[#242044]">Evolución de turnos</h2><p className="mt-1 text-sm text-[#77758c]">Turnos por fecha, sin cancelados</p>
            {dias.every((d) => d.cantidad === 0) ? <p className="py-14 text-center text-sm text-[#77758c]">No hay turnos en este período.</p> : <div className="mt-7">
              <svg viewBox="0 0 600 145" role="img" aria-label="Gráfico de turnos por día" className="h-44 w-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1="130" x2="600" y2="130" stroke="#e9e7f3" strokeWidth="2" />
                <polyline fill="none" stroke="#6652e8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
              </svg>
              <div className="flex justify-between text-xs text-[#9995aa]"><span>{labelDate(desde)}</span><span>{labelDate(hasta)}</span></div>
            </div>}
          </section>
          <section className={panel}>
            <h2 className="text-lg font-bold text-[#242044]">Servicios más solicitados</h2><p className="mt-1 text-sm text-[#77758c]">Turnos vigentes por servicio</p>
            {stats.por_servicio.length === 0 ? <p className="py-14 text-center text-sm text-[#77758c]">Todavía no hay datos.</p> : <div className="mt-6 space-y-5">
              {stats.por_servicio.map((s) => <div key={s.nombre}><div className="mb-2 flex justify-between gap-2 text-sm"><span className="truncate font-medium text-[#34304c]">{s.nombre}</span><span className="text-[#77758c]">{s.cantidad}</span></div><div className="h-2 rounded-full bg-[#f0eef8]"><div className="h-2 rounded-full bg-[#6652e8]" style={{ width: `${100 * s.cantidad / maxServicio}%` }} /></div></div>)}
            </div>}
          </section>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className={panel}>
            <h2 className="text-lg font-bold text-[#242044]">Horarios con más reservas</h2><p className="mt-1 text-sm text-[#77758c]">Cantidad de turnos por hora de inicio</p>
            {stats.por_hora.length === 0 ? <p className="py-10 text-center text-sm text-[#77758c]">Todavía no hay datos.</p> : <div className="mt-6 flex h-36 items-end gap-2 sm:gap-4">
              {stats.por_hora.map((h) => <div key={h.hora} className="group flex min-w-0 flex-1 flex-col items-center gap-2" title={`${h.hora}:00 — ${h.cantidad} turnos`}><span className="text-xs text-[#77758c]">{h.cantidad}</span><div className="w-full max-w-12 rounded-t-lg bg-[#9a8cf1]" style={{ height: `${Math.max(8, 92 * h.cantidad / maxHora)}px` }} /><span className="text-xs text-[#77758c]">{h.hora}h</span></div>)}
            </div>}
          </section>
          <section className={`${panel} flex flex-col justify-between bg-gradient-to-br from-white to-[#f5f2ff]`}>
            <div><h2 className="text-lg font-bold text-[#242044]">Gestioná los pendientes</h2><p className="mt-2 text-sm text-[#77758c]">Revisá los turnos que todavía esperan confirmación.</p><p className="mt-5 text-4xl font-bold text-[#6652e8]">{stats.estados.PENDIENTE}</p><p className="text-sm text-[#77758c]">en el período seleccionado</p></div>
            <Link to="/admin/turnos" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6652e8]">Ir a turnos <ArrowRight className="h-4 w-4" /></Link>
          </section>
        </div>
        <p className="mt-5 text-xs text-[#9995aa]">Los porcentajes se calculan sobre todos los turnos del período. Los gráficos de actividad excluyen los cancelados.</p>
      </>}
    </AdminLayout>
  );
}
