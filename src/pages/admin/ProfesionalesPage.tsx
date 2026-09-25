import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Check } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import type { Profesional, Servicio } from '@/types';

interface FormState { nombre: string; apellido: string; email: string; telefono: string; activo: boolean; }
const emptyForm: FormState = { nombre: '', apellido: '', email: '', telefono: '', activo: true };

export function ProfesionalesPage() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profesional | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Service assignment modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProf, setAssignProf] = useState<Profesional | null>(null);
  const [assignedIds, setAssignedIds] = useState<number[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
  setLoading(true);
  setError(null);

  try {
    const [p, s] = await Promise.all([
      api.getProfesionales(),
      api.getServiciosAdmin(),
    ]);

    setProfesionales(p);
    setServicios(s);
  } catch (e) {
    setError(
      e instanceof ApiError
        ? e.message
        : 'Error al cargar profesionales.',
    );
  } finally {
    setLoading(false);
  }
}

  function openCreate() { setEditing(null); setForm(emptyForm); setFormError(null); setModalOpen(true); }
  function openEdit(p: Profesional) {
    setEditing(p);
    setForm({ nombre: p.nombre, apellido: p.apellido, email: p.email ?? '', telefono: p.telefono ?? '', activo: p.activo });
    setFormError(null); setModalOpen(true);
  }

  async function save() {
    if (!form.nombre.trim() || !form.apellido.trim()) { setFormError('Nombre y apellido son obligatorios.'); return; }
    setSaving(true); setFormError(null);
    try {
      const data = { ...form, email: form.email || null, telefono: form.telefono || null };
      if (editing) await api.updateProfesional(editing.id_profesional, data);
      else await api.createProfesional(data);
      setModalOpen(false); void load();
    } catch (e) { setFormError(e instanceof ApiError ? e.message : 'Error al guardar.'); }
    finally { setSaving(false); }
  }

  async function remove(p: Profesional) {
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido}?`)) return;
    try { await api.deleteProfesional(p.id_profesional); void load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Error al eliminar.'); }
  }

  async function openAssign(p: Profesional) {
    setAssignProf(p);
    try {
      const s = await api.getServiciosByProfesional(p.id_profesional);
      setAssignedIds(s.map((x) => x.id_servicio));
    } catch { setAssignedIds([]); }
    setAssignOpen(true);
  }

  function toggleServicio(id: number) {
    setAssignedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function saveAssign() {
    if (!assignProf) return;
    setAssignSaving(true);
    try {
      await api.updateServiciosProfesional(assignProf.id_profesional, assignedIds);
      setAssignOpen(false);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error al asignar servicios.'); }
    finally { setAssignSaving(false); }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Profesionales"
        subtitle="Gestión del equipo y servicios asignados"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo profesional</Button>}
      />
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <LoadingState />
      ) : profesionales.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200">
          <EmptyState title="Sin profesionales" description="Agregá profesionales para empezar a organizar la agenda." icon={<Users className="h-10 w-10" />} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profesionales.map((p) => (
            <div key={p.id_profesional} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                    {p.nombre[0]}{p.apellido[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.nombre} {p.apellido}</h3>
                    {!p.activo && <span className="text-xs text-slate-400">Inactivo</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="text-sm text-slate-500 space-y-0.5 mb-3">
                {p.email && <p>{p.email}</p>}
                {p.telefono && <p>{p.telefono}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={() => openAssign(p)} className="w-full">Asignar servicios</Button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar profesional' : 'Nuevo profesional'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Input label="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="rounded border-slate-300" />
            Activo
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button loading={saving} onClick={save}>{editing ? 'Guardar cambios' : 'Crear profesional'}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign services modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Servicios de ${assignProf?.nombre ?? ''} ${assignProf?.apellido ?? ''}`}>
        <div className="space-y-2">
          {servicios.length === 0 && <p className="text-sm text-slate-500">No hay servicios creados.</p>}
          {servicios.map((s) => {
            const asignado = assignedIds.includes(s.id_servicio);

            return (
              <label
                key={s.id_servicio}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  s.activo
                    ? 'border-slate-200 cursor-pointer hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <button
                  type="button"
                  disabled={!s.activo}
                  onClick={() => {
                    if (s.activo) {
                      toggleServicio(s.id_servicio);
                    }
                  }}
                  className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                    asignado
                      ? 'bg-slate-900 border-slate-900'
                      : 'border-slate-300'
                  } ${
                    !s.activo
                      ? 'cursor-not-allowed'
                      : ''
                  }`}
                >
                  {asignado && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {s.nombre}
                    </p>

                    {!s.activo && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {s.duracion_minutos} min · ${s.precio}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancelar</Button>
          <Button loading={assignSaving} onClick={saveAssign}>Guardar</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
