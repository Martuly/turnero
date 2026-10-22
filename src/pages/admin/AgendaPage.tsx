import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
  XCircle,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

import { api, ApiError } from '@/api/client';
import {
  AdminLayout,
  PageHeader,
} from '@/components/admin/AdminLayout';
import {
  ErrorState,
  LoadingState,
} from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import type { TurnoDetalle } from '@/types';

type ViewMode = 'dia' | 'semana' | 'mes';

type EstadoStyle = {
  label: string;
  card: string;
  dot: string;
  badge: string;
};

function getEstadoStyle(
  estado: string,
): EstadoStyle {
  switch (estado) {
    case 'CONFIRMADO':
      return {
        label: 'Confirmado',
        card:
          'border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80',
        dot: 'bg-emerald-500',
        badge:
          'bg-emerald-100 text-emerald-700 border-emerald-200',
      };

    case 'PENDIENTE':
      return {
        label: 'Pendiente',
        card:
          'border-amber-200 bg-amber-50/80 hover:bg-amber-100/80',
        dot: 'bg-amber-500',
        badge:
          'bg-amber-100 text-amber-700 border-amber-200',
      };

    case 'CANCELADO':
      return {
        label: 'Cancelado',
        card:
          'border-rose-200 bg-rose-50/80 hover:bg-rose-100/80',
        dot: 'bg-rose-500',
        badge:
          'bg-rose-100 text-rose-700 border-rose-200',
      };

    case 'FINALIZADO':
      return {
        label: 'Finalizado',
        card:
          'border-blue-200 bg-blue-50/80 hover:bg-blue-100/80',
        dot: 'bg-blue-500',
        badge:
          'bg-blue-100 text-blue-700 border-blue-200',
      };

    case 'AUSENTE':
      return {
        label: 'Ausente',
        card:
          'border-slate-300 bg-slate-100 hover:bg-slate-200',
        dot: 'bg-slate-500',
        badge:
          'bg-slate-200 text-slate-700 border-slate-300',
      };

    default:
      return {
        label: estado,
        card:
          'border-slate-200 bg-slate-50 hover:bg-slate-100',
        dot: 'bg-slate-400',
        badge:
          'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export function AgendaPage() {
  const [view, setView] =
    useState<ViewMode>('semana');

  const [current, setCurrent] =
    useState(new Date());

  const [turnos, setTurnos] = useState<
    TurnoDetalle[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [profesionalFilter, setProfesionalFilter] =
    useState('');

  const [servicioFilter, setServicioFilter] =
    useState('');

  const [estadoFilter, setEstadoFilter] =
    useState('');

  const [selectedTurno, setSelectedTurno] =
    useState<TurnoDetalle | null>(null);

  const range = useMemo(() => {
    if (view === 'dia') {
      return {
        start: current,
        end: current,
      };
    }

    if (view === 'semana') {
      return {
        start: startOfWeek(current, {
          weekStartsOn: 1,
        }),
        end: endOfWeek(current, {
          weekStartsOn: 1,
        }),
      };
    }

    return {
      start: startOfMonth(current),
      end: endOfMonth(current),
    };
  }, [view, current]);

  useEffect(() => {
    void load();
  }, [range.start, range.end]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getTurnos({
        fechaDesde: format(
          range.start,
          'yyyy-MM-dd',
        ),
        fechaHasta: format(
          range.end,
          'yyyy-MM-dd',
        ),
      });

      setTurnos(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Error al cargar la agenda.',
      );
    } finally {
      setLoading(false);
    }
  }

  function movePrev() {
    if (view === 'dia') {
      setCurrent(addDays(current, -1));
      return;
    }

    if (view === 'semana') {
      setCurrent(addWeeks(current, -1));
      return;
    }

    setCurrent(addMonths(current, -1));
  }

  function moveNext() {
    if (view === 'dia') {
      setCurrent(addDays(current, 1));
      return;
    }

    if (view === 'semana') {
      setCurrent(addWeeks(current, 1));
      return;
    }

    setCurrent(addMonths(current, 1));
  }

  const periodLabel = (() => {
    if (view === 'dia') {
      return format(
        current,
        "EEEE d 'de' MMMM yyyy",
        { locale: es },
      );
    }

    if (view === 'semana') {
      return `${format(
        range.start,
        'd MMM',
        { locale: es },
      )} – ${format(
        range.end,
        'd MMM yyyy',
        { locale: es },
      )}`;
    }

    return format(
      current,
      'MMMM yyyy',
      { locale: es },
    );
  })();

  const profesionales = useMemo(() => {
    const map = new Map<
      number,
      string
    >();

    for (const t of turnos) {
      map.set(
        t.id_profesional,
        `${t.profesional_nombre} ${t.profesional_apellido}`,
      );
    }

    return [...map.entries()].sort(
      (a, b) =>
        a[1].localeCompare(b[1]),
    );
  }, [turnos]);

  const servicios = useMemo(() => {
    const map = new Map<
      number,
      string
    >();

    for (const t of turnos) {
      map.set(
        t.id_servicio,
        t.servicio_nombre ?? 'Sin servicio',
      );
    }

    return [...map.entries()].sort(
      (a, b) =>
        a[1].localeCompare(b[1]),
    );
  }, [turnos]);

  const filteredTurnos = useMemo(() => {
    return turnos.filter((t) => {
      if (
        profesionalFilter &&
        String(t.id_profesional) !==
          profesionalFilter
      ) {
        return false;
      }

      if (
        servicioFilter &&
        String(t.id_servicio) !==
          servicioFilter
      ) {
        return false;
      }

      if (
        estadoFilter &&
        t.estado !== estadoFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    turnos,
    profesionalFilter,
    servicioFilter,
    estadoFilter,
  ]);

  const resumen = useMemo(() => {
    return {
      total: turnos.length,

      confirmados: turnos.filter(
        (t) =>
          t.estado === 'CONFIRMADO',
      ).length,

      pendientes: turnos.filter(
        (t) =>
          t.estado === 'PENDIENTE',
      ).length,

      cancelados: turnos.filter(
        (t) =>
          t.estado === 'CANCELADO',
      ).length,
    };
  }, [turnos]);

  const turnosByDate = useMemo(() => {
    const map = new Map<
      string,
      TurnoDetalle[]
    >();

    for (const t of filteredTurnos) {
      /*
       * Soporta tanto:
       * 2026-10-22
       * como:
       * 2026-10-22T00:00:00.000Z
       */
      const fechaKey =
        String(t.fecha).substring(
          0,
          10,
        );

      const arr =
        map.get(fechaKey) ?? [];

      arr.push(t);

      map.set(fechaKey, arr);
    }

    for (const items of map.values()) {
      items.sort((a, b) =>
        a.hora_inicio.localeCompare(
          b.hora_inicio,
        ),
      );
    }

    return map;
  }, [filteredTurnos]);

  function clearFilters() {
    setProfesionalFilter('');
    setServicioFilter('');
    setEstadoFilter('');
  }

  const hasFilters =
    profesionalFilter !== '' ||
    servicioFilter !== '' ||
    estadoFilter !== '';

  return (
    <AdminLayout>
      <PageHeader
        title="Agenda"
        subtitle="Calendario de turnos"
      />

      {/* RESUMEN */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          title="Turnos"
          value={resumen.total}
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          className="bg-white"
        />

        <SummaryCard
          title="Confirmados"
          value={resumen.confirmados}
          icon={
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          }
          className="bg-emerald-50/60 border-emerald-100"
        />

        <SummaryCard
          title="Pendientes"
          value={resumen.pendientes}
          icon={
            <Clock3 className="h-5 w-5 text-amber-600" />
          }
          className="bg-amber-50/60 border-amber-100"
        />

        <SummaryCard
          title="Cancelados"
          value={resumen.cancelados}
          icon={
            <XCircle className="h-5 w-5 text-rose-600" />
          }
          className="bg-rose-50/60 border-rose-100"
        />
      </div>

      {/* FILTROS */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 mb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <select
              value={profesionalFilter}
              onChange={(e) =>
                setProfesionalFilter(
                  e.target.value,
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
            >
              <option value="">
                Todos los profesionales
              </option>

              {profesionales.map(
                ([id, nombre]) => (
                  <option
                    key={id}
                    value={String(id)}
                  >
                    {nombre}
                  </option>
                ),
              )}
            </select>

            <select
              value={servicioFilter}
              onChange={(e) =>
                setServicioFilter(
                  e.target.value,
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
            >
              <option value="">
                Todos los servicios
              </option>

              {servicios.map(
                ([id, nombre]) => (
                  <option
                    key={id}
                    value={String(id)}
                  >
                    {nombre}
                  </option>
                ),
              )}
            </select>

            <select
              value={estadoFilter}
              onChange={(e) =>
                setEstadoFilter(
                  e.target.value,
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
            >
              <option value="">
                Todos los estados
              </option>
              <option value="PENDIENTE">
                Pendientes
              </option>
              <option value="CONFIRMADO">
                Confirmados
              </option>
              <option value="FINALIZADO">
                Finalizados
              </option>
              <option value="AUSENTE">
                Ausentes
              </option>
              <option value="CANCELADO">
                Cancelados
              </option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-3 text-sm text-slate-500 hover:text-slate-900"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="text-sm text-slate-500">
            Mostrando{' '}
            <span className="font-semibold text-slate-800">
              {filteredTurnos.length}
            </span>{' '}
            turno
            {filteredTurnos.length !== 1
              ? 's'
              : ''}
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(
            [
              'dia',
              'semana',
              'mes',
            ] as ViewMode[]
          ).map((v) => (
            <button
              key={v}
              onClick={() =>
                setView(v)
              }
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                view === v
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {v === 'dia'
                ? 'Día'
                : v === 'semana'
                  ? 'Semana'
                  : 'Mes'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={movePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrent(new Date())
            }
          >
            Hoy
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={moveNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="ml-2 min-w-[190px] text-center text-sm font-semibold text-slate-800 capitalize">
            {periodLabel}
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando agenda..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {view === 'dia' && (
            <DayView
              date={current}
              turnos={
                turnosByDate.get(
                  format(
                    current,
                    'yyyy-MM-dd',
                  ),
                ) ?? []
              }
              onSelect={
                setSelectedTurno
              }
            />
          )}

          {view === 'semana' && (
            <WeekView
              start={range.start}
              end={range.end}
              turnosByDate={
                turnosByDate
              }
              onSelect={
                setSelectedTurno
              }
            />
          )}

          {view === 'mes' && (
            <MonthView
              monthDate={current}
              turnosByDate={
                turnosByDate
              }
              onSelect={
                setSelectedTurno
              }
            />
          )}
        </div>
      )}

      {selectedTurno && (
        <TurnoModal
          turno={selectedTurno}
          onClose={() =>
            setSelectedTurno(null)
          }
        />
      )}
    </AdminLayout>
  );
}

/* ======================================================
   RESUMEN
====================================================== */

function SummaryCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 p-4 ${className ?? ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-white/80 p-2 border border-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   TARJETA DE TURNO
====================================================== */

function TurnoCard({
  t,
  compact = false,
  onClick,
}: {
  t: TurnoDetalle;
  compact?: boolean;
  onClick?: () => void;
}) {
  const style =
    getEstadoStyle(t.estado);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border transition-all hover:shadow-sm ${style.card} ${
        compact
          ? 'px-2 py-1.5'
          : 'p-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`}
        />

        <span className="text-xs font-bold text-slate-800">
          {t.hora_inicio.slice(
            0,
            5,
          )}
        </span>

        {!compact && (
          <span
            className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
          >
            {style.label}
          </span>
        )}
      </div>

      <div
        className={
          compact
            ? 'mt-1'
            : 'mt-2'
        }
      >
        <p className="truncate text-xs font-semibold text-slate-900">
          {t.cliente_nombre}{' '}
          {t.cliente_apellido}
        </p>

        {!compact && (
          <>
            <p className="mt-0.5 truncate text-xs text-slate-600">
              {t.servicio_nombre}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {t.profesional_nombre}{' '}
              {t.profesional_apellido}
            </p>
          </>
        )}
      </div>
    </button>
  );
}

/* ======================================================
   DÍA
====================================================== */

function DayView({
  date,
  turnos,
  onSelect,
}: {
  date: Date;
  turnos: TurnoDetalle[];
  onSelect: (
    turno: TurnoDetalle,
  ) => void;
}) {
  return (
    <div className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 capitalize">
            {format(
              date,
              "EEEE d 'de' MMMM",
              { locale: es },
            )}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {turnos.length === 0
              ? 'No hay turnos para este día.'
              : `${turnos.length} turno${turnos.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {isToday(date) && (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Hoy
          </span>
        )}
      </div>

      {turnos.length === 0 ? (
        <EmptyDay />
      ) : (
        <div className="space-y-3">
          {turnos.map((t) => {
            const style =
              getEstadoStyle(
                t.estado,
              );

            return (
              <div
                key={t.id_turno}
                className="grid grid-cols-[75px_1fr] gap-4"
              >
                <div className="pt-3 text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {t.hora_inicio.slice(
                      0,
                      5,
                    )}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    a{' '}
                    {t.hora_fin.slice(
                      0,
                      5,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onSelect(t)
                  }
                  className={`relative rounded-xl border p-4 text-left transition-all hover:shadow-md ${style.card}`}
                >
                  <div
                    className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${style.dot}`}
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        {
                          t.cliente_nombre
                        }{' '}
                        {
                          t.cliente_apellido
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {
                          t.servicio_nombre
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          t.profesional_nombre
                        }{' '}
                        {
                          t.profesional_apellido
                        }
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                    >
                      {style.label}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   SEMANA
====================================================== */

function WeekView({
  start,
  end,
  turnosByDate,
  onSelect,
}: {
  start: Date;
  end: Date;
  turnosByDate: Map<
    string,
    TurnoDetalle[]
  >;
  onSelect: (
    turno: TurnoDetalle,
  ) => void;
}) {
  const days =
    eachDayOfInterval({
      start,
      end,
    });

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1050px] grid-cols-7">
        {days.map((day) => {
          const iso = format(
            day,
            'yyyy-MM-dd',
          );

          const dayTurnos =
            turnosByDate.get(
              iso,
            ) ?? [];

          return (
            <div
              key={iso}
              className={`min-h-[330px] border-r border-slate-100 last:border-r-0 ${
                isToday(day)
                  ? 'bg-indigo-50/40'
                  : 'bg-white'
              }`}
            >
              <div className="border-b border-slate-100 px-3 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {format(
                        day,
                        'EEE',
                        {
                          locale: es,
                        },
                      )}
                    </p>

                    <p
                      className={`mt-0.5 text-base font-bold ${
                        isToday(day)
                          ? 'text-indigo-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {format(
                        day,
                        'd',
                      )}
                    </p>
                  </div>

                  {dayTurnos.length >
                    0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {
                        dayTurnos.length
                      }
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 p-2">
                {dayTurnos
                  .slice(0, 6)
                  .map((t) => (
                    <TurnoCard
                      key={
                        t.id_turno
                      }
                      t={t}
                      onClick={() =>
                        onSelect(t)
                      }
                    />
                  ))}

                {dayTurnos.length >
                  6 && (
                  <p className="px-2 py-1 text-xs font-medium text-indigo-600">
                    +
                    {dayTurnos.length -
                      6}{' '}
                    turnos más
                  </p>
                )}

                {dayTurnos.length ===
                  0 && (
                  <p className="px-2 py-4 text-center text-xs text-slate-300">
                    Sin turnos
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================================================
   MES
====================================================== */

function MonthView({
  monthDate,
  turnosByDate,
  onSelect,
}: {
  monthDate: Date;
  turnosByDate: Map<
    string,
    TurnoDetalle[]
  >;
  onSelect: (
    turno: TurnoDetalle,
  ) => void;
}) {
  const monthStart =
    startOfMonth(monthDate);

  const monthEnd =
    endOfMonth(monthDate);

  const gridStart =
    startOfWeek(monthStart, {
      weekStartsOn: 1,
    });

  const gridEnd =
    endOfWeek(monthEnd, {
      weekStartsOn: 1,
    });

  const days =
    eachDayOfInterval({
      start: gridStart,
      end: gridEnd,
    });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
          {[
            'Lun',
            'Mar',
            'Mié',
            'Jue',
            'Vie',
            'Sáb',
            'Dom',
          ].map((d) => (
            <div
              key={d}
              className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const iso = format(
              day,
              'yyyy-MM-dd',
            );

            const inMonth =
              isSameMonth(
                day,
                monthDate,
              );

            const dayTurnos =
              turnosByDate.get(
                iso,
              ) ?? [];

            return (
              <div
                key={iso}
                className={`min-h-[145px] border-b border-r border-slate-100 p-2 ${
                  !inMonth
                    ? 'bg-slate-50/60'
                    : ''
                } ${
                  isToday(day)
                    ? 'bg-indigo-50/60'
                    : ''
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday(day)
                        ? 'bg-indigo-600 text-white'
                        : inMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                    }`}
                  >
                    {format(
                      day,
                      'd',
                    )}
                  </span>

                  {dayTurnos.length >
                    0 && (
                    <span className="text-[10px] font-medium text-slate-400">
                      {
                        dayTurnos.length
                      }{' '}
                      turno
                      {dayTurnos.length !==
                      1
                        ? 's'
                        : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayTurnos
                    .slice(0, 3)
                    .map((t) => (
                      <TurnoCard
                        key={
                          t.id_turno
                        }
                        t={t}
                        compact
                        onClick={() =>
                          onSelect(t)
                        }
                      />
                    ))}

                  {dayTurnos.length >
                    3 && (
                    <p className="cursor-default px-1 py-1 text-xs font-semibold text-indigo-600">
                      +
                      {dayTurnos.length -
                        3}{' '}
                      más
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   VACÍO
====================================================== */

function EmptyDay() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
      <CalendarDays className="h-9 w-9 text-slate-300" />

      <p className="mt-3 text-sm font-semibold text-slate-500">
        Sin turnos
      </p>

      <p className="mt-1 text-xs text-slate-400">
        No hay reservas para este día.
      </p>
    </div>
  );
}

/* ======================================================
   MODAL DETALLE
====================================================== */

function TurnoModal({
  turno,
  onClose,
}: {
  turno: TurnoDetalle;
  onClose: () => void;
}) {
  const style =
    getEstadoStyle(
      turno.estado,
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Detalle del turno
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {
                turno.cliente_nombre
              }{' '}
              {
                turno.cliente_apellido
              }
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
          >
            {style.label}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <DetailRow
            label="Fecha"
            value={String(
              turno.fecha,
            ).substring(0, 10)}
          />

          <DetailRow
            label="Horario"
            value={`${turno.hora_inicio.slice(
              0,
              5,
            )} – ${turno.hora_fin.slice(
              0,
              5,
            )}`}
          />

          <DetailRow
            label="Servicio"
            value={turno.servicio_nombre ?? 'Sin servicio'}
          />

          <DetailRow
            label="Profesional"
            value={`${turno.profesional_nombre} ${turno.profesional_apellido}`}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}