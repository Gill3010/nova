import React, { useMemo } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { OjsConfigCard } from '../components/ojs/OjsConfigCard';
import { ConsoleLogs } from '../components/layout/ConsoleLogs';

export const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminOrOrg = useMemo(
    () => user?.rol === 'admin' || user?.rol === 'organizer',
    [user?.rol]
  );
  
  const isAdmin = user?.rol === 'admin';
  const isNotAttendee = user?.rol !== 'attendee';

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const path = location.pathname;

    // Protect admin, spaces, and agenda management (admin or organizer)
    if (path.startsWith('/admin') || path.startsWith('/espacios') || path.startsWith('/agenda')) {
      return user.rol === 'admin' || user.rol === 'organizer';
    }

    // Protect user administration (admin only)
    if (path.startsWith('/users')) {
      return user.rol === 'admin';
    }

    // Protect speaker features (speaker, admin, or organizer)
    if (path.startsWith('/speaker')) {
      return user.rol === 'speaker' || user.rol === 'admin' || user.rol === 'organizer';
    }

    return true;
  }, [location.pathname, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500" role="status">
        <span className="visually-hidden">Cargando sesión...</span>
        <span aria-hidden="true">Cargando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }


  const handleOpenDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {/* ---- Skip Navigation (Accesibilidad WCAG 2.4.1) ---- */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white dark:focus:bg-zinc-900 focus:px-4 focus:py-2 focus:rounded-lg focus:text-zinc-900 dark:focus:text-white focus:border focus:border-zinc-300 focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Ir al contenido principal
      </a>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5 w-full animate-fade-in">
        {/* ---- Header ---- */}
        <Header onOpenDashboard={handleOpenDashboard} />

        {/* ---- Navigation Tabs ---- */}
        <nav
          aria-label="Navegación principal"
          className="border-b border-zinc-200 dark:border-zinc-800"
        >
          <div
            role="tablist"
            aria-label="Secciones del portal"
            className="flex overflow-x-auto -mb-px"
          >
            {isAdminOrOrg && (
              <NavLink
                to="/admin"
                role="tab"
                id="tab-admin"
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`
                }
              >
                Congresos
              </NavLink>
            )}
            {isAdminOrOrg && (
              <NavLink
                to="/espacios"
                role="tab"
                id="tab-espacios"
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`
                }
              >
                Espacios
              </NavLink>
            )}
            {isAdminOrOrg && (
              <NavLink
                to="/agenda"
                role="tab"
                id="tab-agenda"
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`
                }
              >
                Agenda
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/users"
                role="tab"
                id="tab-users"
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`
                }
              >
                Usuarios
              </NavLink>
            )}
            {isNotAttendee && (
              <NavLink
                to="/speaker/new"
                role="tab"
                id="tab-speaker-new"
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`
                }
              >
                Nuevo Envío
              </NavLink>
            )}
            {isNotAttendee && (
              <NavLink
                to="/speaker/history"
                role="tab"
                id="tab-speaker-history"
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`
                }
              >
                Mis Envíos
              </NavLink>
            )}
            <NavLink
              to="/attendee"
              role="tab"
              id="tab-attendee"
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300'
                }`
              }
            >
              Ticket e Itinerario (Público)
            </NavLink>
          </div>
        </nav>

        {/* ---- Main Content ---- */}
        <main
          id="main-content"
          className={`grid grid-cols-1 ${
            location.pathname === '/admin' ? 'lg:grid-cols-12' : 'max-w-7xl mx-auto'
          } gap-6 items-start w-full`}
        >
          {/* Primary panel */}
          <div
            className={`${
              location.pathname === '/admin' ? 'lg:col-span-7' : 'w-full'
            } flex flex-col gap-6 w-full`}
            role="tabpanel"
          >
            <Outlet />
          </div>

          {/* OJS sidebar — only in admin view */}
          {location.pathname === '/admin' && (
            <aside
              className="lg:col-span-5 w-full flex flex-col gap-5"
              aria-label="Integración con OJS y consola"
            >
              <OjsConfigCard />
              <ConsoleLogs />
            </aside>
          )}
        </main>
      </div>
    </>
  );
};
