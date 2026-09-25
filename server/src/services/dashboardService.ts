import { turnoRepository } from '../repository/turnoRepository.js';
import type { DashboardResumen } from '../types.js';

export const dashboardService = {
  async getResumen(): Promise<DashboardResumen> {
    const [turnosHoy, turnosSemana, confirmados, cancelados, totalClientes] = await Promise.all([
      turnoRepository.countToday(),
      turnoRepository.countThisWeek(),
      turnoRepository.countByEstado('CONFIRMADO'),
      turnoRepository.countByEstado('CANCELADO'),
      turnoRepository.countClientes(),
    ]);
    return {
      turnos_hoy: turnosHoy,
      turnos_semana: turnosSemana,
      turnos_confirmados: confirmados,
      turnos_cancelados: cancelados,
      total_clientes: totalClientes,
    };
  },
};
