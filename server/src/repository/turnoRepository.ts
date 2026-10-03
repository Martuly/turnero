import {
  query,
  queryOne,
  type PoolClient,
} from '../db/pool.js';

import type {
  EstadoTurno,
  TurnoDetalleRow,
  TurnoRow,
} from '../types.js';

type TurnoFilters = {
  fechaDesde?: string;
  fechaHasta?: string;
  idProfesional?: number;
  idServicio?: number;
  estado?: EstadoTurno;
};

export const turnoRepository = {
  // =====================================================
  // LISTADO ADMIN - SIEMPRE AISLADO POR ORGANIZACIÓN
  // =====================================================

  async findWithFilters(
    idOrganizacion: number,
    filters: TurnoFilters,
  ): Promise<TurnoDetalleRow[]> {
    const conditions: string[] = [
      't.id_organizacion = $1',
    ];

    const params: unknown[] = [
      idOrganizacion,
    ];

    let i = 2;

    if (filters.fechaDesde) {
      conditions.push(
        `t.fecha >= $${i++}`,
      );
      params.push(
        filters.fechaDesde,
      );
    }

    if (filters.fechaHasta) {
      conditions.push(
        `t.fecha <= $${i++}`,
      );
      params.push(
        filters.fechaHasta,
      );
    }

    if (
      filters.idProfesional != null
    ) {
      conditions.push(
        `t.id_profesional = $${i++}`,
      );
      params.push(
        filters.idProfesional,
      );
    }

    if (
      filters.idServicio != null
    ) {
      conditions.push(
        `t.id_servicio = $${i++}`,
      );
      params.push(
        filters.idServicio,
      );
    }

    if (filters.estado) {
      conditions.push(
        `t.estado = $${i++}`,
      );
      params.push(
        filters.estado,
      );
    }

    const where =
      `WHERE ${conditions.join(
        ' AND ',
      )}`;

    return query<TurnoDetalleRow>(
      `SELECT
         t.*,

         c.nombre AS cliente_nombre,
         c.apellido AS cliente_apellido,
         c.email AS cliente_email,
         c.telefono AS cliente_telefono,

         p.nombre AS profesional_nombre,
         p.apellido AS profesional_apellido,

         s.nombre AS servicio_nombre,
         s.duracion_minutos AS servicio_duracion_minutos,
         s.precio AS servicio_precio

       FROM turno t

       JOIN cliente c
         ON c.id_cliente = t.id_cliente
        AND c.id_organizacion = t.id_organizacion

       JOIN profesional p
         ON p.id_profesional = t.id_profesional
        AND p.id_organizacion = t.id_organizacion

       JOIN servicio s
         ON s.id_servicio = t.id_servicio
        AND s.id_organizacion = t.id_organizacion

       ${where}

       ORDER BY
         t.fecha,
         t.hora_inicio`,
      params,
    );
  },

  // =====================================================
  // DETALLE ADMIN - POR ID + ORGANIZACIÓN
  // =====================================================

  async findDetailById(
    id: number,
    idOrganizacion: number,
  ): Promise<TurnoDetalleRow | null> {
    return queryOne<TurnoDetalleRow>(
      `SELECT
         t.*,

         c.nombre AS cliente_nombre,
         c.apellido AS cliente_apellido,
         c.email AS cliente_email,
         c.telefono AS cliente_telefono,

         p.nombre AS profesional_nombre,
         p.apellido AS profesional_apellido,

         s.nombre AS servicio_nombre,
         s.duracion_minutos AS servicio_duracion_minutos,
         s.precio AS servicio_precio

       FROM turno t

       JOIN cliente c
         ON c.id_cliente = t.id_cliente
        AND c.id_organizacion = t.id_organizacion

       JOIN profesional p
         ON p.id_profesional = t.id_profesional
        AND p.id_organizacion = t.id_organizacion

       JOIN servicio s
         ON s.id_servicio = t.id_servicio
        AND s.id_organizacion = t.id_organizacion

       WHERE t.id_turno = $1
         AND t.id_organizacion = $2`,
      [
        id,
        idOrganizacion,
      ],
    );
  },

  // =====================================================
  // ACCESO PÚBLICO - TOKEN DE GESTIÓN
  // =====================================================

  async findDetailByToken(
    token: string,
  ): Promise<TurnoDetalleRow | null> {
    return queryOne<TurnoDetalleRow>(
      `SELECT
         t.*,

         c.nombre AS cliente_nombre,
         c.apellido AS cliente_apellido,
         c.email AS cliente_email,
         c.telefono AS cliente_telefono,

         p.nombre AS profesional_nombre,
         p.apellido AS profesional_apellido,

         s.nombre AS servicio_nombre,
         s.duracion_minutos AS servicio_duracion_minutos,
         s.precio AS servicio_precio

       FROM turno t

       JOIN cliente c
         ON c.id_cliente = t.id_cliente
        AND c.id_organizacion = t.id_organizacion

       JOIN profesional p
         ON p.id_profesional = t.id_profesional
        AND p.id_organizacion = t.id_organizacion

       JOIN servicio s
         ON s.id_servicio = t.id_servicio
        AND s.id_organizacion = t.id_organizacion

       WHERE t.token_gestion = $1`,
      [token],
    );
  },

  // =====================================================
  // GOOGLE CALENDAR
  // =====================================================

  async findByCalendarEventId(
    calendarEventId: string,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `SELECT *
       FROM turno
       WHERE calendar_event_id = $1`,
      [calendarEventId],
    );
  },

  async updateEstadoByCalendarEventId(
    calendarEventId: string,
    estado: EstadoTurno,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno
       SET
         estado = $2::varchar,
         fecha_confirmacion =
           CASE
             WHEN $2::varchar = 'CONFIRMADO'
               THEN NOW()
             ELSE fecha_confirmacion
           END,
         fecha_cancelacion =
           CASE
             WHEN $2::varchar = 'CANCELADO'
               THEN NOW()
             ELSE fecha_cancelacion
           END,
         updated_at = NOW()
       WHERE calendar_event_id = $1
       RETURNING *`,
      [
        calendarEventId,
        estado,
      ],
    );
  },

  async updateCalendarEventId(
    idTurno: number,
    idOrganizacion: number,
    calendarEventId: string,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno
       SET
         calendar_event_id = $1,
         updated_at = NOW()
       WHERE id_turno = $2
         AND id_organizacion = $3
       RETURNING *`,
      [
        calendarEventId,
        idTurno,
        idOrganizacion,
      ],
    );
  },

  // =====================================================
  // CONSULTAS DE DISPONIBILIDAD
  // =====================================================

  async findActiveByProfesionalAndDate(
  idOrganizacion: number,
  idProfesional: number,
  fecha: string,
): Promise<TurnoRow[]> {
  return query<TurnoRow>(
    `
      SELECT *
      FROM turno
      WHERE id_organizacion = $1
        AND id_profesional = $2
        AND fecha = $3
        AND estado != 'CANCELADO'
      ORDER BY hora_inicio
    `,
    [
      idOrganizacion,
      idProfesional,
      fecha,
    ],
  );
},

  async hasConflict(
  client: PoolClient,
  idOrganizacion: number,
  idProfesional: number,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  excludeTurnoId?: number,
): Promise<boolean> {
  const rows =
    await client.query(
      `
        SELECT 1
        FROM turno
        WHERE id_organizacion = $1
          AND id_profesional = $2
          AND fecha = $3
          AND estado != 'CANCELADO'
          AND hora_inicio < $5
          AND hora_fin > $4
          ${
            excludeTurnoId
              ? 'AND id_turno != $6'
              : ''
          }
        LIMIT 1
      `,
      excludeTurnoId
        ? [
            idOrganizacion,
            idProfesional,
            fecha,
            horaInicio,
            horaFin,
            excludeTurnoId,
          ]
        : [
            idOrganizacion,
            idProfesional,
            fecha,
            horaInicio,
            horaFin,
          ],
    );

  return (
    rows.rowCount !== null &&
    rows.rowCount > 0
  );
},

  // =====================================================
  // WHATSAPP
  // =====================================================

  async findParaRecordatorioWhatsapp(
    horasAntes = 24,
  ): Promise<TurnoDetalleRow[]> {
    return query<TurnoDetalleRow>(
      `SELECT
         t.*,

         c.nombre AS cliente_nombre,
         c.apellido AS cliente_apellido,
         c.email AS cliente_email,
         c.telefono AS cliente_telefono,

         p.nombre AS profesional_nombre,
         p.apellido AS profesional_apellido,

         s.nombre AS servicio_nombre,
         s.duracion_minutos AS servicio_duracion_minutos,
         s.precio AS servicio_precio

       FROM turno t

       JOIN cliente c
         ON c.id_cliente = t.id_cliente
        AND c.id_organizacion = t.id_organizacion

       JOIN profesional p
         ON p.id_profesional = t.id_profesional
        AND p.id_organizacion = t.id_organizacion

       JOIN servicio s
         ON s.id_servicio = t.id_servicio
        AND s.id_organizacion = t.id_organizacion

       WHERE t.estado IN (
         'PENDIENTE',
         'CONFIRMADO'
       )
         AND t.recordatorio_whatsapp_enviado = false
         AND c.telefono IS NOT NULL
         AND (t.fecha + t.hora_inicio)
           BETWEEN
             (
               NOW()
               + ($1 * INTERVAL '1 hour')
               - INTERVAL '30 minutes'
             )
           AND
             (
               NOW()
               + ($1 * INTERVAL '1 hour')
               + INTERVAL '30 minutes'
             )

       ORDER BY
         t.fecha,
         t.hora_inicio`,
      [horasAntes],
    );
  },

  async marcarRecordatorioWhatsappEnviado(
    idTurno: number,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno
       SET
         recordatorio_whatsapp_enviado = true,
         fecha_recordatorio_whatsapp = NOW(),
         updated_at = NOW()
       WHERE id_turno = $1
       RETURNING *`,
      [idTurno],
    );
  },

  async findPendienteWhatsappPorTelefono(
    telefono: string,
    idOrganizacion: number,
   ): Promise<TurnoDetalleRow | null> {
    return queryOne<TurnoDetalleRow>(
      `SELECT
         t.*,

         c.nombre AS cliente_nombre,
         c.apellido AS cliente_apellido,
         c.email AS cliente_email,
         c.telefono AS cliente_telefono,

         p.nombre AS profesional_nombre,
         p.apellido AS profesional_apellido,

         s.nombre AS servicio_nombre,
         s.duracion_minutos AS servicio_duracion_minutos,
         s.precio AS servicio_precio

       FROM turno t

       JOIN cliente c
         ON c.id_cliente = t.id_cliente
        AND c.id_organizacion = t.id_organizacion

       JOIN profesional p
         ON p.id_profesional = t.id_profesional
        AND p.id_organizacion = t.id_organizacion

       JOIN servicio s
         ON s.id_servicio = t.id_servicio
        AND s.id_organizacion = t.id_organizacion

       WHERE c.telefono = $1 AND t.id_organizacion = $2
         AND t.estado IN (
           'PENDIENTE',
           'CONFIRMADO'
         )
         AND (t.fecha + t.hora_inicio) >= NOW()

       ORDER BY
         t.fecha,
         t.hora_inicio

       LIMIT 1`,
      [telefono,
       idOrganizacion,],
    );
  },

  // =====================================================
  // CREACIÓN
  // =====================================================

  async create(data: {
    id_organizacion: number;
    id_profesional: number;
    id_servicio: number;
    id_cliente: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: EstadoTurno;
  }): Promise<TurnoRow> {
    const row =
      await queryOne<TurnoRow>(
        `INSERT INTO turno (
           id_organizacion,
           id_profesional,
           id_servicio,
           id_cliente,
           fecha,
           hora_inicio,
           hora_fin,
           estado
         )
         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8
         )
         RETURNING *`,
        [
          data.id_organizacion,
          data.id_profesional,
          data.id_servicio,
          data.id_cliente,
          data.fecha,
          data.hora_inicio,
          data.hora_fin,
          data.estado,
        ],
      );

    if (!row) {
      throw new Error(
        'Error al crear turno',
      );
    }

    return row;
  },

  async createInTransaction(
    client: PoolClient,
    data: {
      id_organizacion: number;
      id_profesional: number;
      id_servicio: number;
      id_cliente: number;
      fecha: string;
      hora_inicio: string;
      hora_fin: string;
      estado: EstadoTurno;
    },
  ): Promise<TurnoRow> {
    const result =
      await client.query<TurnoRow>(
        `INSERT INTO turno (
           id_organizacion,
           id_profesional,
           id_servicio,
           id_cliente,
           fecha,
           hora_inicio,
           hora_fin,
           estado
         )
         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8
         )
         RETURNING *`,
        [
          data.id_organizacion,
          data.id_profesional,
          data.id_servicio,
          data.id_cliente,
          data.fecha,
          data.hora_inicio,
          data.hora_fin,
          data.estado,
        ],
      );

    const row =
      result.rows[0];

    if (!row) {
      throw new Error(
        'Error al crear turno',
      );
    }

    return row;
  },

  // =====================================================
  // CONFIRMAR / CANCELAR / REPROGRAMAR POR TOKEN
  // =====================================================

  async confirmarByToken(
    token: string,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno
       SET
         estado = 'CONFIRMADO',
         fecha_confirmacion = NOW(),
         fecha_cancelacion = NULL,
         motivo_cancelacion = NULL,
         updated_at = NOW()
       WHERE token_gestion = $1
         AND estado = 'PENDIENTE'
       RETURNING *`,
      [token],
    );
  },

  async cancelarByToken(
    token: string,
    motivo: string | null,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno
       SET
         estado = 'CANCELADO',
         fecha_cancelacion = NOW(),
         motivo_cancelacion = $2,
         updated_at = NOW()
       WHERE token_gestion = $1
         AND estado IN (
           'PENDIENTE',
           'CONFIRMADO'
         )
       RETURNING *`,
      [
        token,
        motivo,
      ],
    );
  },

  async reprogramarByToken(
    client: PoolClient,
    token: string,
    data: {
      fecha: string;
      hora_inicio: string;
      hora_fin: string;
    },
  ): Promise<TurnoRow | null> {
    const result =
      await client.query<TurnoRow>(
        `UPDATE turno
         SET
           fecha = $2,
           hora_inicio = $3,
           hora_fin = $4,
           estado = 'PENDIENTE',
           fecha_confirmacion = NULL,
           fecha_cancelacion = NULL,
           motivo_cancelacion = NULL,
           updated_at = NOW()
         WHERE token_gestion = $1
           AND estado IN (
             'PENDIENTE',
             'CONFIRMADO'
           )
         RETURNING *`,
        [
          token,
          data.fecha,
          data.hora_inicio,
          data.hora_fin,
        ],
      );

    return (
      result.rows[0] ??
      null
    );
  },

  // =====================================================
  // ACTUALIZACIÓN ADMIN - SIEMPRE POR ORGANIZACIÓN
  // =====================================================

  async updateEstado(
    id: number,
    idOrganizacion: number,
    estado: EstadoTurno,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno
       SET
         estado = $1,
         updated_at = NOW()
       WHERE id_turno = $2
         AND id_organizacion = $3
       RETURNING *`,
      [
        estado,
        id,
        idOrganizacion,
      ],
    );
  },


};
