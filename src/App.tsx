import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';

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

import {
  OrganizacionProvider,
} from '@/context/OrganizacionContext';


function OrganizacionInicio() {
  const { slug } = useParams();

  return (
    <Navigate
      to={`/${slug}/reservar`}
      replace
    />
  );
}


function ConOrganizacion({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizacionProvider>
      {children}
    </OrganizacionProvider>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>

       <Route
          path="/"
          element={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h1>ClickTurno</h1>
              <p>Ingresá utilizando el enlace de tu organización.</p>
            </div>
          }
        />

        {/* Entrada por organización */}
        <Route
          path="/:slug"
          element={
            <ConOrganizacion>
              <OrganizacionInicio />
            </ConOrganizacion>
          }
        />

        {/* Público */}
        <Route
          path="/:slug/reservar"
          element={
            <ConOrganizacion>
              <ReservarPage />
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/reservar/confirmacion"
          element={
            <ConOrganizacion>
              <ConfirmacionPage />
            </ConOrganizacion>
          }
        />

        {/* Login */}
        <Route
          path="/:slug/login"
          element={
            <ConOrganizacion>
              <LoginPage />
            </ConOrganizacion>
          }
        />

        {/* Admin */}
        <Route
          path="/:slug/admin"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/admin/agenda"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <AgendaPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/admin/turnos"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <TurnosPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/admin/servicios"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <ServiciosPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/admin/profesionales"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <ProfesionalesPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/admin/disponibilidad"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <DisponibilidadPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="/:slug/admin/bloqueos"
          element={
            <ConOrganizacion>
              <ProtectedRoute>
                <BloqueosPage />
              </ProtectedRoute>
            </ConOrganizacion>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;