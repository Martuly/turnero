import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
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
import { obtenerOrganizacionPublica } from '../controllers/organizacionController.js';



const router = Router();

// --- Auth (public) ---
router.post('/auth/login', authController.login);

// --- Reserva pública: no requiere autenticación ---
router.get(
  '/public/servicios',
  servicioController.publicList,
);

router.get(
  '/public/servicios/activos',
  servicioController.publicListActive,
);

router.get(
  '/public/servicios/:id',
  servicioController.publicGet,
);


router.get(
  '/disponibilidad/horarios',
  turnoController.horariosDisponibles,
);

router.post('/turnos', turnoController.create);

// Gestión pública del turno mediante token
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
router.patch(
  '/turnos/:id/calendar-event',
  turnoController.guardarCalendarEventId,
);

router.get(
  '/organizaciones/:id',
  organizacionController.get,
);

router.patch(
  '/turnos/calendar/:calendarEventId/respuesta',
  turnoController.sincronizarRespuestaCalendar,
);

// --- Profesionales públicos ---
router.get(
  '/public/profesionales',
  profesionalController.publicList,
);

router.get(
  '/public/profesionales/activos',
  profesionalController.publicListActive,
);

router.get(
  '/public/profesionales/:id/servicios',
  profesionalController.publicGetServicios,
);

router.get(
  '/public/profesionales/:id',
  profesionalController.publicGet,
);


router.get(
  '/public/organizaciones/:slug',
  obtenerOrganizacionPublica,
);

 
router.get(
  '/public/organizaciones/:slug/servicios',
  servicioController.publicListActiveBySlug,
);

router.get(
  '/turnos/recordatorios-whatsapp',
  turnoController.recordatoriosWhatsapp,
);

router.patch(
  '/turnos/:id/recordatorio-whatsapp',
  turnoController.marcarRecordatorioWhatsapp,
);
// --- Admin routes (auth required) ---
router.use(authMiddleware);
router.get('/turnos', turnoController.list);

router.get(
  '/turnos/pendiente-whatsapp',
  turnoController.pendienteWhatsapp,
);

router.get('/turnos/:id', turnoController.get);

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

router.get('/servicios', servicioController.list);
router.get('/servicios/activos', servicioController.listActive);
router.get('/servicios/:id', servicioController.get);
router.post('/servicios', servicioController.create);
router.put('/servicios/:id', servicioController.update);
router.delete('/servicios/:id', servicioController.remove);


router.post('/profesionales', profesionalController.create);
router.put('/profesionales/:id', profesionalController.update);
router.delete('/profesionales/:id', profesionalController.remove);
router.put(
  '/profesionales/:id/servicios',
  profesionalController.updateServicios,
);

router.get('/disponibilidad', disponibilidadController.list);
router.put('/disponibilidad', disponibilidadController.replace);

router.get('/bloqueos', bloqueoController.list);
router.post('/bloqueos', bloqueoController.create);
router.delete('/bloqueos/:id', bloqueoController.remove);

router.get('/turnos', turnoController.list);
router.get('/turnos/:id', turnoController.get);
router.patch(
  '/turnos/:id/estado',
  turnoController.updateEstado,
);

router.get('/clientes', clienteController.list);
router.get(
  '/dashboard/resumen',
  dashboardController.resumen,
);



export default router;