// Central app configuration — change the system name here.
export const APP_CONFIG = {
  name: 'AgendaPro',
  tagline: 'Gestión de turnos para profesionales y negocios',
  // Slot interval (minutes) used to generate available times
  slotIntervalMinutes: 30,
  // Organization shown by default in the public booking page
  defaultOrganizacionId: 1,
} as const;

export type AppConfig = typeof APP_CONFIG;
