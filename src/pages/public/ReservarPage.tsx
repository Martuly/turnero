import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, ArrowRight, ArrowLeft, Check, User } from 'lucide-react';
import { api, ApiError, API_MODE } from '@/api/client';
import { isDateAvailable } from '@/api/availability';
import { mockBloqueos, mockDisponibilidad, mockProfesionalServicio, mockServicios, mockTurnos } from '@/api/mockData';
import { MiniCalendar } from '@/components/MiniCalendar';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { APP_CONFIG } from '@/config/app';
import type { Profesional, Servicio } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type Step = 1 | 2 | 3 | 4;

export function ReservarPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [idServicio, setIdServicio] = useState<number | null>(null);
  const [idProfesional, setIdProfesional] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([api.getServicios(), api.getProfesionales()]);
      setServicios(s.filter((x) => x.activo));
      setProfesionales(p.filter((x) => x.activo));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }

  // profesionales that offer the selected service
  const profesionalesForServicio = useMemo(() => {
    if (idServicio == null) return [];
    // In mock mode we infer from mockProfesionalServicio via the availability API.
    // Simpler: show all active professionals; the backend filters properly.
    return profesionales;
  }, [profesionales, idServicio]);

  // Load available slots when date changes
  useEffect(() => {
    if (step !== 3 || fecha == null || idServicio == null) return;
    void loadHorarios();
  }, [fecha, idServicio, idProfesional, step]);

  async function loadHorarios() {
    if (fecha == null || idServicio == null) return;
    setLoadingHorarios(true);
    setHora(null);
    try {
      const res = await api.getHorariosDisponibles({ idServicio, idProfesional, fecha });
      setHorarios(res.horarios);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar horarios.');
    } finally {
      setLoadingHorarios(false);
    }
  }

  function isDateDisabled(date: Date): boolean {
    if (idServicio == null) return true;
    const iso = format(date, 'yyyy-MM-dd');
    // In mock mode we can compute synchronously
    if (API_MODE === 'mock') {
      return !isDateAvailable(
        iso,
        idServicio,
        idProfesional,
        mockServicios,
        mockProfesionalServicio,
        mockDisponibilidad,
        mockTurnos,
        mockBloqueos,
      );
    }
    // In real mode we can't know without an API call per date — allow selection, show slots after
    return false;
  }

  function validateForm() {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'Ingresá tu nombre';
    if (!form.apellido.trim()) errs.apellido = 'Ingresá tu apellido';
    if (!form.email.trim()) errs.email = 'Ingresá tu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
    if (!form.telefono.trim()) errs.telefono = 'Ingresá tu teléfono';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleConfirm() {
    console.log({
      idServicio,
      idProfesional,
      fecha,
      hora,
      form,
    });

    if (!validateForm()) return;
    if (idServicio == null || fecha == null || hora == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.crearTurno({
        id_servicio: idServicio,
        id_profesional: idProfesional,
        fecha,
        hora_inicio: hora,
        cliente: { ...form },
      });
      navigate('/reservar/confirmacion', { state: { turno: res.turno } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al reservar el turno.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Cargando servicios..." />;
  if (error && step === 1) return <ErrorState message={error} />;

  const servicioSel = servicios.find((s) => s.id_servicio === idServicio) ?? null;
  const profSel = profesionales.find((p) => p.id_profesional === idProfesional) ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">{APP_CONFIG.name}</span>
          </div>
          <a href="/admin" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Panel administrativo
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${step >= n ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {step > n ? <Check className="h-4 w-4" /> : n}
              </div>
              {n < 4 && <div className={`h-0.5 w-8 ${step > n ? 'bg-slate-900' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {error && step > 1 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Servicio */}
        {step === 1 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Elegí un servicio</h1>
            <p className="text-sm text-slate-500 mb-5">Seleccioná el servicio que querés reservar.</p>
            <div className="grid gap-3">
              {servicios.map((s) => (
                <button
                  key={s.id_servicio}
                  onClick={() => { setIdServicio(s.id_servicio); setStep(2); }}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all
                    ${idServicio === s.id_servicio ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <div>
                    <p className="font-medium text-slate-900">{s.nombre}</p>
                    {s.descripcion && <p className="text-sm text-slate-500 mt-0.5">{s.descripcion}</p>}
                    <p className="text-xs text-slate-400 mt-1.5">{s.duracion_minutos} min · ${s.precio}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2: Profesional + Fecha */}
        {step === 2 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Elegí profesional y fecha</h1>
            <p className="text-sm text-slate-500 mb-5">Podés elegir un profesional específico o dejarlo sin preferencia.</p>
            <div className="mb-5">
              <Select
                label="Profesional (opcional)"
                value={idProfesional ?? ''}
                onChange={(e) => setIdProfesional(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sin preferencia</option>
                {profesionalesForServicio.map((p) => (
                  <option key={p.id_profesional} value={p.id_profesional}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </Select>
            </div>
            <MiniCalendar selectedDate={fecha} onSelect={(d) => setFecha(d)} isDateDisabled={isDateDisabled} />
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button disabled={!fecha} onClick={() => { setStep(3); }}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* Step 3: Horario */}
        {step === 3 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Elegí un horario</h1>
            <p className="text-sm text-slate-500 mb-5">
              {fecha && format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })}
              {profSel && ` · ${profSel.nombre} ${profSel.apellido}`}
            </p>
            {loadingHorarios ? (
              <LoadingState label="Buscando horarios disponibles..." />
            ) : horarios.length === 0 ? (
              <ErrorState message="No hay horarios disponibles para esta fecha. Elegí otra fecha." />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {horarios.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHora(h)}
                    className={`h-11 rounded-lg border text-sm font-medium transition-all
                      ${hora === h ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button disabled={!hora} onClick={() => setStep(4)}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* Step 4: Datos + Confirmar */}
        {step === 4 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Tus datos</h1>
            <p className="text-sm text-slate-500 mb-5">Completá tus datos para confirmar la reserva.</p>

            {/* Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-5 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span>{fecha && format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })} · {hora}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                <span>{servicioSel?.nombre}{profSel ? ` · ${profSel.nombre} ${profSel.apellido}` : ' · Sin preferencia'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Duración: {servicioSel?.duracion_minutos} min · ${servicioSel?.precio}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} error={formErrors.nombre} />
              <Input label="Apellido" name="apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} error={formErrors.apellido} />
              <Input label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} />
              <Input label="Teléfono" name="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} error={formErrors.telefono} />
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button loading={submitting} onClick={handleConfirm}>
                Confirmar reserva
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
