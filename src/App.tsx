import { Suspense, lazy } from 'react';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import { CongressProvider } from './context/CongressContext';
import { SpeakerProvider } from './context/SpeakerContext';
import { OjsProvider } from './context/OjsContext';
import { Header } from './components/layout/Header';
import { RoleSwitcher } from './components/layout/RoleSwitcher';
import { OjsConfigCard } from './components/ojs/OjsConfigCard';
import { ConsoleLogs } from './components/layout/ConsoleLogs';

// Lazy load portal pages
const AdminPage = lazy(() =>
  import('./features/admin/AdminPage').then((module) => ({ default: module.AdminPage }))
);
const SpeakerPage = lazy(() =>
  import('./features/speaker/SpeakerPage').then((module) => ({ default: module.SpeakerPage }))
);
const AttendeePage = lazy(() =>
  import('./features/attendee/AttendeePage').then((module) => ({ default: module.AttendeePage }))
);
const ReviewerPage = lazy(() =>
  import('./features/reviewer/ReviewerPage').then((module) => ({ default: module.ReviewerPage }))
);

function DashboardContent() {
  const { activeRole, setActiveRole } = useUserRole();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 w-full">
      {/* Cabecera */}
      <Header />

      {/* Selector de Rol Activo */}
      <RoleSwitcher activeRole={activeRole} setActiveRole={setActiveRole} />

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LADO IZQUIERDO: Formulario por Rol */}
        <div className="lg:col-span-7 w-full">
          <Suspense
            fallback={
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl p-6 shadow-md animate-pulse flex flex-col gap-4">
                <div className="h-6 bg-slate-205 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-205 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-205 dark:bg-slate-800 rounded w-5/6"></div>
                <div className="h-32 bg-slate-205 dark:bg-slate-800 rounded w-full"></div>
              </div>
            }
          >
            {activeRole === 'admin_org' && <AdminPage />}
            {activeRole === 'ponente' && <SpeakerPage />}
            {activeRole === 'asistente' && <AttendeePage />}
            {activeRole === 'revisor_eval' && <ReviewerPage />}
          </Suspense>
        </div>

        {/* LADO DERECHO: Configuración e Integración con OJS 3.4 y logs */}
        <div className="lg:col-span-5 w-full flex flex-col gap-6">
          <OjsConfigCard />
          <ConsoleLogs />
        </div>

      </div>
    </div>
  );
}

function App() {
  return (
    <UserRoleProvider>
      <CongressProvider>
        <SpeakerProvider>
          <OjsProvider>
            <DashboardContent />
          </OjsProvider>
        </SpeakerProvider>
      </CongressProvider>
    </UserRoleProvider>
  );
}

export default App;
