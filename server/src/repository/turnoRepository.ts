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

export const turnoRepository = {
  async findWithFilters(filters: {
    fechaDesde?: string;
    fechaHasta?: string;
    idProfesional?: number;
    idServicio?: number;
    estado?: EstadoTurno;
  }): Promise<TurnoDetalleRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    let i = 1;

    if (filters.fechaDesde) {
      conditions.push(`t.fecha >= $${i++}`);
      params.push(filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      conditions.push(`t.fecha <= $${i++}`);
      params.push(filters.fechaHasta);
    }

    if (filters.idProfesional != null) {
      conditions.push(`t.id_profesional = $${i++}`);
      params.push(filters.idProfesional);
    }

    if (filters.idServicio != null) {
      conditions.push(`t.id_servicio = $${i++}`);
      params.push(filters.idServicio);
    }

    if (filters.estado) {
      conditions.push(`t.estado = $${i++}`);
      params.push(filters.estado);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

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

       JOIN profesional p
         ON p.id_profesional = t.id_profesional

       JOIN servicio s
         ON s.id_servicio = t.id_servicio

       ${where}

       ORDER BY
         t.fecha,
         t.hora_inicio`,
      params,
    );
  },

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
              WHEN $2::varchar = 'CONFIRMADO' THEN NOW()
              ELSE fecha_confirmacion
            END,
          fecha_cancelacion =
            CASE
              WHEN $2::varchar = 'CANCELADO' THEN NOW()
              ELSE fecha_cancelacion
            END,
          updated_at = NOW()
        WHERE calendar_event_id = $1
        RETURNING *`,
        [calendarEventId, estado],
      );
    },

  async findDetailById(
    id: number,
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

       JOIN profesional p
         ON p.id_profesional = t.id_profesional

       JOIN servicio s
         ON s.id_servicio = t.id_servicio

       WHERE t.id_turno = $1`,
      [id],
    );
  },

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

       JOIN profesional p
         ON p.id_profesional = t.id_profesional

       JOIN servicio s
         ON s.id_servicio = t.id_servicio

       WHERE t.token_gestion = $1`,
      [token],
    );
  },

  async findActiveByProfesionalAndDate(
    idProfesional: number,
    fecha: string,
  ): Promise<TurnoRow[]> {
    return query<TurnoRow>(
      `SELECT *
       FROM turno

       WHERE id_profesional = $1
         AND fecha = $2
         AND estado != 'CANCELADO'

       ORDER BY hora_inicio`,
      [idProfesional, fecha],
    );
  },

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
     JOIN profesional p
       ON p.id_profesional = t.id_profesional
     JOIN servicio s
       ON s.id_servicio = t.id_servicio
     WHERE t.estado IN ('PENDIENTE', 'CONFIRMADO')
       AND t.recordatorio_whatsapp_enviado = false
       AND c.telefono IS NOT NULL
       AND (t.fecha + t.hora_inicio)
           BETWEEN
             (NOW() + ($1 * INTERVAL '1 hour') - INTERVAL '30 minutes')
             AND
             (NOW() + ($1 * INTERVAL '1 hour') + INTERVAL '30 minutes')
     ORDER BY t.fecha, t.hora_inicio`,
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

  async hasConflict(
    client: PoolClient,
    idProfesional: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeTurnoId?: number,
  ): Promise<boolean> {
    const rows = await client.query(
      `SELECT 1

       FROM turno

       WHERE id_profesional = $1
         AND fecha = $2
         AND estado != 'CANCELADO'
         AND hora_inicio < $4
         AND hora_fin > $3

         ${
           excludeTurnoId
             ? 'AND id_turno != $5'
             : ''
         }

       LIMIT 1`,
      excludeTurnoId
        ? [
            idProfesional,
            fecha,
            horaInicio,
            horaFin,
            excludeTurnoId,
          ]
        : [
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

  async findPendienteWhatsappPorTelefono(
  telefono: string,
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
        s.nombre AS servicio_nombre
     FROM turno t
     JOIN cliente c
       ON c.id_cliente = t.id_cliente
     JOIN profesional p
       ON p.id_profesional = t.id_profesional
     JOIN servicio s
       ON s.id_servicio = t.id_servicio
     WHERE c.telefono = $1
       AND t.estado IN ('PENDIENTE', 'CONFIRMADO')
       AND (t.fecha + t.hora_inicio) >= NOW()
     ORDER BY t.fecha, t.hora_inicio
     LIMIT 1`,
    [telefono],
  );
},
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
    const row = await queryOne<TurnoRow>(
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
    const result = await client.query(
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

    return result.rows[0] as TurnoRow;
  },

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
      [token, motivo],
    );
  },

  async updateCalendarEventId(
    idTurno: number,
    calendarEventId: string,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno

       SET
         calendar_event_id = $1,
         updated_at = NOW()

       WHERE id_turno = $2

       RETURNING *`,
      [
        calendarEventId,
        idTurno,
      ],
    );
  },

  async updateEstado(
    id: number,
    estado: EstadoTurno,
  ): Promise<TurnoRow | null> {
    return queryOne<TurnoRow>(
      `UPDATE turno

       SET
         estado = $1,
         updated_at = NOW()

       WHERE id_turno = $2

       RETURNING *`,
      [estado, id],
    );
  },

  async countToday(): Promise<number> {
    const row = await queryOne<{
      count: string;
    }>(
      `SELECT
         COUNT(*)::text AS count

       FROM turno

       WHERE fecha = CURRENT_DATE
         AND estado != 'CANCELADO'`,
    );

    return Number(
      row?.count ?? 0,
    );
  },

  async countThisWeek(): Promise<number> {
    const row = await queryOne<{
      count: string;
    }>(
      `SELECT
         COUNT(*)::text AS count

       FROM turno

       WHERE fecha >=
         date_trunc(
           'week',
           CURRENT_DATE
         )

         AND fecha <
         date_trunc(
           'week',
           CURRENT_DATE
         ) + interval '7 days'

         AND estado != 'CANCELADO'`,
    );

    return Number(
      row?.count ?? 0,
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
      const result = await client.query(
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
          AND estado IN ('PENDIENTE', 'CONFIRMADO')
        RETURNING *`,
        [
          token,
          data.fecha,
          data.hora_inicio,
          data.hora_fin,
        ],
      );

      return (result.rows[0] as TurnoRow | undefined) ?? null;
    },

  async countByEstado(
    estado: EstadoTurno,
  ): Promise<number> {
    const row = await queryOne<{
      count: string;
    }>(
      `SELECT
         COUNT(*)::text AS count

       FROM turno

       WHERE estado = $1`,
      [estado],
    );

    return Number(
      row?.count ?? 0,
    );
  },

  async countClientes(): Promise<number> {
    const row = await queryOne<{
      count: string;
    }>(
      `SELECT
         COUNT(*)::text AS count
       FROM cliente`,
    );

    return Number(
      row?.count ?? 0,
    );
  },
};
