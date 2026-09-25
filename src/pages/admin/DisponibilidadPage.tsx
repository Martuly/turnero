import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Save } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { AdminLayout, PageHeader } from '@/components/admin/AdminLayout';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import type { DiaSemana, Disponibilidad, Profesional } from '@/types';
import { DIAS_SEMANA } from '@/types';

interface Slot { dia_semana: DiaSemana; hora_desde: string; hora_hasta: string; activo: boolean; }

export function DisponibilidadPage() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [selectedProf, setSelectedProf] = useState<number | ''>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { void loadProf(); }, []);

  async function loadProf() {
    setLoading(true); setError(null);
    try {
      const p = await api.getProfesionales();
      setProfesionales(p);
      if (p.length > 0) setSelectedProf(p[0].id_profesional);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error al cargar profesionales.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (selectedProf === '') return;
    void loadSlots();
  }, [selectedProf]);

  async function loadSlots() {
    setLoadingSlots(true); setError(null); setSuccess(false);
    try {
      const disp = await api.getDisponibilidad(Number(selectedProf));
      // Group into editable slots
      const grouped: Slot[] = disp.map((d) => ({
        dia_semana: d.dia_semana,
        hora_desde: d.hora_desde,
        hora_hasta: d.hora_hasta,
        activo: d.activo,
      }));
      setSlots(grouped);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error al cargar disponibilidad.'); }
    finally { setLoadingSlots(false); }
  }

  function addSlot(dia: DiaSemana) {
    setSlots((prev) => [...prev, { dia_semana: dia, hora_desde: '09:00', hora_hasta: '18:00', activo: true }]);
  }
  function updateSlot(idx: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function removeSlot(idx: number) {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    if (selectedProf === '') return;
    setSaving(true); setError(null); setSuccess(false);
    try {
      await api.saveDisponibilidad(Number(selectedProf), slots);
      setSuccess(true);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Error al guardar.'); }
    finally { setSaving(false); }
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader title="Disponibilidad" subtitle="Horarios semanales de atención por profesional" />

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Disponibilidad guardada correctamente.</div>}

      <div className="max-w-xs mb-6">
        <Select label="Profesional" value={selectedProf} onChange={(e) => setSelectedProf(e.target.value ? Number(e.target.value) : '')}>
          {profesionales.map((p) => <option key={p.id_profesional} value={p.id_profesional}>{p.nombre} {p.apellido}</option>)}
        </Select>
      </div>

      {selectedProf === '' ? (
        <div className="rounded-2xl bg-white border border-slate-200">
          <EmptyState title="Seleccioná un profesional" icon={<Clock className="h-10 w-10" />} />
        </div>
      ) : loadingSlots ? (
        <LoadingState label="Cargando horarios..." />
      ) : (
        <div className="space-y-4">
          {DIAS_SEMANA.map((dia) => {
            const daySlots = slots.map((s, i) => ({ ...s, _idx: i })).filter((s) => s.dia_semana === dia.value);
            return (
              <div key={dia.value} className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{dia.label}</h3>
                  <Button variant="ghost" size="sm" onClick={() => addSlot(dia.value)}>
                    <Plus className="h-4 w-4" /> Agregar franja
                  </Button>
                </div>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No atiende</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((s) => (
                      <div key={s._idx} className="flex items-center gap-3 flex-wrap">
                        <input
                          type="time"
                          value={s.hora_desde}
                          onChange={(e) => updateSlot(s._idx, { hora_desde: e.target.value })}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="time"
                          value={s.hora_hasta}
                          onChange={(e) => updateSlot(s._idx, { hora_hasta: e.target.value })}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-600 ml-2">
                          <input type="checkbox" checked={s.activo} onChange={(e) => updateSlot(s._idx, { activo: e.target.checked })} className="rounded border-slate-300" />
                          Activo
                        </label>
                        <button onClick={() => removeSlot(s._idx)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex justify-end pt-2">
            <Button loading={saving} onClick={save}><Save className="h-4 w-4" /> Guardar disponibilidad</Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
