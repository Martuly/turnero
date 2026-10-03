import { withTransaction } from '../db/pool.js';

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

type AccionTurno =
  | 'NUEVO_TURNO'
  | 'CONFIRMAR_TURNO'
  | 'CANCELAR_TURNO'
  | 'REPROGRAMAR_TURNO';

export class BookingError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400,
  ) {
    super(message);
    this.name = 'BookingError';
    this.status = status;
  }
}

/**
 * Envía a n8n las novedades relacionadas con un turno.
 *
 * NUEVO_TURNO usa N8N_WEBHOOK_NUEVO_TURNO.
 * Las demás acciones usan N8N_WEBHOOK_GESTION_TURNO.
 *
 * Si n8n falla, la operación principal no se revierte.
 */
async function notificarN8n(
  accion: AccionTurno,
  turno: TurnoDetalleRow,
): Promise<void> {
  const webhookUrl =
    accion === 'NUEVO_TURNO'
      ? process.env.N8N_WEBHOOK_NUEVO_TURNO
      : process.env.N8N_WEBHOOK_GESTION_TURNO;

  console.log(
  '[n8n] accion:',
  accion,
  'url:',
  webhookUrl,
);
  if (!webhookUrl) {
    console.warn(
      `No se configuró el webhook de n8n para la acción ${accion}.`,
    );
    return;
  }

  try {
    const response = await fetch(
      webhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion,

          id_turno:
            turno.id_turno,

          id_organizacion:
            turno.id_organizacion,

          id_profesional:
            turno.id_profesional,

          id_servicio:
            turno.id_servicio,

          token_gestion:
            turno.token_gestion,

          calendar_event_id:
            turno.calendar_event_id,

          cliente: {
            nombre:
              turno.cliente_nombre,

            apellido:
              turno.cliente_apellido,

            email:
              turno.cliente_email,

            telefono:
              turno.cliente_telefono,
          },

          servicio: {
            nombre:
              turno.servicio_nombre,

            duracion_minutos:
              turno.servicio_duracion_minutos,

            precio:
              turno.servicio_precio,
          },

          profesional: {
            nombre:
              turno.profesional_nombre,

            apellido:
              turno.profesional_apellido,
          },

          fecha:
            turno.fecha,

          hora_inicio:
            turno.hora_inicio,

          hora_fin:
            turno.hora_fin,

          estado:
            turno.estado,

          fecha_confirmacion:
            turno.fecha_confirmacion,

          fecha_cancelacion:
            turno.fecha_cancelacion,

          motivo_cancelacion:
            turno.motivo_cancelacion,
        }),
      },
    );

    console.log(
  '[n8n] status:',
  response.status,
  response.statusText,
);
    if (!response.ok) {
      const responseBody =
        await response
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
  // =====================================================
  // LISTADO ADMIN - UNA SOLA DB / MULTIEMPRESA
  // =====================================================

  async list(
    idOrganizacion: number,
    filters: {
      fechaDesde?: string;
      fechaHasta?: string;
      idProfesional?: number;
      idServicio?: number;
      estado?: string;
    },
  ) {
    return turnoRepository.findWithFilters(
      idOrganizacion,
      filters as never,
    );
  },

  // =====================================================
  // DETALLE ADMIN
  // =====================================================

  async getById(
    id: number,
    idOrganizacion: number,
  ): Promise<TurnoDetalleRow> {
    const turno =
      await turnoRepository.findDetailById(
        id,
        idOrganizacion,
      );

    if (!turno) {
      throw new BookingError(
        'Turno no encontrado.',
        404,
      );
    }

    return turno;
  },

  // =====================================================
  // CREAR TURNO - UNA SOLA DB / MULTIEMPRESA
  // =====================================================

  async crearTurno(
    idOrganizacion: number,
    payload: CrearTurnoPayload,
  ): Promise<TurnoDetalleRow> {
    // -----------------------------------------------------
    // 1. Validar servicio dentro de la organización
    // -----------------------------------------------------

    const servicio =
      await servicioRepository.findById(
        payload.id_servicio,
        idOrganizacion,
      );

    if (
      !servicio ||
      !servicio.activo
    ) {
      throw new BookingError(
        'El servicio no está disponible.',
      );
    }

    // -----------------------------------------------------
    // 2. Determinar profesional
    // -----------------------------------------------------

    let profId =
      payload.id_profesional;

    if (profId != null) {
      const profesional =
        await profesionalRepository.findById(
          profId,
          idOrganizacion,
        );

      if (
        !profesional ||
        !profesional.activo
      ) {
        throw new BookingError(
          'El profesional no está disponible.',
        );
      }

      const disponibilidad =
        await getHorariosDisponibles({
          idOrganizacion,

          idServicio:
            payload.id_servicio,

          idProfesional:
            profId,

          fecha:
            payload.fecha,
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
        await profesionalRepository
          .getProfesionalesByServicio(
            payload.id_servicio,
            idOrganizacion,
          );

      for (
        const profesional
        of profesionales
      ) {
        const disponibilidad =
          await getHorariosDisponibles({
            idOrganizacion,

            idServicio:
              payload.id_servicio,

            idProfesional:
              profesional.id_profesional,

            fecha:
              payload.fecha,
          });

        if (
          disponibilidad.horarios.includes(
            payload.hora_inicio,
          )
        ) {
          profId =
            profesional.id_profesional;

          break;
        }
      }

      if (profId == null) {
        throw new BookingError(
          'No hay profesionales disponibles para ese horario.',
        );
      }
    }

    // -----------------------------------------------------
    // 3. Verificar relación profesional / servicio
    // -----------------------------------------------------

    const serviciosProfesional =
      await profesionalRepository
        .getServiciosByProfesional(
          profId,
          idOrganizacion,
        );

    const ofreceServicio =
      serviciosProfesional.some(
        (item) =>
          item.id_servicio ===
          payload.id_servicio,
      );

    if (!ofreceServicio) {
      throw new BookingError(
        'El profesional seleccionado no ofrece ese servicio.',
      );
    }

    // -----------------------------------------------------
    // 4. Calcular hora final
    // -----------------------------------------------------

    const horaFin =
      toHHMM(
        toMinutes(
          payload.hora_inicio,
        ) +
          servicio.duracion_minutos,
      );

    // -----------------------------------------------------
    // 5. Transacción en la única DB
    // -----------------------------------------------------

    let turno: TurnoRow | null = null;

    await withTransaction(
      async (client) => {
        // Evitar doble reserva.
        const existeConflicto =
        await turnoRepository.hasConflict(
          client,
          idOrganizacion,
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

        // Buscar cliente SOLO dentro de la organización.
        const clienteResult =
          await client.query(
            `
              SELECT *
              FROM cliente
              WHERE id_organizacion = $1
                AND LOWER(email) = LOWER($2)
              LIMIT 1
            `,
            [
              idOrganizacion,
              payload.cliente.email,
            ],
          );

        let cliente =
          clienteResult.rows[0];

        // Crear cliente si todavía no existe en esta organización.
        if (!cliente) {
          const nuevoClienteResult =
            await client.query(
              `
                INSERT INTO cliente (
                  id_organizacion,
                  nombre,
                  apellido,
                  email,
                  telefono
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5
                )
                RETURNING *
              `,
              [
                idOrganizacion,
                payload.cliente.nombre,
                payload.cliente.apellido,
                payload.cliente.email,
                payload.cliente.telefono
                  ?.trim() || null,
              ],
            );

          cliente =
            nuevoClienteResult.rows[0];

          if (!cliente) {
            throw new BookingError(
              'No fue posible crear el cliente.',
              500,
            );
          }
        }

        turno =
          await turnoRepository
            .createInTransaction(
              client,
              {
                id_organizacion:
                  idOrganizacion,

                id_profesional:
                  profId,

                id_servicio:
                  payload.id_servicio,

                id_cliente:
                  cliente.id_cliente,

                fecha:
                  payload.fecha,

                hora_inicio:
                  payload.hora_inicio,

                hora_fin:
                  horaFin,

                estado:
                  'PENDIENTE',
              },
            );
      },
    );

   if (!turno) {
      throw new BookingError(
        'No fue posible crear el turno.',
        500,
      );
    }

    const turnoCreado =
      turno as TurnoRow;

    const detalle =
      await turnoRepository.findDetailById(
        turnoCreado.id_turno,
        idOrganizacion,
      );

    if (!detalle) {
      throw new BookingError(
        'El turno fue creado, pero no pudo recuperarse.',
        500,
      );
    }

    // -----------------------------------------------------
    // 7. Notificar a n8n
    // -----------------------------------------------------

    await notificarN8n(
      'NUEVO_TURNO',
      detalle,
    );

    return detalle;
  },

  // =====================================================
  // CONFIRMAR - ACCESO PÚBLICO POR TOKEN
  // =====================================================

  async confirmarTurno(
    token: string,
  ): Promise<TurnoDetalleRow> {
    const tokenNormalizado =
      token.trim();

    if (!tokenNormalizado) {
      throw new BookingError(
        'El token del turno es obligatorio.',
      );
    }

    const existente =
      await turnoRepository
        .findDetailByToken(
          tokenNormalizado,
        );

    if (!existente) {
      throw new BookingError(
        'El enlace de confirmación no es válido.',
        404,
      );
    }

    if (
      existente.estado ===
      'CONFIRMADO'
    ) {
      return existente;
    }

    if (
      existente.estado ===
      'CANCELADO'
    ) {
      throw new BookingError(
        'El turno está cancelado y no puede confirmarse.',
        409,
      );
    }

    if (
      existente.estado !==
      'PENDIENTE'
    ) {
      throw new BookingError(
        `El turno no puede confirmarse porque se encuentra en estado ${existente.estado}.`,
        409,
      );
    }

    const actualizado =
      await turnoRepository
        .confirmarByToken(
          tokenNormalizado,
        );

    if (!actualizado) {
      throw new BookingError(
        'El turno cambió de estado y no pudo confirmarse.',
        409,
      );
    }

    const detalle =
      await turnoRepository
        .findDetailByToken(
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

  // =====================================================
  // CANCELAR - ACCESO PÚBLICO POR TOKEN
  // =====================================================

  async cancelarTurno(
    token: string,
    motivo?: string,
  ): Promise<TurnoDetalleRow> {
    const tokenNormalizado =
      token.trim();

    if (!tokenNormalizado) {
      throw new BookingError(
        'El token del turno es obligatorio.',
      );
    }

    const existente =
      await turnoRepository
        .findDetailByToken(
          tokenNormalizado,
        );

    if (!existente) {
      throw new BookingError(
        'El enlace de cancelación no es válido.',
        404,
      );
    }

    if (
      existente.estado ===
      'CANCELADO'
    ) {
      return existente;
    }

    if (
      existente.estado ===
        'FINALIZADO' ||
      existente.estado ===
        'AUSENTE'
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
      motivoNormalizado.length >
        255
    ) {
      throw new BookingError(
        'El motivo de cancelación no puede superar los 255 caracteres.',
      );
    }

    const actualizado =
      await turnoRepository
        .cancelarByToken(
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
      await turnoRepository
        .findDetailByToken(
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

  // =====================================================
  // REPROGRAMAR - ACCESO PÚBLICO POR TOKEN
  // =====================================================

  async reprogramarTurno(
    token: string,
    nuevaFecha: string,
    nuevaHoraInicio: string,
  ): Promise<TurnoDetalleRow> {
    const tokenNormalizado =
      token.trim();

    if (!tokenNormalizado) {
      throw new BookingError(
        'El token del turno es obligatorio.',
      );
    }

    if (
      !nuevaFecha ||
      !nuevaHoraInicio
    ) {
      throw new BookingError(
        'La nueva fecha y hora son obligatorias.',
      );
    }

    const existente =
      await turnoRepository
        .findDetailByToken(
          tokenNormalizado,
        );

    if (!existente) {
      throw new BookingError(
        'El enlace de reprogramación no es válido.',
        404,
      );
    }

    if (
      existente.estado ===
        'CANCELADO' ||
      existente.estado ===
        'FINALIZADO' ||
      existente.estado ===
        'AUSENTE'
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

    if (
      !servicio ||
      !servicio.activo
    ) {
      throw new BookingError(
        'El servicio del turno ya no está disponible.',
        409,
      );
    }

    const disponibilidad =
      await getHorariosDisponibles({
        idOrganizacion:
          existente.id_organizacion,

        idServicio:
          existente.id_servicio,

        idProfesional:
          existente.id_profesional,

        fecha:
          nuevaFecha,

        excludeTurnoId:
          existente.id_turno,
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

    const nuevaHoraFin =
      toHHMM(
        toMinutes(
          nuevaHoraInicio,
        ) +
          servicio.duracion_minutos,
      );

    await withTransaction(
      async (client) => {
        const existeConflicto =
        await turnoRepository.hasConflict(
          client,
          existente.id_organizacion,
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
          await turnoRepository
            .reprogramarByToken(
              client,
              tokenNormalizado,
              {
                fecha:
                  nuevaFecha,

                hora_inicio:
                  nuevaHoraInicio,

                hora_fin:
                  nuevaHoraFin,
              },
            );

        if (!actualizado) {
          throw new BookingError(
            'No fue posible reprogramar el turno.',
            409,
          );
        }
      },
    );

    const detalle =
      await turnoRepository
        .findDetailByToken(
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

  // =====================================================
  // GOOGLE CALENDAR
  // =====================================================

  async guardarCalendarEventId(
    idTurno: number,
    idOrganizacion: number,
    calendarEventId: string,
  ): Promise<TurnoRow> {
    const existente =
      await turnoRepository
        .findDetailById(
          idTurno,
          idOrganizacion,
        );

    if (!existente) {
      throw new BookingError(
        'Turno no encontrado.',
        404,
      );
    }

    const actualizado =
      await turnoRepository
        .updateCalendarEventId(
          idTurno,
          idOrganizacion,
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

    if (
      !responseStatusNormalizado
    ) {
      throw new BookingError(
        'response_status es obligatorio.',
      );
    }

    const existente =
      await turnoRepository
        .findByCalendarEventId(
          eventIdNormalizado,
        );

    if (!existente) {
      throw new BookingError(
        'No se encontró un turno asociado al evento de Google Calendar.',
        404,
      );
    }

    let nuevoEstado:
      TurnoRow['estado'] |
      null = null;

    switch (
      responseStatusNormalizado
    ) {
      case 'accepted':
        nuevoEstado =
          'CONFIRMADO';
        break;

      case 'declined':
        nuevoEstado =
          'CANCELADO';
        break;

      case 'tentative':
      case 'needsAction':
        return existente;

      default:
        throw new BookingError(
          `Estado de respuesta de Google Calendar no reconocido: ${responseStatusNormalizado}.`,
        );
    }

    const actualizado =
      await turnoRepository
        .updateEstadoByCalendarEventId(
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

  // =====================================================
  // ACTUALIZAR ESTADO - ADMIN
  // =====================================================

  async updateEstado(
    id: number,
    idOrganizacion: number,
    estado: TurnoRow['estado'],
  ): Promise<TurnoRow> {
    const existente =
      await turnoRepository
        .findDetailById(
          id,
          idOrganizacion,
        );

    if (!existente) {
      throw new BookingError(
        'Turno no encontrado.',
        404,
      );
    }

    const actualizado =
      await turnoRepository
        .updateEstado(
          id,
          idOrganizacion,
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
