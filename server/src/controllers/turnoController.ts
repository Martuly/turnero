import type {
  Request,
  Response,
} from 'express';

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


function parseId(
  value: string | undefined,
): number {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new HttpError(
      'Identificador inválido.',
      400,
    );
  }

  return id;
}


function parseToken(
  value: string | undefined,
): string {
  const token =
    value?.trim();

  if (!token) {
    throw new HttpError(
      'El token del turno es obligatorio.',
      400,
    );
  }

  return token;
}


function convertirBookingError(
  error: unknown,
): never {
  if (
    error instanceof BookingError
  ) {
    throw new HttpError(
      error.message,
      error.status,
    );
  }

  throw error;
}


export const turnoController = {
  // =====================================================
  // ADMIN - LISTADO
  // =====================================================

  list: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      if (!req.tenant) {
        throw new HttpError(
          'No se pudo identificar la organización.',
          400,
        );
      }

      const {
        fechaDesde,
        fechaHasta,
        idProfesional,
        idServicio,
        estado,
      } = req.query;

      const items =
        await turnoService.list(
          req.tenant.idOrganizacion,
          {
            fechaDesde:
              fechaDesde as
                | string
                | undefined,

            fechaHasta:
              fechaHasta as
                | string
                | undefined,

            idProfesional:
              idProfesional
                ? Number(
                    idProfesional,
                  )
                : undefined,

            idServicio:
              idServicio
                ? Number(
                    idServicio,
                  )
                : undefined,

            estado:
              estado as
                | string
                | undefined,
          },
        );

      res.json(items);
    },
  ),


  // =====================================================
  // ADMIN - DETALLE
  // =====================================================

  get: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        if (!req.tenant) {
          throw new HttpError(
            'No se pudo identificar la organización.',
            400,
          );
        }

        const id =
          parseId(
            req.params.id,
          );

        const item =
          await turnoService.getById(
            id,
            req.tenant
              .idOrganizacion,
          );

        res.json(item);
      } catch (error) {
        convertirBookingError(
          error,
        );
      }
    },
  ),


  // =====================================================
  // CREAR TURNO
  // =====================================================

  create: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        if (!req.tenant) {
          throw new HttpError(
            'No se pudo identificar la organización.',
            400,
          );
        }

        const item =
          await turnoService.crearTurno(
            req.tenant
              .idOrganizacion,
            req.body,
          );

        res
          .status(201)
          .json({
            mensaje:
              'Turno creado correctamente.',
            turno: item,
          });
      } catch (error) {
        convertirBookingError(
          error,
        );
      }
    },
  ),


  // =====================================================
  // GESTION PUBLICA POR TOKEN
  // =====================================================

  confirmar: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const token =
          parseToken(
            req.params.token,
          );

        const item =
          await turnoService
            .confirmarTurno(
              token,
            );

        res.json({
          mensaje:
            'El turno fue confirmado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(
          error,
        );
      }
    },
  ),


  reprogramar: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const token =
          parseToken(
            req.params.token,
          );

        const {
          fecha,
          hora_inicio,
        } = req.body;

        if (
          typeof fecha !==
            'string' ||
          typeof hora_inicio !==
            'string'
        ) {
          throw new HttpError(
            'fecha y hora_inicio son obligatorios.',
            400,
          );
        }

        const item =
          await turnoService
            .reprogramarTurno(
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
        convertirBookingError(
          error,
        );
      }
    },
  ),


  cancelar: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const token =
          parseToken(
            req.params.token,
          );

        const motivo =
          typeof req.body?.motivo ===
          'string'
            ? req.body.motivo
            : undefined;

        const item =
          await turnoService
            .cancelarTurno(
              token,
              motivo,
            );

        res.json({
          mensaje:
            'El turno fue cancelado correctamente.',
          turno: item,
        });
      } catch (error) {
        convertirBookingError(
          error,
        );
      }
    },
  ),


  // =====================================================
  // GOOGLE CALENDAR - ADMIN AUTENTICADO
  // =====================================================

  guardarCalendarEventId:
    asyncHandler(
      async (
        req: Request,
        res: Response,
      ) => {
        try {
          if (!req.tenant) {
            throw new HttpError(
              'No se pudo identificar la organización.',
              400,
            );
          }

          const id =
            Number(
              req.params.id,
            );

          const {
            calendar_event_id,
          } = req.body;

          if (
            !Number.isInteger(id) ||
            id <= 0
          ) {
            throw new HttpError(
              'Identificador de turno inválido.',
              400,
            );
          }

          if (
            typeof calendar_event_id !==
              'string' ||
            !calendar_event_id.trim()
          ) {
            throw new HttpError(
              'calendar_event_id es obligatorio.',
              400,
            );
          }

          const item =
            await turnoService
              .guardarCalendarEventId(
                id,
                req.tenant
                  .idOrganizacion,
                calendar_event_id
                  .trim(),
              );

          res.json({
            mensaje:
              'Identificador de Google Calendar guardado correctamente.',
            turno: item,
          });
        } catch (error) {
          convertirBookingError(
            error,
          );
        }
      },
    ),


  // =====================================================
  // GOOGLE CALENDAR - INTEGRACION N8N
  // Protegido con x-n8n-key
  // =====================================================

  guardarCalendarEventIdN8n:
    asyncHandler(
      async (
        req: Request,
        res: Response,
      ) => {
        try {
          const integrationKey =
            req.header(
              'x-n8n-key',
            );

          const expectedKey =
            process.env
              .N8N_INTEGRATION_KEY;

          if (!expectedKey) {
            console.error(
              '[n8n] N8N_INTEGRATION_KEY no está configurada.',
            );

            throw new HttpError(
              'Integración n8n no configurada.',
              500,
            );
          }

          if (
            !integrationKey ||
            integrationKey !==
              expectedKey
          ) {
            throw new HttpError(
              'Integración no autorizada.',
              401,
            );
          }

          const id =
            Number(
              req.params.id,
            );

          const {
            id_organizacion,
            calendar_event_id,
          } = req.body;

          const idOrganizacion =
            Number(
              id_organizacion,
            );

          if (
            !Number.isInteger(id) ||
            id <= 0
          ) {
            throw new HttpError(
              'Identificador de turno inválido.',
              400,
            );
          }

          if (
            !Number.isInteger(
              idOrganizacion,
            ) ||
            idOrganizacion <= 0
          ) {
            throw new HttpError(
              'id_organizacion es obligatorio y debe ser válido.',
              400,
            );
          }

          if (
            typeof calendar_event_id !==
              'string' ||
            !calendar_event_id.trim()
          ) {
            throw new HttpError(
              'calendar_event_id es obligatorio.',
              400,
            );
          }

          const item =
            await turnoService
              .guardarCalendarEventId(
                id,
                idOrganizacion,
                calendar_event_id
                  .trim(),
              );

          res.json({
            mensaje:
              'Identificador de Google Calendar guardado correctamente.',
            turno: item,
          });
        } catch (error) {
          convertirBookingError(
            error,
          );
        }
      },
    ),


  // =====================================================
  // RECORDATORIOS WHATSAPP
  // =====================================================

  recordatoriosWhatsapp:
    asyncHandler(
      async (
        _req: Request,
        res: Response,
      ) => {
        const items =
          await turnoRepository
            .findParaRecordatorioWhatsapp(
              24,
            );

        res.json(items);
      },
    ),


  marcarRecordatorioWhatsapp:
    asyncHandler(
      async (
        req: Request,
        res: Response,
      ) => {
        const id =
          Number(
            req.params.id,
          );

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          throw new HttpError(
            'El identificador del turno no es válido.',
            400,
          );
        }

        const actualizado =
          await turnoRepository
            .marcarRecordatorioWhatsappEnviado(
              id,
            );

        if (!actualizado) {
          throw new HttpError(
            'Turno no encontrado.',
            404,
          );
        }

        res.json({
          mensaje:
            'Recordatorio de WhatsApp marcado como enviado.',
          turno:
            actualizado,
        });
      },
    ),


  // =====================================================
  // RESPUESTA GOOGLE CALENDAR
  // =====================================================

  sincronizarRespuestaCalendar:
    asyncHandler(
      async (
        req: Request,
        res: Response,
      ) => {
        try {
          const calendarEventId =
            req.params
              .calendarEventId
              ?.trim();

          const {
            response_status,
          } = req.body;

          if (!calendarEventId) {
            throw new HttpError(
              'calendarEventId es obligatorio.',
              400,
            );
          }

          if (
            typeof response_status !==
              'string' ||
            !response_status.trim()
          ) {
            throw new HttpError(
              'response_status es obligatorio.',
              400,
            );
          }

          const item =
            await turnoService
              .sincronizarRespuestaCalendar(
                calendarEventId,
                response_status
                  .trim(),
              );

          res.json({
            mensaje:
              'Respuesta de Google Calendar sincronizada correctamente.',
            turno: item,
          });
        } catch (error) {
          convertirBookingError(
            error,
          );
        }
      },
    ),


  // =====================================================
  // ESTADO ADMIN
  // =====================================================

  updateEstado: asyncHandler(
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        if (!req.tenant) {
          throw new HttpError(
            'No se pudo identificar la organización.',
            400,
          );
        }

        const id =
          parseId(
            req.params.id,
          );

        const {
          estado,
        } = req.body;

        if (
          !estado ||
          !ESTADOS_TURNO.includes(
            estado as
              EstadoTurno,
          )
        ) {
          throw new HttpError(
            'Estado inválido.',
            400,
          );
        }

        const item =
          await turnoService
            .updateEstado(
              id,
              req.tenant
                .idOrganizacion,
              estado as
                EstadoTurno,
            );

        res.json(item);
      } catch (error) {
        convertirBookingError(
          error,
        );
      }
    },
  ),


  // =====================================================
  // DISPONIBILIDAD
  // =====================================================

  horariosDisponibles:
    asyncHandler(
      async (
        req: Request,
        res: Response,
      ) => {
        const {
          idServicio,
          idProfesional,
          fecha,
        } = req.query;

        if (
          !idServicio ||
          !fecha
        ) {
          throw new HttpError(
            'idServicio y fecha son obligatorios.',
            400,
          );
        }

        const servicioId =
          Number(
            idServicio,
          );

        const profesionalId =
          idProfesional
            ? Number(
                idProfesional,
              )
            : null;

        if (
          !Number.isInteger(
            servicioId,
          ) ||
          servicioId <= 0
        ) {
          throw new HttpError(
            'idServicio inválido.',
            400,
          );
        }

        if (
          profesionalId !==
            null &&
          (
            !Number.isInteger(
              profesionalId,
            ) ||
            profesionalId <= 0
          )
        ) {
          throw new HttpError(
            'idProfesional inválido.',
            400,
          );
        }

        if (!req.tenant) {
          throw new HttpError(
            'No se pudo identificar la organización.',
            400,
          );
        }

        const result =
          await getHorariosDisponibles({
            idOrganizacion:
              req.tenant
                .idOrganizacion,

            idServicio:
              servicioId,

            idProfesional:
              profesionalId,

            fecha:
              String(fecha),
          });

        res.json(result);
      },
    ),


  // =====================================================
  // WHATSAPP - PENDIENTE
  // =====================================================

  pendienteWhatsapp:
    asyncHandler(
      async (
        req: Request,
        res: Response,
      ) => {
        const telefono =
          String(
            req.query.telefono ??
              '',
          ).trim();

        const idOrganizacion =
          Number(
            req.query
              .idOrganizacion,
          );

        if (!telefono) {
          return res
            .status(400)
            .json({
              error:
                'El teléfono es obligatorio.',
            });
        }

        if (
          !Number.isInteger(
            idOrganizacion,
          ) ||
          idOrganizacion <= 0
        ) {
          return res
            .status(400)
            .json({
              error:
                'idOrganizacion es obligatorio y debe ser válido.',
            });
        }

        const turno =
          await turnoRepository
            .findPendienteWhatsappPorTelefono(
              telefono,
              idOrganizacion,
            );

        if (!turno) {
          return res
            .status(404)
            .json({
              error:
                'No se encontró un turno pendiente para ese teléfono y organización.',
            });
        }

        res.json(
          turno,
        );
      },
    ),
};