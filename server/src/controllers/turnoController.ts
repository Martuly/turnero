import type { Request, Response } from 'express';

import {
  asyncHandler,
  HttpError,
} from '../middleware/errorHandler.js';

import {
  turnoService,
  BookingError,
} from '../services/turnoService.js';

import {
  turnoRepository,
} from '../repository/turnoRepository.js';

import {
  getHorariosDisponibles,
} from '../services/disponibilidadService.js';

import type {
  EstadoTurno,
} from '../types.js';

import {
  ESTADOS_TURNO,
} from '../types.js';

function parseId(value: string | undefined): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError('Identificador inválido.');
  }

  return id;
}

function parseToken(value: string | undefined): string {
  const token = value?.trim();

  if (!token) {
    throw new HttpError('El token del turno es obligatorio.');
  }

  return token;
}

function convertirBookingError(error: unknown): never {
  if (error instanceof BookingError) {
    throw new HttpError(error.message, error.status);
  }

  throw error;
}

export const turnoController = {
  list: asyncHandler(
    async (req: Request, res: Response) => {
      const {
        fechaDesde,
        fechaHasta,
        idProfesional,
        idServicio,
        estado,
      } = req.query;

      const items = await turnoService.list({
        fechaDesde:
          fechaDesde as string | undefined,

        fechaHasta:
          fechaHasta as string | undefined,

        idProfesional: idProfesional
          ? Number(idProfesional)
          : undefined,

        idServicio: idServicio
          ? Number(idServicio)
          : undefined,

        estado:
          estado as string | undefined,
      });

      res.json(items);
    },
  ),

  get: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const id = parseId(req.params.id);

        const item =
          await turnoService.getById(id);

        res.json(item);
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),

  create: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const item =
          await turnoService.crearTurno(
            req.body,
          );

        res.status(201).json({
          mensaje: 'Turno creado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),

  confirmar: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const token = parseToken(
          req.params.token,
        );

        const item =
          await turnoService.confirmarTurno(
            token,
          );

        res.json({
          mensaje:
            'El turno fue confirmado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),
  reprogramar: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const token = parseToken(
          req.params.token,
        );

        const {
          fecha,
          hora_inicio,
        } = req.body;

        if (
          typeof fecha !== 'string' ||
          typeof hora_inicio !== 'string'
        ) {
          throw new HttpError(
            'fecha y hora_inicio son obligatorios.',
          );
        }

        const item =
          await turnoService.reprogramarTurno(
            token,
            fecha,
            hora_inicio,
          );

        res.json({
          mensaje:
            'El turno fue reprogramado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),
  cancelar: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const token = parseToken(
          req.params.token,
        );

        const motivo =
          typeof req.body?.motivo === 'string'
            ? req.body.motivo
            : undefined;

        const item =
          await turnoService.cancelarTurno(
            token,
            motivo,
          );

        res.json({
          mensaje:
            'El turno fue cancelado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),
  guardarCalendarEventId: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const { calendar_event_id } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
          throw new HttpError(
            'Identificador de turno inválido.',
          );
        }

        if (
          typeof calendar_event_id !== 'string' ||
          !calendar_event_id.trim()
        ) {
          throw new HttpError(
            'calendar_event_id es obligatorio.',
          );
        }

        const item =
          await turnoService.guardarCalendarEventId(
            id,
            calendar_event_id.trim(),
          );

        res.json({
          mensaje:
            'Identificador de Google Calendar guardado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),

recordatoriosWhatsapp: asyncHandler(
  async (_req: Request, res: Response) => {
    const items =
      await turnoRepository.findParaRecordatorioWhatsapp(24);

    res.json(items);
  },
),

marcarRecordatorioWhatsapp: asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(
        'El identificador del turno no es válido.',
        400,
      );
    }

    const actualizado =
      await turnoRepository.marcarRecordatorioWhatsappEnviado(id);

    if (!actualizado) {
      throw new HttpError(
        'Turno no encontrado.',
        404,
      );
    }

    res.json({
      mensaje: 'Recordatorio de WhatsApp marcado como enviado.',
      turno: actualizado,
    });
  },
),

  sincronizarRespuestaCalendar: asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const calendarEventId =
        req.params.calendarEventId?.trim();

      const { response_status } = req.body;

      if (!calendarEventId) {
        throw new HttpError(
          'calendarEventId es obligatorio.',
        );
      }

      if (
        typeof response_status !== 'string' ||
        !response_status.trim()
      ) {
        throw new HttpError(
          'response_status es obligatorio.',
        );
      }

      const item =
        await turnoService.sincronizarRespuestaCalendar(
          calendarEventId,
          response_status.trim(),
        );

      res.json({
        mensaje:
          'Respuesta de Google Calendar sincronizada correctamente.',
        turno: item,
      });
    } catch (error) {
      convertirBookingError(error);
    }
  },
),

  updateEstado: asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const id = parseId(req.params.id);
        const { estado } = req.body;

        if (
          !estado ||
          !ESTADOS_TURNO.includes(
            estado as EstadoTurno,
          )
        ) {
          throw new HttpError(
            'Estado inválido.',
          );
        }

        const item =
          await turnoService.updateEstado(
            id,
            estado as EstadoTurno,
          );

        res.json(item);
      } catch (error) {
        convertirBookingError(error);
      }
    },
  ),

  horariosDisponibles: asyncHandler(
    async (req: Request, res: Response) => {
      const {
        idServicio,
        idProfesional,
        fecha,
      } = req.query;

      if (!idServicio || !fecha) {
        throw new HttpError(
          'idServicio y fecha son obligatorios.',
        );
      }

      const servicioId =
        Number(idServicio);

      const profesionalId =
        idProfesional
          ? Number(idProfesional)
          : null;

      if (
        !Number.isInteger(servicioId) ||
        servicioId <= 0
      ) {
        throw new HttpError(
          'idServicio inválido.',
        );
      }

      if (
        profesionalId !== null &&
        (!Number.isInteger(profesionalId) ||
          profesionalId <= 0)
      ) {
        throw new HttpError(
          'idProfesional inválido.',
        );
      }

      const result =
      await getHorariosDisponibles({
        idOrganizacion: 1,
        idServicio: servicioId,
        idProfesional: profesionalId,
        fecha: String(fecha),
      });

      res.json(result);
    },
  ),
pendienteWhatsapp: asyncHandler(
  async (req: Request, res: Response) => {
    const telefono = String(req.query.telefono ?? '').trim();

    if (!telefono) {
      return res.status(400).json({
        error: 'El teléfono es obligatorio.',
      });
    }

    const turno =
      await turnoRepository.findPendienteWhatsappPorTelefono(
        telefono,
      );

    if (!turno) {
      return res.status(404).json({
        error: 'No se encontró un turno pendiente para ese teléfono.',
      });
    }

    res.json(turno);
  },
),
};