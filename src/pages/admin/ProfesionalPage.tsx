import { CalendarDays, Pencil, UserRound } from 'lucide-react';

type ProfesionalCardProps = {
  profesional: {
    id_profesional: number;
    nombre: string;
    apellido: string;
    especialidad?: string;
    fotoUrl?: string | null;
    activo?: boolean;
    servicios?: string[];
    disponibilidad?: string;
  };
  onEditar?: (id: number) => void;
  onVerAgenda?: (id: number) => void;
};

export function ProfesionalCard({
  profesional,
  onEditar,
  onVerAgenda,
}: ProfesionalCardProps) {
  const nombreCompleto = `${profesional.nombre} ${profesional.apellido}`;

  const iniciales = `${profesional.nombre?.[0] ?? ''}${profesional.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {profesional.fotoUrl ? (
            <img
              src={profesional.fotoUrl}
              alt={nombreCompleto}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-violet-50"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700 ring-4 ring-violet-50">
              {iniciales || <UserRound className="h-8 w-8" />}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {nombreCompleto}
              </h3>

              {profesional.especialidad && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {profesional.especialidad}
                </p>
              )}
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                profesional.activo !== false
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {profesional.activo !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Servicios
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {profesional.servicios && profesional.servicios.length > 0 ? (
                profesional.servicios.slice(0, 3).map((servicio) => (
                  <span
                    key={servicio}
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                  >
                    {servicio}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">
                  Sin servicios asociados
                </span>
              )}

              {profesional.servicios &&
                profesional.servicios.length > 3 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    +{profesional.servicios.length - 3}
                  </span>
                )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4 text-violet-500" />
            <span>
              {profesional.disponibilidad || 'Disponibilidad no configurada'}
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => onEditar?.(profesional.id_profesional)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onVerAgenda?.(profesional.id_profesional)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <CalendarDays className="h-4 w-4" />
              Ver agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}