import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Power,
  Briefcase,
} from 'lucide-react';

import { api, ApiError } from '@/api/client';

import {
  AdminLayout,
  PageHeader,
} from '@/components/admin/AdminLayout';

import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui/Feedback';

import { Button } from '@/components/ui/Button';
import {
  Input,
  Textarea,
} from '@/components/ui/Field';

import { Modal } from '@/components/ui/Modal';

import type { Servicio } from '@/types';

interface FormState {
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
}

const emptyForm: FormState = {
  nombre: '',
  descripcion: '',
  duracion_minutos: 30,
  precio: 0,
  activo: true,
};

export function ServiciosPage() {
  const [servicios, setServicios] =
    useState<Servicio[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Servicio | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      // Administración:
      // trae servicios activos e inactivos.
      setServicios(
        await api.getServiciosAdmin(),
      );
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Error al cargar servicios.',
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: Servicio) {
    setEditing(s);

    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      duracion_minutos:
        s.duracion_minutos,
      precio: s.precio,
      activo: s.activo,
    });

    setFormError(null);
    setModalOpen(true);
  }

  async function save() {
    if (!form.nombre.trim()) {
      setFormError(
        'El nombre es obligatorio.',
      );
      return;
    }

    if (
      !Number.isFinite(
        form.duracion_minutos,
      ) ||
      form.duracion_minutos <= 0
    ) {
      setFormError(
        'La duración debe ser mayor que cero.',
      );
      return;
    }

    if (
      !Number.isFinite(form.precio) ||
      form.precio < 0
    ) {
      setFormError(
        'El precio no puede ser negativo.',
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        descripcion:
          form.descripcion.trim() ||
          null,
      };

      if (editing) {
        await api.updateServicio(
          editing.id_servicio,
          payload,
        );
      } else {
        await api.createServicio(
          payload,
        );
      }

      setModalOpen(false);
      setEditing(null);

      await load();
    } catch (e) {
      setFormError(
        e instanceof ApiError
          ? e.message
          : 'Error al guardar.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(
    s: Servicio,
  ) {
    const accion =
      s.activo
        ? 'desactivar'
        : 'reactivar';

    const mensaje = s.activo
      ? `¿Desactivar el servicio "${s.nombre}"?`
      : `¿Reactivar el servicio "${s.nombre}"?`;

    if (!confirm(mensaje)) {
      return;
    }

    setError(null);

    try {
      await api.updateServicio(
        s.id_servicio,
        {
          activo: !s.activo,
        },
      );

      await load();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : `Error al ${accion} el servicio.`,
      );
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Servicios"
        subtitle="Gestión de servicios ofrecidos"
        action={
          <Button
            onClick={openCreate}
          >
            <Plus size={16} />
            Nuevo servicio
          </Button>
        }
      />

      {error && (
        <ErrorState
          message={error}
        />
      )}

      {loading ? (
        <LoadingState />
      ) : servicios.length === 0 ? (
        <EmptyState
          title="Sin servicios"
          description="Creá tu primer servicio para empezar a recibir reservas."
          icon={<Briefcase />}
        />
      ) : (
        <div className="grid gap-4">
          {servicios.map((s) => (
            <div
              key={s.id_servicio}
              className={`rounded-xl border bg-white p-4 ${
                s.activo
                  ? 'border-slate-200'
                  : 'border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {s.nombre}
                    </h3>

                    {!s.activo && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Inactivo
                      </span>
                    )}
                  </div>

                  {s.descripcion && (
                    <p className="mt-1 text-sm text-slate-500">
                      {s.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(s)
                    }
                    title="Editar servicio"
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void toggleActivo(s)
                    }
                    title={
                      s.activo
                        ? 'Desactivar servicio'
                        : 'Reactivar servicio'
                    }
                    className={`rounded-lg p-1.5 transition-colors ${
                      s.activo
                        ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                        : 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    <Power
                      size={16}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>
                  {s.duracion_minutos}{' '}
                  min
                </span>

                <span>
                  ${s.precio}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        title={
          editing
            ? 'Editar servicio'
            : 'Nuevo servicio'
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) =>
              setForm({
                ...form,
                nombre:
                  e.target.value,
              })
            }
          />

          <Textarea
            label="Descripción"
            rows={2}
            value={
              form.descripcion
            }
            onChange={(e) =>
              setForm({
                ...form,
                descripcion:
                  e.target.value,
              })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración (minutos)"
              type="number"
              min={1}
              value={
                form.duracion_minutos
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  duracion_minutos:
                    Number(
                      e.target
                        .value,
                    ),
                })
              }
            />

          <Input
              label="Precio"
              type="number"
              min={0}
              value={form.precio}
              onChange={(e) =>
                setForm({
                  ...form,
                  precio:
                    e.target.value === ''
                      ? 0
                      : Number(e.target.value),
                })
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm({
                  ...form,
                  activo:
                    e.target.checked,
                })
              }
              className="rounded border-slate-300"
            />

            Activo
          </label>

          {formError && (
            <p className="text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() =>
                setModalOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              loading={saving}
              onClick={save}
            >
              {editing
                ? 'Guardar cambios'
                : 'Crear servicio'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}