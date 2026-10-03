import { Router } from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { tenantMiddleware } from '../middleware/tenantMiddleware.js';

import { authController } from '../controllers/authController.js';
import { servicioController } from '../controllers/servicioController.js';
import { profesionalController } from '../controllers/profesionalController.js';
import { disponibilidadController } from '../controllers/disponibilidadController.js';
import { bloqueoController } from '../controllers/bloqueoController.js';
import { turnoController } from '../controllers/turnoController.js';
import { dashboardController } from '../controllers/dashboardController.js';

import {
  clienteController,
  organizacionController,
} from '../controllers/miscController.js';

import {
  organizacionPublicaController,
} from '../controllers/organizacionPublicaController.js';

const router = Router();


// =====================================================
// AUTH PUBLICO
// =====================================================

router.post(
  '/auth/login',
  authController.login,
);


// =====================================================
// TEST TENANT - PUBLICO TEMPORAL
// =====================================================

router.get(
  '/public/tenant-test',
  tenantMiddleware,
  async (req, res) => {
    return res.json(req.tenant);
  },
);


// =====================================================
// ORGANIZACION PUBLICA
// =====================================================

router.get(
  '/public/organizaciones/:slug',
  organizacionPublicaController.getBySlug,
);


// =====================================================
// SERVICIOS PUBLICOS - MULTIEMPRESA POR SLUG
// =====================================================

router.get(
  '/public/organizaciones/:slug/servicios',
  servicioController.publicListActiveBySlug,
);

router.get(
  '/public/organizaciones/:slug/servicios/:id',
  servicioController.publicGetBySlug,
);


// =====================================================
// PROFESIONALES PUBLICOS - MULTIEMPRESA POR SLUG
// =====================================================

router.get(
  '/public/organizaciones/:slug/profesionales',
  profesionalController.publicListActiveBySlug,
);

router.get(
  '/public/organizaciones/:slug/profesionales/:id',
  profesionalController.publicGetBySlug,
);

router.get(
  '/public/organizaciones/:slug/profesionales/:id/servicios',
  profesionalController.publicGetServiciosBySlug,
);


// =====================================================
// RESERVA PUBLICA
// =====================================================

// El frontend debe enviar:
// x-tenant-slug: <slug-organizacion>

router.get(
  '/disponibilidad/horarios',
  tenantMiddleware,
  turnoController.horariosDisponibles,
);

router.post(
  '/turnos',
  tenantMiddleware,
  turnoController.create,
);


// =====================================================
// GESTION PUBLICA DEL TURNO MEDIANTE TOKEN
// =====================================================

router.post(
  '/turnos/confirmar/:token',
  turnoController.confirmar,
);

router.post(
  '/turnos/cancelar/:token',
  turnoController.cancelar,
);

router.post(
  '/turnos/reprogramar/:token',
  turnoController.reprogramar,
);


// =====================================================
// INTEGRACIONES EXTERNAS
// =====================================================

router.patch(
  '/turnos/calendar/:calendarEventId/respuesta',
  turnoController.sincronizarRespuestaCalendar,
);


// =====================================================
// RECORDATORIOS WHATSAPP / N8N
// =====================================================

router.get(
  '/turnos/recordatorios-whatsapp',
  turnoController.recordatoriosWhatsapp,
);

router.patch(
  '/turnos/:id/recordatorio-whatsapp',
  turnoController.marcarRecordatorioWhatsapp,
);


// =====================================================
// INTEGRACION N8N - API KEY
// IMPORTANTE: debe ir ANTES de authMiddleware
// =====================================================

router.patch(
  '/integraciones/n8n/turnos/:id/calendar-event',
  turnoController.guardarCalendarEventIdN8n,
);


// =====================================================
// DESDE ACA REQUIERE LOGIN
// =====================================================

router.use(authMiddleware);


// =====================================================
// ADMIN - TURNOS
// =====================================================

router.get(
  '/turnos',
  tenantMiddleware,
  turnoController.list,
);

router.get(
  '/turnos/pendiente-whatsapp',
  turnoController.pendienteWhatsapp,
);

router.get(
  '/turnos/:id',
  tenantMiddleware,
  turnoController.get,
);

router.patch(
  '/turnos/:id/estado',
  tenantMiddleware,
  turnoController.updateEstado,
);

router.patch(
  '/turnos/:id/calendar-event',
  tenantMiddleware,
  turnoController.guardarCalendarEventId,
);


// =====================================================
// ADMIN - PROFESIONALES
// =====================================================

router.get(
  '/profesionales',
  profesionalController.list,
);

router.get(
  '/profesionales/activos',
  profesionalController.listActive,
);

router.get(
  '/profesionales/:id/servicios',
  profesionalController.getServicios,
);

router.get(
  '/profesionales/:id',
  profesionalController.get,
);

router.post(
  '/profesionales',
  profesionalController.create,
);

router.put(
  '/profesionales/:id',
  profesionalController.update,
);

router.delete(
  '/profesionales/:id',
  profesionalController.remove,
);

router.put(
  '/profesionales/:id/servicios',
  profesionalController.updateServicios,
);


// =====================================================
// ADMIN - SERVICIOS
// =====================================================

router.get(
  '/servicios',
  servicioController.list,
);

router.get(
  '/servicios/activos',
  servicioController.listActive,
);

router.get(
  '/servicios/:id',
  servicioController.get,
);

router.post(
  '/servicios',
  servicioController.create,
);

router.put(
  '/servicios/:id',
  servicioController.update,
);

router.delete(
  '/servicios/:id',
  servicioController.remove,
);


// =====================================================
// ADMIN - DISPONIBILIDAD
// =====================================================

router.get(
  '/disponibilidad',
  tenantMiddleware,
  disponibilidadController.list,
);

router.put(
  '/disponibilidad',
  tenantMiddleware,
  disponibilidadController.replace,
);


// =====================================================
// ADMIN - BLOQUEOS
// =====================================================

router.get(
  '/bloqueos',
  bloqueoController.list,
);

router.post(
  '/bloqueos',
  bloqueoController.create,
);

router.delete(
  '/bloqueos/:id',
  bloqueoController.remove,
);


// =====================================================
// ADMIN - CLIENTES
// =====================================================

router.get(
  '/clientes',
  clienteController.list,
);


// =====================================================
// ADMIN - DASHBOARD
// =====================================================

router.get(
  '/dashboard/resumen',
  tenantMiddleware,
  dashboardController.resumen,
);

router.get(
  '/dashboard/estadisticas',
  tenantMiddleware,
  dashboardController.estadisticas,
);

// Evita warning si todavía no hay rutas activas para este controller.
void organizacionController;

export default router;