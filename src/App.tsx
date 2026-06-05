import { Suspense, lazy, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CongressProvider } from './context/CongressContext';
import { SpeakerProvider } from './context/SpeakerContext';
import { OjsProvider } from './context/OjsContext';
import { Header } from './components/layout/Header';
import { OjsConfigCard } from './components/ojs/OjsConfigCard';
import { ConsoleLogs } from './components/layout/ConsoleLogs';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { AuthPage } from './features/auth/AuthPage';

// Lazy load portal pages
const AdminPage = lazy(() =>
  import('./features/admin/AdminPage').then((module) => ({ default: module.AdminPage }))
);
const SpeakerPage = lazy(() =>
  import('./features/speaker/SpeakerPage').then((module) => ({ default: module.SpeakerPage }))
);
const MySubmissions = lazy(() =>
  import('./features/speaker/MySubmissions').then((module) => ({ default: module.MySubmissions }))
);

function DashboardContent() {
  const { user, isLoading } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Usaremos un estado derivado para el tab activo. 
  // Por defecto, admin/org van a 'admin', speaker va a 'speaker_new'
  const [activeTab, setActiveTab] = useState<'admin' | 'speaker_new' | 'speaker_history'>('admin');

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando sesión...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (showDashboard) {
    return <DashboardPage onClose={() => setShowDashboard(false)} />;
  }

  const isAdminOrOrg = user.rol === 'admin' || user.rol === 'organizer';
  
  // Si es speaker y estaba en 'admin' por defecto, forzar la vista a 'speaker_new' o 'speaker_history'
  const currentView = isAdminOrOrg ? activeTab : (activeTab === 'speaker_history' ? 'speaker_history' : 'speaker_new');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Cabecera */}
      <Header onOpenDashboard={() => setShowDashboard(true)} />

      {/* Menú de Pestañas (Tabs) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {isAdminOrOrg && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              currentView === 'admin' 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Gestión de Congresos
          </button>
        )}
        <button
          onClick={() => setActiveTab('speaker_new')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            currentView === 'speaker_new' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Nuevo Envío
        </button>
        <button
          onClick={() => setActiveTab('speaker_history')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            currentView === 'speaker_history' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Mis Envíos
        </button>
      </div>

      {/* Contenido Principal */}
      <div className={`grid grid-cols-1 ${currentView === 'admin' ? 'lg:grid-cols-12' : 'max-w-4xl mx-auto'} gap-6 items-start mt-2 w-full`}>
        
        {/* LADO IZQUIERDO o CENTRADO */}
        <div className={currentView === 'admin' ? 'lg:col-span-7 w-full' : 'w-full'}>
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
            {currentView === 'admin' && <AdminPage />}
            {currentView === 'speaker_new' && <SpeakerPage />}
            {currentView === 'speaker_history' && <MySubmissions />}
          </Suspense>
        </div>

        {/* LADO DERECHO: Configuración e Integración con OJS solo en admin */}
        {currentView === 'admin' && (
          <div className="lg:col-span-5 w-full flex flex-col gap-6">
            <OjsConfigCard />
            <ConsoleLogs />
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CongressProvider>
        <SpeakerProvider>
          <OjsProvider>
            <DashboardContent />
          </OjsProvider>
        </SpeakerProvider>
      </CongressProvider>
    </AuthProvider>
  );
}

export default App;
