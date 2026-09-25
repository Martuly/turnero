import { useEffect, useState } from 'react';
import { Plus, Trash2, Ban, CalendarOff } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import type { BloqueoAgenda, Profesional } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface FormState {
  id_profesional: number | '';
  fecha_desde: string;
  fecha_hasta: string;
  hora_desde: string;
  hora_hasta: string;
  allDay: boolean;
  motivo: string;
}
const emptyForm: FormState = { id_profesional: '', fecha_desde: '', fecha_hasta: '', hora_desde: '', hora_hasta: '', allDay: true, motivo: '' };

export function BloqueosPage() {
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [b, p] = await Promise.all([api.getBloqueos(), api.getProfesionales()]);
      setBloqueos(b); setProfesionales(p);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error al cargar bloqueos.'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ ...emptyForm, id_profesional: profesionales[0]?.id_profesional ?? '' });
    setFormError(null); setModalOpen(true);
  }

  async function save() {
    if (form.id_profesional === '' || !form.fecha_desde || !form.fecha_hasta || !form.motivo.trim()) {
      setFormError('Completá todos los campos obligatorios.');
      return;
    }
    setSaving(true); setFormError(null);
    try {
      await api.createBloqueo({
        id_profesional: Number(form.id_profesional),
        fecha_desde: form.fecha_desde,
        fecha_hasta: form.fecha_hasta,
        hora_desde: form.allDay ? null : form.hora_desde || null,
        hora_hasta: form.allDay ? null : form.hora_hasta || null,
        motivo: form.motivo,
      });
      setModalOpen(false); void load();
    } catch (e) { setFormError(e instanceof ApiError ? e.message : 'Error al guardar.'); }
    finally { setSaving(false); }
  }

  async function remove(b: BloqueoAgenda) {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    try { await api.deleteBloqueo(b.id_bloqueo); void load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error al eliminar.'); }
  }

  function profLabel(id: number) {
    const p = profesionales.find((x) => x.id_profesional === id);
    return p ? `${p.nombre} ${p.apellido}` : '—';
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Bloqueos de agenda"
        subtitle="Vacaciones, feriados, ausencias y reuniones"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo bloqueo</Button>}
      />
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <LoadingState />
      ) : bloqueos.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200">
          <EmptyState title="Sin bloqueos" description="Bloqueá fechas u horarios cuando no se atiende." icon={<Ban className="h-10 w-10" />} />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Profesional</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Desde</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Hasta</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Horario</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Motivo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bloqueos.map((b) => (
                  <tr key={b.id_bloqueo} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-900 font-medium">{profLabel(b.id_profesional)}</td>
                    <td className="px-4 py-3 text-slate-700 capitalize">{format(parseISO(b.fecha_desde), "d MMM yyyy", { locale: es })}</td>
                    <td className="px-4 py-3 text-slate-700 capitalize">{format(parseISO(b.fecha_hasta), "d MMM yyyy", { locale: es })}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {b.hora_desde ? `${b.hora_desde} – ${b.hora_hasta}` : 'Día completo'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.motivo}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(b)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo bloqueo">
        <div className="space-y-4">
          <Select label="Profesional" value={form.id_profesional} onChange={(e) => setForm({ ...form, id_profesional: e.target.value ? Number(e.target.value) : '' })}>
            {profesionales.map((p) => <option key={p.id_profesional} value={p.id_profesional}>{p.nombre} {p.apellido}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha desde" type="date" value={form.fecha_desde} onChange={(e) => setForm({ ...form, fecha_desde: e.target.value })} />
            <Input label="Fecha hasta" type="date" value={form.fecha_hasta} onChange={(e) => setForm({ ...form, fecha_hasta: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} className="rounded border-slate-300" />
            Día completo
          </label>
          {!form.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Hora desde" type="time" value={form.hora_desde} onChange={(e) => setForm({ ...form, hora_desde: e.target.value })} />
              <Input label="Hora hasta" type="time" value={form.hora_hasta} onChange={(e) => setForm({ ...form, hora_hasta: e.target.value })} />
            </div>
          )}
          <Textarea label="Motivo" rows={2} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Vacaciones, feriado, reunión..." />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={save}>Crear bloqueo</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
