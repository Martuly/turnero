import type { EstadoTurno } from '@/types';

const styles: Record<EstadoTurno, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-red-50 text-red-700 border-red-200',
  FINALIZADO: 'bg-slate-100 text-slate-600 border-slate-200',
  AUSENTE: 'bg-orange-50 text-orange-700 border-orange-200',
};

export function EstadoBadge({ estado }: { estado: EstadoTurno }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}
