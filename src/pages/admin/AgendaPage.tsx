import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { Button } from '@/components/ui/Button';
import type { TurnoDetalle } from '@/types';
import { addDays, addMonths, addWeeks, format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'dia' | 'semana' | 'mes';

export function AgendaPage() {
  const [view, setView] = useState<ViewMode>('semana');
  const [current, setCurrent] = useState(new Date());
  const [turnos, setTurnos] = useState<TurnoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === 'dia') return { start: current, end: current };
    if (view === 'semana') return { start: startOfWeek(current, { weekStartsOn: 1 }), end: endOfWeek(current, { weekStartsOn: 1 }) };
    return { start: startOfMonth(current), end: endOfMonth(current) };
  }, [view, current]);

  useEffect(() => {
    void load();
  }, [range.start, range.end]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTurnos({
        fechaDesde: format(range.start, 'yyyy-MM-dd'),
        fechaHasta: format(range.end, 'yyyy-MM-dd'),
      });
      setTurnos(data.filter((t) => t.estado !== 'CANCELADO'));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }

  function movePrev() {
    if (view === 'dia') setCurrent(addDays(current, -1));
    else if (view === 'semana') setCurrent(addWeeks(current, -1));
    else setCurrent(addMonths(current, -1));
  }
  function moveNext() {
    if (view === 'dia') setCurrent(addDays(current, 1));
    else if (view === 'semana') setCurrent(addWeeks(current, 1));
    else setCurrent(addMonths(current, 1));
  }

  const periodLabel = (() => {
    if (view === 'dia') return format(current, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (view === 'semana') return `${format(range.start, "d MMM", { locale: es })} – ${format(range.end, "d MMM yyyy", { locale: es })}`;
    return format(current, "MMMM yyyy", { locale: es });
  })();

  const turnosByDate = useMemo(() => {
    const map = new Map<string, TurnoDetalle[]>();
    for (const t of turnos) {
      const arr = map.get(t.fecha) ?? [];
      arr.push(t);
      map.set(t.fecha, arr);
    }
    return map;
  }, [turnos]);

  return (
    <AdminLayout>
      <PageHeader title="Agenda" subtitle="Calendario de turnos" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(['dia', 'semana', 'mes'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize
                ${view === v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {v === 'dia' ? 'Día' : v === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={movePrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={moveNext}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm font-medium text-slate-700 ml-2 capitalize min-w-[180px] text-center">{periodLabel}</span>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando agenda..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          {/* Day view */}
          {view === 'dia' && (
            <DayView date={current} turnos={turnosByDate.get(format(current, 'yyyy-MM-dd')) ?? []} />
          )}
          {/* Week view */}
          {view === 'semana' && (
            <WeekView start={range.start} end={range.end} turnosByDate={turnosByDate} />
          )}
          {/* Month view */}
          {view === 'mes' && (
            <MonthView monthDate={current} turnosByDate={turnosByDate} />
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function TurnoCard({ t }: { t: TurnoDetalle }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-slate-900">{t.hora_inicio} – {t.hora_fin}</span>
        <EstadoBadge estado={t.estado} />
      </div>
      <p className="text-sm font-medium text-slate-800 truncate">{t.cliente_nombre} {t.cliente_apellido}</p>
      <p className="text-xs text-slate-500 truncate">{t.servicio_nombre} · {t.profesional_nombre} {t.profesional_apellido}</p>
    </div>
  );
}

function DayView({ date, turnos }: { date: Date; turnos: TurnoDetalle[] }) {
  const iso = format(date, 'yyyy-MM-dd');
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-slate-900 capitalize">{format(date, "EEEE d 'de' MMMM", { locale: es })}</h3>
        {isToday(date) && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Hoy</span>}
      </div>
      {turnos.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No hay turnos para este día.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {turnos.map((t) => <TurnoCard key={t.id_turno} t={t} />)}
        </div>
      )}
    </div>
  );
}

function WeekView({ start, end, turnosByDate }: { start: Date; end: Date; turnosByDate: Map<string, TurnoDetalle[]> }) {
  const days = eachDayOfInterval({ start, end });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 border-t border-l border-slate-100">
      {days.map((day) => {
        const iso = format(day, 'yyyy-MM-dd');
        const dayTurnos = turnosByDate.get(iso) ?? [];
        return (
          <div key={iso} className={`border-r border-b border-slate-100 p-3 min-h-[140px] ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 capitalize">{format(day, 'EEE d', { locale: es })}</span>
              {isToday(day) && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            </div>
            <div className="space-y-1.5">
              {dayTurnos.slice(0, 4).map((t) => (
                <div key={t.id_turno} className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-xs">
                  <div className="font-medium text-slate-800">{t.hora_inicio} {t.cliente_nombre} {t.cliente_apellido}</div>
                  <div className="text-slate-500 truncate">{t.servicio_nombre}</div>
                </div>
              ))}
              {dayTurnos.length > 4 && <p className="text-xs text-slate-400">+{dayTurnos.length - 4} más</p>}
              {dayTurnos.length === 0 && <p className="text-xs text-slate-300">Sin turnos</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ monthDate, turnosByDate }: { monthDate: Date; turnosByDate: Map<string, TurnoDetalle[]> }) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="px-3 py-2 text-xs font-medium text-slate-400 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, monthDate);
          const dayTurnos = turnosByDate.get(iso) ?? [];
          return (
            <div
              key={iso}
              className={`border-r border-b border-slate-100 p-2 min-h-[100px] ${!inMonth ? 'bg-slate-50/50' : ''} ${isToday(day) ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`text-xs mb-1 ${inMonth ? 'text-slate-700' : 'text-slate-300'} ${isToday(day) ? 'font-bold text-blue-600' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTurnos.slice(0, 3).map((t) => (
                  <div key={t.id_turno} className="text-xs truncate rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                    {t.hora_inicio} {t.cliente_nombre} {t.cliente_apellido}
                  </div>
                ))}
                {dayTurnos.length > 3 && <p className="text-xs text-slate-400">+{dayTurnos.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
