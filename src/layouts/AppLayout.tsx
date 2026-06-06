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

  const isRoutingAdmin = location.pathname === '/admin' || location.pathname === '/users';

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
          </div>
        </nav>

        {/* ---- Main Content ---- */}
        <main
          id="main-content"
          className={`grid grid-cols-1 ${
            isRoutingAdmin ? 'lg:grid-cols-12' : 'max-w-4xl mx-auto'
          } gap-6 items-start w-full`}
        >
          {/* Primary panel */}
          <div
            className={isRoutingAdmin ? 'lg:col-span-7 w-full' : 'w-full'}
            role="tabpanel"
          >
            <Outlet />
          </div>

          {/* OJS sidebar — only in admin view */}
          {isRoutingAdmin && (
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
