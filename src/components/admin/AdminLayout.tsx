import { type ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, CalendarRange, ListTodo, Briefcase, Users, Clock, Ban, ExternalLink, LogOut } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { API_MODE } from '@/api/client';
import { auth } from '@/api/auth';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarRange, end: false },
  { to: '/admin/turnos', label: 'Turnos', icon: ListTodo, end: false },
  { to: '/admin/servicios', label: 'Servicios', icon: Briefcase, end: false },
  { to: '/admin/profesionales', label: 'Profesionales', icon: Users, end: false },
  { to: '/admin/disponibilidad', label: 'Disponibilidad', icon: Clock, end: false },
  { to: '/admin/bloqueos', label: 'Bloqueos', icon: Ban, end: false },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = auth.getUser();

  function handleLogout() {
    auth.clear();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <CalendarDays className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">{APP_CONFIG.name}</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <Link
            to="/reservar"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ExternalLink className="h-4.5 w-4.5" />
            Página de reserva
          </Link>
          <div className="px-3 py-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${API_MODE === 'mock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${API_MODE === 'mock' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {API_MODE === 'mock' ? 'MOCK MODE' : 'REAL API'}
            </span>
          </div>
          {user && (
            <div className="px-3 py-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                {user.nombre[0]?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 font-medium truncate">{user.nombre}</p>
                <p className="truncate">{user.rol}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="h-4.5 w-4.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">{APP_CONFIG.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/reservar" className="text-sm text-slate-500">Reservar</Link>
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors
                ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-28 md:pt-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
