import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReservarPage } from '@/pages/public/ReservarPage';
import { ConfirmacionPage } from '@/pages/public/ConfirmacionPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { AgendaPage } from '@/pages/admin/AgendaPage';
import { TurnosPage } from '@/pages/admin/TurnosPage';
import { ServiciosPage } from '@/pages/admin/ServiciosPage';
import { ProfesionalesPage } from '@/pages/admin/ProfesionalesPage';
import { DisponibilidadPage } from '@/pages/admin/DisponibilidadPage';
import { BloqueosPage } from '@/pages/admin/BloqueosPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no auth */}
        <Route path="/" element={<Navigate to="/reservar" replace />} />
        <Route path="/reservar" element={<ReservarPage />} />
        <Route path="/reservar/confirmacion" element={<ConfirmacionPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin — auth required */}
        <Route path="/admin" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
        <Route path="/admin/turnos" element={<ProtectedRoute><TurnosPage /></ProtectedRoute>} />
        <Route path="/admin/servicios" element={<ProtectedRoute><ServiciosPage /></ProtectedRoute>} />
        <Route path="/admin/profesionales" element={<ProtectedRoute><ProfesionalesPage /></ProtectedRoute>} />
        <Route path="/admin/disponibilidad" element={<ProtectedRoute><DisponibilidadPage /></ProtectedRoute>} />
        <Route path="/admin/bloqueos" element={<ProtectedRoute><BloqueosPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/reservar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
