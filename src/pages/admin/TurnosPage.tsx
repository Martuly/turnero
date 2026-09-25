import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { ListTodo } from 'lucide-react';
import type { EstadoTurno, Profesional, Servicio, TurnoDetalle } from '@/types';
import { ESTADOS_TURNO } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function TurnosPage() {
  const [turnos, setTurnos] = useState<TurnoDetalle[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [fFechaDesde, setFFechaDesde] = useState('');
  const [fFechaHasta, setFFechaHasta] = useState('');
  const [fProfesional, setFProfesional] = useState('');
  const [fServicio, setFServicio] = useState('');
  const [fEstado, setFEstado] = useState('');

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [t, p, s] = await Promise.all([api.getTurnos(), api.getProfesionales(), api.getServicios()]);
      setTurnos(t);
      setProfesionales(p);
      setServicios(s);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar los turnos.');
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTurnos({
        fechaDesde: fFechaDesde || undefined,
        fechaHasta: fFechaHasta || undefined,
        idProfesional: fProfesional ? Number(fProfesional) : undefined,
        idServicio: fServicio ? Number(fServicio) : undefined,
        estado: (fEstado as EstadoTurno) || undefined,
      });
      setTurnos(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al filtrar.');
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFFechaDesde(''); setFFechaHasta(''); setFProfesional(''); setFServicio(''); setFEstado('');
    void loadInitial();
  }

  async function changeEstado(id: number, estado: EstadoTurno) {
    setUpdatingId(id);
    try {
      await api.updateEstadoTurno(id, estado);
      setTurnos((prev) => prev.map((t) => (t.id_turno === id ? { ...t, estado } : t)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  }

  const hasFilters = useMemo(() => fFechaDesde || fFechaHasta || fProfesional || fServicio || fEstado, [fFechaDesde, fFechaHasta, fProfesional, fServicio, fEstado]);

  return (
    <AdminLayout>
      <PageHeader title="Turnos" subtitle="Gestión y administración de turnos" />

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input label="Fecha desde" type="date" value={fFechaDesde} onChange={(e) => setFFechaDesde(e.target.value)} />
          <Input label="Fecha hasta" type="date" value={fFechaHasta} onChange={(e) => setFFechaHasta(e.target.value)} />
          <Select label="Profesional" value={fProfesional} onChange={(e) => setFProfesional(e.target.value)}>
            <option value="">Todos</option>
            {profesionales.map((p) => <option key={p.id_profesional} value={p.id_profesional}>{p.nombre} {p.apellido}</option>)}
          </Select>
          <Select label="Servicio" value={fServicio} onChange={(e) => setFServicio(e.target.value)}>
            <option value="">Todos</option>
            {servicios.map((s) => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>)}
          </Select>
          <Select label="Estado" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS_TURNO.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button>}
          <Button size="sm" onClick={applyFilters}>Aplicar filtros</Button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingState label="Cargando turnos..." />
      ) : turnos.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200">
          <EmptyState title="No hay turnos" description="No se encontraron turnos con los filtros aplicados." icon={<ListTodo className="h-10 w-10" />} />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Hora</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Servicio</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Profesional</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {turnos.map((t) => (
                  <tr key={t.id_turno} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-700 capitalize">{format(parseISO(t.fecha), "d MMM yyyy", { locale: es })}</td>
                    <td className="px-4 py-3 text-slate-700">{t.hora_inicio} – {t.hora_fin}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{t.cliente_nombre} {t.cliente_apellido}</td>
                    <td className="px-4 py-3 text-slate-700">{t.servicio_nombre}</td>
                    <td className="px-4 py-3 text-slate-700">{t.profesional_nombre} {t.profesional_apellido}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={t.estado} /></td>
                    <td className="px-4 py-3">
                      <Select
                        value={t.estado}
                        disabled={updatingId === t.id_turno}
                        onChange={(e) => changeEstado(t.id_turno, e.target.value as EstadoTurno)}
                        className="h-8 text-xs"
                      >
                        {ESTADOS_TURNO.map((e) => <option key={e} value={e}>{e}</option>)}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
