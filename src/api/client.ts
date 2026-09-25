// API client. Switches between MOCK MODE and REAL API MODE based on VITE_API_MODE.
// No silent fallback: if REAL mode and the request fails, an error is thrown.
import type {
  BloqueoAgenda,
  Cliente,
  CrearTurnoPayload,
  CrearTurnoResponse,
  DashboardResumen,
  Disponibilidad,
  DisponibilidadResponse,
  EstadoTurno,
  Organizacion,
  Profesional,
  Servicio,
  Turno,
  TurnoDetalle,
} from '@/types';
import { APP_CONFIG } from '@/config/app';
import { auth } from './auth';
import { computeAvailableSlots } from './availability';
import type { AuthUser } from './auth';
import {
  mockBloqueos,
  mockClientes,
  mockDashboardResumen,
  mockDisponibilidad,
  mockOrganizacion,
  mockProfesionalServicio,
  mockProfesionales,
  mockServicios,
  mockTurnos,
  ORG_ID,
} from './mockData';

const MODE = (import.meta.env.VITE_API_MODE ?? 'mock') as 'mock' | 'real';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const API_MODE = MODE;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function realFetch<T>(path: string, init?: RequestInit, requireAuth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init?.headers) Object.assign(headers, init.headers);
  if (requireAuth) {
    const token = auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verificá que el backend esté en ejecución.',
    );
  }
  if (res.status === 401 && requireAuth) {
    auth.clear();
    window.location.href = '/login';
    throw new ApiError('Sesión expirada. Iniciá sesión nuevamente.');
  }
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error ?? body.message ?? msg;
    } catch {
      // ignore parse error
    }
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

// Public (no-auth) fetch wrapper for booking endpoints
async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return realFetch<T>(path, init, false);
}

// --- Public read endpoints ---
export const api = {
  // Organización
  async getOrganizacion(): Promise<Organizacion> {
    if (MODE === 'mock') return { ...mockOrganizacion };
    return publicFetch<Organizacion>(`/organizaciones/${ORG_ID}`);
  },

  // Servicios
  async getServicios(): Promise<Servicio[]> {
    if (MODE === 'mock') return [...mockServicios];
    return publicFetch<Servicio[]>(`/public/servicios/activos`);
  },
  async getServiciosAdmin(): Promise<Servicio[]> {
    if (MODE === 'mock') return [...mockServicios];

    return realFetch<Servicio[]>(
      `/servicios`
    );
  },
  async createServicio(data: Omit<Servicio, 'id_servicio' | 'id_organizacion'>): Promise<Servicio> {
    if (MODE === 'mock') {
      const id = Math.max(0, ...mockServicios.map((s) => s.id_servicio)) + 1;
      const s: Servicio = { ...data, id_servicio: id, id_organizacion: ORG_ID };
      mockServicios.push(s);
      return s;
    }
    return realFetch<Servicio>(`/servicios`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateServicio(id: number, data: Partial<Servicio>): Promise<Servicio> {
    if (MODE === 'mock') {
      const idx = mockServicios.findIndex((s) => s.id_servicio === id);
      if (idx < 0) throw new ApiError('Servicio no encontrado', 404);
      mockServicios[idx] = { ...mockServicios[idx], ...data };
      return mockServicios[idx];
    }
    return realFetch<Servicio>(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteServicio(id: number): Promise<void> {
    if (MODE === 'mock') {
      const idx = mockServicios.findIndex((s) => s.id_servicio === id);
      if (idx >= 0) mockServicios.splice(idx, 1);
      return;
    }
    await realFetch<void>(`/servicios/${id}`, { method: 'DELETE' });
  },

  // Profesionales
  async getProfesionales(): Promise<Profesional[]> {
    if (MODE === 'mock') return [...mockProfesionales];
    return publicFetch<Profesional[]>('/public/profesionales/activos');
  },
  async createProfesional(data: Omit<Profesional, 'id_profesional' | 'id_organizacion'>): Promise<Profesional> {
    if (MODE === 'mock') {
      const id = Math.max(0, ...mockProfesionales.map((p) => p.id_profesional)) + 1;
      const p: Profesional = { ...data, id_profesional: id, id_organizacion: ORG_ID };
      mockProfesionales.push(p);
      return p;
    }
    return realFetch<Profesional>(`/profesionales`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateProfesional(id: number, data: Partial<Profesional>): Promise<Profesional> {
    if (MODE === 'mock') {
      const idx = mockProfesionales.findIndex((p) => p.id_profesional === id);
      if (idx < 0) throw new ApiError('Profesional no encontrado', 404);
      mockProfesionales[idx] = { ...mockProfesionales[idx], ...data };
      return mockProfesionales[idx];
    }
    return realFetch<Profesional>(`/profesionales/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteProfesional(id: number): Promise<void> {
    if (MODE === 'mock') {
      const idx = mockProfesionales.findIndex((p) => p.id_profesional === id);
      if (idx >= 0) mockProfesionales.splice(idx, 1);
      return;
    }
    await realFetch<void>(`/profesionales/${id}`, { method: 'DELETE' });
  },
  async getServiciosByProfesional(id: number): Promise<Servicio[]> {
    if (MODE === 'mock') {
      const ids = mockProfesionalServicio.filter((ps) => ps.id_profesional === id).map((ps) => ps.id_servicio);
      return mockServicios.filter((s) => ids.includes(s.id_servicio));
    }
    return publicFetch<Servicio[]>(`/public/profesionales/${id}/servicios`);
  },
  async updateServiciosProfesional(id: number, idServicios: number[]): Promise<void> {
    if (MODE === 'mock') {
      mockProfesionalServicio.splice(0, mockProfesionalServicio.length);
      for (const idS of idServicios) {
        mockProfesionalServicio.push({ id_profesional: id, id_servicio: idS });
      }
      return;
    }
    await realFetch<void>(`/profesionales/${id}/servicios`, {
      method: 'PUT',
      body: JSON.stringify({ id_servicios: idServicios }),
    });
  },

  // Disponibilidad
  async getDisponibilidad(idProfesional: number): Promise<Disponibilidad[]> {
    if (MODE === 'mock') return mockDisponibilidad.filter((d) => d.id_profesional === idProfesional);
    return realFetch<Disponibilidad[]>(`/disponibilidad?idProfesional=${idProfesional}`);
  },
  async saveDisponibilidad(idProfesional: number, items: Omit<Disponibilidad, 'id_disponibilidad' | 'id_profesional'>[]): Promise<Disponibilidad[]> {
    if (MODE === 'mock') {
      mockDisponibilidad.splice(0, mockDisponibilidad.length);
      let nextId = 1;
      for (const it of items) {
        mockDisponibilidad.push({ ...it, id_disponibilidad: nextId++, id_profesional: idProfesional });
      }
      return mockDisponibilidad.filter((d) => d.id_profesional === idProfesional);
    }
    return realFetch<Disponibilidad[]>(`/disponibilidad?idProfesional=${idProfesional}`, {
      method: 'PUT',
      body: JSON.stringify(items),
    });
  },

  // Bloqueos
  async getBloqueos(idProfesional?: number): Promise<BloqueoAgenda[]> {
    if (MODE === 'mock') {
      return idProfesional ? mockBloqueos.filter((b) => b.id_profesional === idProfesional) : [...mockBloqueos];
    }
    const q = idProfesional ? `?idProfesional=${idProfesional}` : '';
    return realFetch<BloqueoAgenda[]>(`/bloqueos${q}`);
  },
  async createBloqueo(data: Omit<BloqueoAgenda, 'id_bloqueo'>): Promise<BloqueoAgenda> {
    if (MODE === 'mock') {
      const id = Math.max(0, ...mockBloqueos.map((b) => b.id_bloqueo)) + 1;
      const b: BloqueoAgenda = { ...data, id_bloqueo: id };
      mockBloqueos.push(b);
      return b;
    }
    return realFetch<BloqueoAgenda>(`/bloqueos`, { method: 'POST', body: JSON.stringify(data) });
  },
  async deleteBloqueo(id: number): Promise<void> {
    if (MODE === 'mock') {
      const idx = mockBloqueos.findIndex((b) => b.id_bloqueo === id);
      if (idx >= 0) mockBloqueos.splice(idx, 1);
      return;
    }
    await realFetch<void>(`/bloqueos/${id}`, { method: 'DELETE' });
  },

  // Disponibilidad de horarios (public booking)
  async getHorariosDisponibles(params: {
    idServicio: number;
    idProfesional: number | null;
    fecha: string;
  }): Promise<DisponibilidadResponse> {
    if (MODE === 'mock') {
      const horarios = computeAvailableSlots({
        fecha: params.fecha,
        idServicio: params.idServicio,
        idProfesional: params.idProfesional,
        servicios: mockServicios,
        profesionalServicio: mockProfesionalServicio,
        disponibilidad: mockDisponibilidad,
        turnos: mockTurnos,
        bloqueos: mockBloqueos,
      });
      return { fecha: params.fecha, id_profesional: params.idProfesional, id_servicio: params.idServicio, horarios };
    }
    const q = new URLSearchParams({
      idServicio: String(params.idServicio),
      fecha: params.fecha,
    });
    if (params.idProfesional != null) q.set('idProfesional', String(params.idProfesional));
    return publicFetch<DisponibilidadResponse>(`/disponibilidad/horarios?${q.toString()}`);
  },

  // Turnos
  async getTurnos(filters?: {
    fechaDesde?: string;
    fechaHasta?: string;
    idProfesional?: number;
    idServicio?: number;
    estado?: EstadoTurno;
  }): Promise<TurnoDetalle[]> {
    if (MODE === 'mock') {
      let result = [...mockTurnos];
      if (filters?.fechaDesde) result = result.filter((t) => t.fecha >= filters.fechaDesde!);
      if (filters?.fechaHasta) result = result.filter((t) => t.fecha <= filters.fechaHasta!);
      if (filters?.idProfesional != null) result = result.filter((t) => t.id_profesional === filters.idProfesional);
      if (filters?.idServicio != null) result = result.filter((t) => t.id_servicio === filters.idServicio);
      if (filters?.estado) result = result.filter((t) => t.estado === filters.estado);
      return result.sort((a, b) => (a.fecha + a.hora_inicio > b.fecha + b.hora_inicio ? 1 : -1));
    }
    const q = new URLSearchParams();
    if (filters?.fechaDesde) q.set('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) q.set('fechaHasta', filters.fechaHasta);
    if (filters?.idProfesional != null) q.set('idProfesional', String(filters.idProfesional));
    if (filters?.idServicio != null) q.set('idServicio', String(filters.idServicio));
    if (filters?.estado) q.set('estado', filters.estado);
    const qs = q.toString();
    return realFetch<TurnoDetalle[]>(`/turnos${qs ? `?${qs}` : ''}`);
  },
  async getTurno(id: number): Promise<TurnoDetalle> {
    if (MODE === 'mock') {
      const t = mockTurnos.find((x) => x.id_turno === id);
      if (!t) throw new ApiError('Turno no encontrado', 404);
      return t;
    }
    return realFetch<TurnoDetalle>(`/turnos/${id}`);
  },
  async crearTurno(payload: CrearTurnoPayload): Promise<CrearTurnoResponse> {
    if (MODE === 'mock') {
      // Re-validate availability server-side (mock equivalent)
      const horarios = computeAvailableSlots({
        fecha: payload.fecha,
        idServicio: payload.id_servicio,
        idProfesional: payload.id_profesional,
        servicios: mockServicios,
        profesionalServicio: mockProfesionalServicio,
        disponibilidad: mockDisponibilidad,
        turnos: mockTurnos,
        bloqueos: mockBloqueos,
      });
      if (!horarios.includes(payload.hora_inicio)) {
        throw new ApiError('El horario seleccionado ya no está disponible. Elegí otro horario.');
      }
      // Determine professional if none selected: pick first available
      let profId = payload.id_profesional;
      if (profId == null) {
        const candidate = mockProfesionalServicio
          .filter((ps) => ps.id_servicio === payload.id_servicio)
          .map((ps) => ps.id_profesional)
          .find((pid) => {
            const slots = computeAvailableSlots({
              fecha: payload.fecha,
              idServicio: payload.id_servicio,
              idProfesional: pid,
              servicios: mockServicios,
              profesionalServicio: mockProfesionalServicio,
              disponibilidad: mockDisponibilidad,
              turnos: mockTurnos,
              bloqueos: mockBloqueos,
            });
            return slots.includes(payload.hora_inicio);
          });
        if (candidate == null) throw new ApiError('No hay profesionales disponibles para ese horario.');
        profId = candidate;
      }
      const servicio = mockServicios.find((s) => s.id_servicio === payload.id_servicio)!;
      const endMin = toMinutes(payload.hora_inicio) + servicio.duracion_minutos;
      const horaFin = toHHMM(endMin);
      // Find or create client
      let cliente = mockClientes.find((c) => c.email.toLowerCase() === payload.cliente.email.toLowerCase());
      if (!cliente) {
        const id = Math.max(0, ...mockClientes.map((c) => c.id_cliente)) + 1;
        cliente = {
          id_cliente: id,
          nombre: payload.cliente.nombre,
          apellido: payload.cliente.apellido,
          email: payload.cliente.email,
          telefono: payload.cliente.telefono,
          created_at: new Date().toISOString(),
        };
        mockClientes.push(cliente);
      }
      const id = Math.max(0, ...mockTurnos.map((t) => t.id_turno)) + 1;
      const prof = mockProfesionales.find((p) => p.id_profesional === profId)!;
      const turno: TurnoDetalle = {
        id_turno: id,
        id_organizacion: ORG_ID,
        id_profesional: profId,
        id_servicio: payload.id_servicio,
        id_cliente: cliente.id_cliente,
        fecha: payload.fecha,
        hora_inicio: payload.hora_inicio,
        hora_fin: horaFin,
        estado: 'PENDIENTE',
        calendar_event_id: null,
        mail_confirmacion_enviado: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cliente_nombre: cliente.nombre,
        cliente_apellido: cliente.apellido,
        cliente_email: cliente.email,
        cliente_telefono: cliente.telefono ?? undefined,
        profesional_nombre: prof.nombre,
        profesional_apellido: prof.apellido,
        servicio_nombre: servicio.nombre,
        servicio_duracion_minutos: servicio.duracion_minutos,
        servicio_precio: servicio.precio,
      };
      mockTurnos.push(turno);
      return { turno };
    }
    return publicFetch<CrearTurnoResponse>(`/turnos`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateEstadoTurno(id: number, estado: EstadoTurno): Promise<Turno> {
    if (MODE === 'mock') {
      const t = mockTurnos.find((x) => x.id_turno === id);
      if (!t) throw new ApiError('Turno no encontrado', 404);
      t.estado = estado;
      t.updated_at = new Date().toISOString();
      return t;
    }
    return realFetch<Turno>(`/turnos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
  },

  // Clientes
  async getClientes(): Promise<Cliente[]> {
    if (MODE === 'mock') return [...mockClientes];
    return realFetch<Cliente[]>(`/clientes`);
  },

  // Dashboard
  async getDashboardResumen(): Promise<DashboardResumen> {
    if (MODE === 'mock') return mockDashboardResumen();
    return realFetch<DashboardResumen>(`/dashboard/resumen`);
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; usuario: AuthUser }> {
    if (MODE === 'mock') {
      // Mock login — accept a known demo credential
      if (email === 'admin@demo.com' && password === 'admin123') {
        return {
          token: 'mock-token',
          usuario: { idUsuario: 1, nombre: 'Administrador', email, rol: 'ADMIN', idOrganizacion: 1 },
        };
      }
      throw new ApiError('Credenciales inválidas.', 401);
    }
    return publicFetch<{ token: string; usuario: AuthUser }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// re-export helpers used by mock crearTurno
import { toMinutes, toHHMM } from './availability';
