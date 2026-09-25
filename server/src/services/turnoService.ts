import { withTransaction } from '../db/pool.js';
import { clienteRepository } from '../repository/clienteRepository.js';
import { profesionalRepository } from '../repository/profesionalRepository.js';
import { servicioRepository } from '../repository/servicioRepository.js';
import { turnoRepository } from '../repository/turnoRepository.js';
import {
  getHorariosDisponibles,
  toMinutes,
  toHHMM,
} from './disponibilidadService.js';

import type {
  CrearTurnoPayload,
  TurnoDetalleRow,
  TurnoRow,
} from '../types.js';

const DEFAULT_ORG_ID = 1;

type AccionTurno =
  | 'NUEVO_TURNO'
  | 'CONFIRMAR_TURNO'
  | 'CANCELAR_TURNO'
  | 'REPROGRAMAR_TURNO';

export class BookingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'BookingError';
    this.status = status;
  }
}

/**
 * Envía a n8n las novedades relacionadas con un turno.
 *
 * Por el momento:
 * - NUEVO_TURNO usa N8N_WEBHOOK_NUEVO_TURNO.
 * - Las demás acciones usan N8N_WEBHOOK_GESTION_TURNO.
 *
 * Si n8n falla, la operación principal no se revierte.
 * El error queda registrado en el log del backend.
 */
async function notificarN8n(
  accion: AccionTurno,
  turno: TurnoDetalleRow,
): Promise<void> {
  const webhookUrl =
    accion === 'NUEVO_TURNO'
      ? process.env.N8N_WEBHOOK_NUEVO_TURNO
      : process.env.N8N_WEBHOOK_GESTION_TURNO;

  if (!webhookUrl) {
    console.warn(
      `No se configuró el webhook de n8n para la acción ${accion}.`,
    );
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        accion,

        id_turno: turno.id_turno,
        id_organizacion: turno.id_organizacion,
        id_profesional: turno.id_profesional,
        id_servicio: turno.id_servicio,

        token_gestion: turno.token_gestion,
        calendar_event_id: turno.calendar_event_id,

        cliente: {
          nombre: turno.cliente_nombre,
          apellido: turno.cliente_apellido,
          email: turno.cliente_email,
          telefono: turno.cliente_telefono,
        },

        servicio: {
          nombre: turno.servicio_nombre,
          duracion_minutos:
            turno.servicio_duracion_minutos,
          precio: turno.servicio_precio,
        },

        profesional: {
          nombre: turno.profesional_nombre,
          apellido: turno.profesional_apellido,
        },

        fecha: turno.fecha,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,

        estado: turno.estado,
        fecha_confirmacion: turno.fecha_confirmacion,
        fecha_cancelacion: turno.fecha_cancelacion,
        motivo_cancelacion: turno.motivo_cancelacion,
      }),
    });

    if (!response.ok) {
      const responseBody = await response
        .text()
        .catch(() => '');

      console.error(
        `n8n respondió con estado ${response.status} para ${accion}.`,
        responseBody,
      );
    }
  } catch (error) {
    console.error(
      `Error notificando a n8n la acción ${accion}:`,
      error,
    );
  }
}

export const turnoService = {
  async list(filters: {
    fechaDesde?: string;
    fechaHasta?: string;
    idProfesional?: number;
    idServicio?: number;
    estado?: string;
  }) {
    return turnoRepository.findWithFilters(filters as never);
  },

  async getById(id: number): Promise<TurnoDetalleRow> {
    const turno = await turnoRepository.findDetailById(id);

    if (!turno) {
      throw new BookingError('Turno no encontrado.', 404);
    }

    return turno;
  },

  async crearTurno(
    payload: CrearTurnoPayload,
  ): Promise<TurnoDetalleRow> {
    // 1. Validar que el servicio exista y esté activo.
    const servicio = await servicioRepository.findById(
      payload.id_servicio,
      DEFAULT_ORG_ID,
    );

    if (!servicio || !servicio.activo) {
      throw new BookingError(
        'El servicio no está disponible.',
      );
    }

    /*
     * 2. Determinar el profesional.
     *
     * Si el cliente seleccionó un profesional, se valida su
     * disponibilidad.
     *
     * Si no seleccionó ninguno, el sistema busca el primer
     * profesional disponible que preste el servicio.
     */
    let profId = payload.id_profesional;

    if (profId != null) {
      const disponibilidad =
        await getHorariosDisponibles({
        idOrganizacion: DEFAULT_ORG_ID,
        idServicio: payload.id_servicio,
        idProfesional: profId,
        fecha: payload.fecha,
      });

      if (
        !disponibilidad.horarios.includes(
          payload.hora_inicio,
        )
      ) {
        throw new BookingError(
          'El horario seleccionado ya no está disponible. Elegí otro horario.',
        );
      }
    } else {
      const profesionales =
        await profesionalRepository.getProfesionalesByServicio(
          payload.id_servicio,
          DEFAULT_ORG_ID,
        );

      for (const profesional of profesionales) {
        const disponibilidad =
          await getHorariosDisponibles({
          idOrganizacion: DEFAULT_ORG_ID,
          idServicio: payload.id_servicio,
          idProfesional: profesional.id_profesional,
          fecha: payload.fecha,
        });

        if (
          disponibilidad.horarios.includes(
            payload.hora_inicio,
          )
        ) {
          profId = profesional.id_profesional;
          break;
        }
      }

      if (profId == null) {
        throw new BookingError(
          'No hay profesionales disponibles para ese horario.',
        );
      }
    }

    // 3. Validar que el profesional preste el servicio.
    const serviciosProfesional =
      await profesionalRepository.getServiciosByProfesional(
        profId,
        DEFAULT_ORG_ID,
      );

    const ofreceServicio = serviciosProfesional.some(
      (item) =>
        item.id_servicio === payload.id_servicio,
    );

    if (!ofreceServicio) {
      throw new BookingError(
        'El profesional seleccionado no ofrece ese servicio.',
      );
    }

    // 4. Calcular la hora de finalización.
    const horaFin = toHHMM(
      toMinutes(payload.hora_inicio) +
        servicio.duracion_minutos,
    );

    /*
     * 5. Crear el turno.
     *
     * Dentro de la transacción volvemos a verificar el conflicto.
     * Esto reduce el riesgo de que dos personas reserven el mismo
     * horario casi simultáneamente.
     */
    const turno = await withTransaction(
      async (client) => {
        const existeConflicto =
          await turnoRepository.hasConflict(
            client,
            profId,
            payload.fecha,
            payload.hora_inicio,
            horaFin,
          );

        if (existeConflicto) {
          throw new BookingError(
            'El horario acaba de ser reservado por otra persona. Elegí otro horario.',
          );
        }

        let cliente =
          await clienteRepository.findByEmail(
            payload.cliente.email,
          );

        if (!cliente) {
          cliente = await clienteRepository.create({
            nombre: payload.cliente.nombre,
            apellido: payload.cliente.apellido,
            email: payload.cliente.email,
            telefono:
              payload.cliente.telefono?.trim() ||
              null,
          });
        }

        return turnoRepository.createInTransaction(
          client,
          {
            id_organizacion: DEFAULT_ORG_ID,
            id_profesional: profId,
            id_servicio: payload.id_servicio,
            id_cliente: cliente.id_cliente,
            fecha: payload.fecha,
            hora_inicio: payload.hora_inicio,
            hora_fin: horaFin,
            estado: 'PENDIENTE',
          },
        );
      },
    );

    // 6. Recuperar el turno con todos sus datos relacionados.
    const detalle =
      await turnoRepository.findDetailById(
        turno.id_turno,
      );

    if (!detalle) {
      throw new BookingError(
        'El turno fue creado, pero no pudo recuperarse.',
        500,
      );
    }

    // 7. Crear evento y enviar correo mediante n8n.
    await notificarN8n('NUEVO_TURNO', detalle);

    return detalle;
  },

  async confirmarTurno(
    token: string,
  ): Promise<TurnoDetalleRow> {
    const tokenNormalizado = token.trim();

    if (!tokenNormalizado) {
      throw new BookingError(
        'El token del turno es obligatorio.',
      );
    }

    const existente =
      await turnoRepository.findDetailByToken(
        tokenNormalizado,
      );

    if (!existente) {
      throw new BookingError(
        'El enlace de confirmación no es válido.',
        404,
      );
    }

    /*
     * La confirmación es idempotente:
     * si el cliente abre nuevamente el enlace, mostramos el
     * turno confirmado en lugar de devolver un error.
     */
    if (existente.estado === 'CONFIRMADO') {
      return existente;
    }

    if (existente.estado === 'CANCELADO') {
      throw new BookingError(
        'El turno está cancelado y no puede confirmarse.',
        409,
      );
    }

    if (existente.estado !== 'PENDIENTE') {
      throw new BookingError(
        `El turno no puede confirmarse porque se encuentra en estado ${existente.estado}.`,
        409,
      );
    }

    const actualizado =
      await turnoRepository.confirmarByToken(
        tokenNormalizado,
      );

    if (!actualizado) {
      throw new BookingError(
        'El turno cambió de estado y no pudo confirmarse.',
        409,
      );
    }

    const detalle =
      await turnoRepository.findDetailByToken(
        tokenNormalizado,
      );

    if (!detalle) {
      throw new BookingError(
        'El turno fue confirmado, pero no pudo recuperarse.',
        500,
      );
    }

    await notificarN8n(
      'CONFIRMAR_TURNO',
      detalle,
    );

    return detalle;
  },

  async cancelarTurno(
    token: string,
    motivo?: string,
  ): Promise<TurnoDetalleRow> {
    const tokenNormalizado = token.trim();

    if (!tokenNormalizado) {
      throw new BookingError(
        'El token del turno es obligatorio.',
      );
    }

    const existente =
      await turnoRepository.findDetailByToken(
        tokenNormalizado,
      );

    if (!existente) {
      throw new BookingError(
        'El enlace de cancelación no es válido.',
        404,
      );
    }

    /*
     * La cancelación también es idempotente:
     * si ya se encontraba cancelado, devolvemos su estado actual.
     */
    if (existente.estado === 'CANCELADO') {
      return existente;
    }

    if (
      existente.estado === 'FINALIZADO' ||
      existente.estado === 'AUSENTE'
    ) {
      throw new BookingError(
        `El turno no puede cancelarse porque se encuentra en estado ${existente.estado}.`,
        409,
      );
    }

    const motivoNormalizado =
      motivo?.trim() || null;

    if (
      motivoNormalizado &&
      motivoNormalizado.length > 255
    ) {
      throw new BookingError(
        'El motivo de cancelación no puede superar los 255 caracteres.',
      );
    }

    const actualizado =
      await turnoRepository.cancelarByToken(
        tokenNormalizado,
        motivoNormalizado,
      );

    if (!actualizado) {
      throw new BookingError(
        'El turno cambió de estado y no pudo cancelarse.',
        409,
      );
    }

    const detalle =
      await turnoRepository.findDetailByToken(
        tokenNormalizado,
      );

    if (!detalle) {
      throw new BookingError(
        'El turno fue cancelado, pero no pudo recuperarse.',
        500,
      );
    }

    await notificarN8n(
      'CANCELAR_TURNO',
      detalle,
    );

    return detalle;
  },

  async reprogramarTurno(
    token: string,
    nuevaFecha: string,
    nuevaHoraInicio: string,
  ): Promise<TurnoDetalleRow> {
    const tokenNormalizado = token.trim();

    if (!tokenNormalizado) {
      throw new BookingError(
        'El token del turno es obligatorio.',
      );
    }

    if (!nuevaFecha || !nuevaHoraInicio) {
      throw new BookingError(
        'La nueva fecha y hora son obligatorias.',
      );
    }

    const existente =
      await turnoRepository.findDetailByToken(
        tokenNormalizado,
      );

    if (!existente) {
      throw new BookingError(
        'El enlace de reprogramación no es válido.',
        404,
      );
    }

    if (
      existente.estado === 'CANCELADO' ||
      existente.estado === 'FINALIZADO' ||
      existente.estado === 'AUSENTE'
    ) {
      throw new BookingError(
        `El turno no puede reprogramarse porque se encuentra en estado ${existente.estado}.`,
        409,
      );
    }

    const servicio =
      await servicioRepository.findById(
        existente.id_servicio,
        existente.id_organizacion,
      );

    if (!servicio || !servicio.activo) {
      throw new BookingError(
        'El servicio del turno ya no está disponible.',
        409,
      );
    }

    const disponibilidad =
      await getHorariosDisponibles({
        idOrganizacion: existente.id_organizacion,
        idServicio: existente.id_servicio,
        idProfesional: existente.id_profesional,
        fecha: nuevaFecha,
        excludeTurnoId: existente.id_turno,
      });

    if (
      !disponibilidad.horarios.includes(
        nuevaHoraInicio,
      )
    ) {
      throw new BookingError(
        'El nuevo horario seleccionado no está disponible.',
        409,
      );
    }

    const nuevaHoraFin = toHHMM(
      toMinutes(nuevaHoraInicio) +
        servicio.duracion_minutos,
    );

    await withTransaction(async (client) => {
      const existeConflicto =
        await turnoRepository.hasConflict(
          client,
          existente.id_profesional,
          nuevaFecha,
          nuevaHoraInicio,
          nuevaHoraFin,
          existente.id_turno,
        );

      if (existeConflicto) {
        throw new BookingError(
          'El horario acaba de ser reservado. Elegí otro.',
          409,
        );
      }

      const actualizado =
        await turnoRepository.reprogramarByToken(
          client,
          tokenNormalizado,
          {
            fecha: nuevaFecha,
            hora_inicio: nuevaHoraInicio,
            hora_fin: nuevaHoraFin,
          },
        );

      if (!actualizado) {
        throw new BookingError(
          'No fue posible reprogramar el turno.',
          409,
        );
      }
    });

    const detalle =
      await turnoRepository.findDetailByToken(
        tokenNormalizado,
      );

    if (!detalle) {
      throw new BookingError(
        'El turno fue reprogramado, pero no pudo recuperarse.',
        500,
      );
    }

    await notificarN8n(
      'REPROGRAMAR_TURNO',
      detalle,
    );

    return detalle;
  },
  async guardarCalendarEventId(
    idTurno: number,
    calendarEventId: string,
  ): Promise<TurnoRow> {
    const existente =
      await turnoRepository.findDetailById(
        idTurno,
      );

    if (!existente) {
      throw new BookingError(
        'Turno no encontrado.',
        404,
      );
    }

    const actualizado =
      await turnoRepository.updateCalendarEventId(
        idTurno,
        calendarEventId,
      );

    if (!actualizado) {
      throw new BookingError(
        'No fue posible guardar el identificador de Google Calendar.',
        500,
      );
    }

    return actualizado;
  },
  async sincronizarRespuestaCalendar(
    calendarEventId: string,
    responseStatus: string,
    ): Promise<TurnoRow> {
      const eventIdNormalizado =
        calendarEventId.trim();

      const responseStatusNormalizado =
        responseStatus.trim();

      if (!eventIdNormalizado) {
        throw new BookingError(
          'calendar_event_id es obligatorio.',
        );
      }

      if (!responseStatusNormalizado) {
        throw new BookingError(
          'response_status es obligatorio.',
        );
      }

      const existente =
        await turnoRepository.findByCalendarEventId(
          eventIdNormalizado,
        );

      if (!existente) {
        throw new BookingError(
          'No se encontró un turno asociado al evento de Google Calendar.',
          404,
        );
      }

      let nuevoEstado: TurnoRow['estado'] | null = null;

      switch (responseStatusNormalizado) {
        case 'accepted':
          nuevoEstado = 'CONFIRMADO';
          break;

        case 'declined':
          nuevoEstado = 'CANCELADO';
          break;

        case 'tentative':
        case 'needsAction':
          // No modificamos el estado actual.
          return existente;

        default:
          throw new BookingError(
            `Estado de respuesta de Google Calendar no reconocido: ${responseStatusNormalizado}.`,
          );
      }

      const actualizado =
        await turnoRepository.updateEstadoByCalendarEventId(
          eventIdNormalizado,
          nuevoEstado,
        );

      if (!actualizado) {
        throw new BookingError(
          'No fue posible actualizar el turno desde Google Calendar.',
          500,
        );
      }

      return actualizado;
    },
  async updateEstado(
    id: number,
    estado: TurnoRow['estado'],
  ): Promise<TurnoRow> {
    const existente =
      await turnoRepository.findDetailById(id);

    if (!existente) {
      throw new BookingError(
        'Turno no encontrado.',
        404,
      );
    }

    const actualizado =
      await turnoRepository.updateEstado(
        id,
        estado,
      );

    if (!actualizado) {
      throw new BookingError(
        'Error al actualizar el turno.',
        500,
      );
    }

    return actualizado;
  },
};