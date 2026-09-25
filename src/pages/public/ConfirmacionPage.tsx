import { useLocation, useNavigate } from 'react-router-dom';
import { Check, CalendarDays, Clock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_CONFIG } from '@/config/app';
import type { TurnoDetalle } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function ConfirmacionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const turno = (location.state as { turno: TurnoDetalle } | null)?.turno ?? null;

  if (!turno) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No hay información de reserva.</p>
          <Button onClick={() => navigate('/reservar')}>Volver a reservar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900">{APP_CONFIG.name}</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
              <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Tu turno fue reservado correctamente</h1>
            <p className="text-sm text-slate-500 mb-6">Te enviamremos un recordatorio próximo a la fecha.</p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Servicio</p>
                  <p className="text-sm font-medium text-slate-900">{turno.servicio_nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Profesional</p>
                  <p className="text-sm font-medium text-slate-900">{turno.profesional_nombre} {turno.profesional_apellido}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Fecha</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{format(parseISO(turno.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Hora</p>
                  <p className="text-sm font-medium text-slate-900">{turno.hora_inicio} – {turno.hora_fin}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => navigate('/reservar')}>
                Reservar otro turno <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => navigate('/admin')}>Ir al panel administrativo</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
