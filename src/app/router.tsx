import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AuthPage } from '../features/auth/AuthPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { useAuth } from '../context/AuthContext';
import { useCongress } from '../context/CongressContext';
import { useSpeaker } from '../context/SpeakerContext';
import { useOjs } from '../context/OjsContext';

// Lazy loaded page components
const AdminPage = lazy(() =>
  import('../features/admin/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const SpeakerPage = lazy(() =>
  import('../features/speaker/SpeakerPage').then((m) => ({ default: m.SpeakerPage }))
);
const MySubmissions = lazy(() =>
  import('../features/speaker/MySubmissions').then((m) => ({ default: m.MySubmissions }))
);
const UsersPage = lazy(() =>
  import('../features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const SpacesPage = lazy(() =>
  import('../features/spaces/SpacesPage').then((m) => ({ default: m.SpacesPage }))
);
const AgendaPage = lazy(() =>
  import('../features/agenda/AgendaAdmin').then((m) => ({ default: m.AgendaAdmin }))
);
const AttendeePage = lazy(() =>
  import('../features/attendee/AttendeePage').then((m) => ({ default: m.AttendeePage }))
);
const ReviewerPage = lazy(() =>
  import('../features/reviewer/ReviewerPage').then((m) => ({ default: m.ReviewerPage }))
);
const EditorPage = lazy(() =>
  import('../features/editor/EditorPage').then((m) => ({ default: m.EditorPage }))
);

// Fallback skeleton loader
const RouteSkeleton = () => (
  <div
    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 animate-pulse flex flex-col gap-4"
    aria-busy="true"
    aria-label="Cargando contenido"
  >
    <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6" />
    <div className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
  </div>
);

// Wrapper for DashboardPage to adapt callback functions to router navigation
const RouterDashboardWrapper = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadCongress } = useCongress();
  const { setSelectedCongressId } = useSpeaker();
  const { setOjsUrl, setOjsApiKey, setSelectedJournal } = useOjs();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleClose = () => {
    navigate(-1);
  };

  const handleEditCongress = (congress: any, action?: 'view' | 'edit') => {
    loadCongress(congress);
    
    if (action === 'view' || user?.rol === 'attendee' || user?.rol === 'reviewer' || user?.rol === 'editor') {
      navigate(user?.rol === 'editor' ? '/editor' : '/attendee');
      return;
    }
    
    if (user?.rol === 'speaker') {
      if (setSelectedCongressId) {
        setSelectedCongressId(congress.id);
      }
      navigate('/speaker/new');
      return;
    }

    // Cargar credenciales OJS: preferir portales_ojs, fallback a campos legacy del congreso
    const portalData = congress.portales_ojs?.[0];
    if (portalData) {
      if (setOjsUrl) setOjsUrl(portalData.ojs_url || '');
    } else if (setOjsUrl) {
      setOjsUrl(congress.ojs_url || '');
    }
    if (setOjsApiKey) setOjsApiKey(congress.ojs_api_key || '');
    if (setSelectedJournal && congress.ojs_journal_path) {
      setSelectedJournal({
        id: 0,
        name: congress.ojs_journal_path,
        nameObj: {},
        urlPath: congress.ojs_journal_path,
        url: congress.ojs_url || '',
        enabled: true
      });
    }
    navigate('/admin');
  };

  return (
    <main id="main-content">
      <DashboardPage onClose={handleClose} onEditCongress={handleEditCongress} />
    </main>
  );
};

// Wrapper for DashboardPage to force Directorio view
const RouterDirectorioWrapper = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadCongress } = useCongress();
  const { setSelectedCongressId } = useSpeaker();
  const { setOjsUrl, setOjsApiKey, setSelectedJournal } = useOjs();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleClose = () => {
    navigate(-1);
  };

  const handleEditCongress = (congress: any, action?: 'view' | 'edit') => {
    loadCongress(congress);
    
    if (action === 'view' || user?.rol === 'attendee' || user?.rol === 'reviewer' || user?.rol === 'editor') {
      navigate(user?.rol === 'editor' ? '/editor' : '/attendee');
      return;
    }
    
    if (user?.rol === 'speaker') {
      if (setSelectedCongressId) {
        setSelectedCongressId(congress.id);
      }
      navigate('/speaker/new');
      return;
    }

    // Cargar credenciales OJS: preferir portales_ojs, fallback a campos legacy del congreso
    const portalData = congress.portales_ojs?.[0];
    if (portalData) {
      if (setOjsUrl) setOjsUrl(portalData.ojs_url || '');
    } else if (setOjsUrl) {
      setOjsUrl(congress.ojs_url || '');
    }
    if (setOjsApiKey) setOjsApiKey(congress.ojs_api_key || '');
    if (setSelectedJournal && congress.ojs_journal_path) {
      setSelectedJournal({
        id: 0,
        name: congress.ojs_journal_path,
        nameObj: {},
        urlPath: congress.ojs_journal_path,
        url: congress.ojs_url || '',
        enabled: true
      });
    }
    navigate('/admin');
  };

  return (
    <main id="main-content">
      <DashboardPage forceDirectorio={true} onClose={handleClose} onEditCongress={handleEditCongress} />
    </main>
  );
};

// Root index redirect based on user role
const RootIndexRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500" role="status">
        <span className="visually-hidden">Cargando sesión...</span>
        <span aria-hidden="true">Cargando...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isAdminOrOrg = user.rol === 'admin' || user.rol === 'organizer';
  if (user.rol === 'attendee') {
    return <Navigate to="/attendee" replace />;
  }
  if (user.rol === 'reviewer') {
    return <Navigate to="/reviewer" replace />;
  }
  if (user.rol === 'editor') {
    return <Navigate to="/editor" replace />;
  }
  return <Navigate to={isAdminOrOrg ? '/admin' : '/speaker/new'} replace />;
};

// Wrapper for MySubmissions to adapt callback functions to router navigation
const RouterMySubmissionsWrapper = () => {
  const navigate = useNavigate();
  const { loadSubmission } = useSpeaker();

  return (
    <MySubmissions
      onEditSubmission={(submission) => {
        loadSubmission(submission);
        navigate('/speaker/new');
      }}
    />
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <AuthPage />,
      },
    ],
  },
  {
    path: '/dashboard',
    element: <RouterDashboardWrapper />,
  },
  {
    path: '/directorio',
    element: <RouterDirectorioWrapper />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <RootIndexRedirect />,
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminPage />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <UsersPage />
          </Suspense>
        ),
      },
      {
        path: 'espacios',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <SpacesPage />
          </Suspense>
        ),
      },
      {
        path: 'agenda',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AgendaPage />
          </Suspense>
        ),
      },
      {
        path: 'speaker/new',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <SpeakerPage />
          </Suspense>
        ),
      },
      {
        path: 'attendee',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AttendeePage />
          </Suspense>
        ),
      },
      {
        path: 'speaker/history',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <RouterMySubmissionsWrapper />
          </Suspense>
        ),
      },
      {
        path: 'reviewer',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ReviewerPage />
          </Suspense>
        ),
      },
      {
        path: 'editor',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <EditorPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
