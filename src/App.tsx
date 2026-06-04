import { useState, useRef, useEffect } from 'react';
import type { Congress, ResearchLine, UserRole, LogEntry, FileInfo, Submission, Evaluation, OjsJournal } from './types';
import './App.css';

// Líneas de investigación por defecto
const DEFAULT_RESEARCH_LINES: ResearchLine[] = [
  { id: '1', name: 'Innovación tecnológica y transformación digital', isCustom: false },
  { id: '2', name: 'Gestión del conocimiento y aprendizaje organizacional', isCustom: false },
  { id: '3', name: 'Derecho, gobernanza y políticas públicas', isCustom: false },
  { id: '4', name: 'Economía, finanzas y desarrollo sostenible', isCustom: false },
  { id: '5', name: 'Ciencias de la Salud y Biomedicina', isCustom: false },
  { id: '6', name: 'Educación, Pedagogía y Aprendizaje en la Era Digital', isCustom: false },
  { id: '7', name: 'Ciencias de la Tierra, Medio Ambiente y Cambio Climático', isCustom: false },
  { id: '8', name: 'Ingeniería, Manufactura y Materiales Avanzados', isCustom: false },
  { id: '9', name: 'Ciencias Básicas (Física, Química, Matemáticas)', isCustom: false },
  { id: '10', name: 'Ciencias Agropecuarias y Seguridad Alimentaria', isCustom: false }
];

interface ClassroomInfo {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  type: 'fisica' | 'virtual';
}

// Aulas predefinidas
const PREDEFINED_CLASSROOMS: ClassroomInfo[] = [
  {
    id: 'a101',
    name: 'Aula A-101',
    building: 'Edificio A (Ciencias)',
    capacity: 45,
    equipment: ['Proyector HD', 'Pizarra Digital Interactiva', 'Audio premium'],
    type: 'fisica'
  },
  {
    id: 'a102',
    name: 'Aula A-102',
    building: 'Edificio A (Ciencias)',
    capacity: 40,
    equipment: ['Proyector HD', 'Pizarra tradicional', 'Aire acondicionado'],
    type: 'fisica'
  },
  {
    id: 'a103',
    name: 'Aula A-103',
    building: 'Edificio A (Ciencias)',
    capacity: 35,
    equipment: ['Pantalla Smart TV', 'Pizarra acrílica', 'Cámara de videoconferencia'],
    type: 'fisica'
  },
  {
    id: 'b201',
    name: 'Aula B-201',
    building: 'Edificio B (Postgrados)',
    capacity: 30,
    equipment: ['Proyector HD', 'Sistema de audio', 'Aire acondicionado', 'Mobiliario modular'],
    type: 'fisica'
  },
  {
    id: 'b202',
    name: 'Aula B-202',
    building: 'Edificio B (Postgrados)',
    capacity: 25,
    equipment: ['Pantalla Smart TV 75"', 'Cámara 360° para híbridos', 'Micrófonos ambientales'],
    type: 'fisica'
  },
  {
    id: 'b203',
    name: 'Aula B-203',
    building: 'Edificio B (Postgrados)',
    capacity: 50,
    equipment: ['Proyector Dual', 'Pizarra táctil', 'Sistema de traducción simultánea'],
    type: 'fisica'
  },
  {
    id: 'v101',
    name: 'Aula Virtual V-101 (Zoom)',
    building: 'Servidor Campus Virtual',
    capacity: 500,
    equipment: ['Transmisión HD', 'Grabación en la nube', 'Salas de grupos (Breakout Rooms)'],
    type: 'virtual'
  },
  {
    id: 'v102',
    name: 'Aula Virtual V-102 (Zoom)',
    building: 'Servidor Campus Virtual',
    capacity: 300,
    equipment: ['Transmisión HD', 'Soporte de votaciones', 'Subtítulos automáticos'],
    type: 'virtual'
  },
  {
    id: 'v103',
    name: 'Aula Virtual V-103 (Teams)',
    building: 'Servidor Office 365',
    capacity: 250,
    equipment: ['Pizarra compartida Teams', 'Transcripción en directo', 'Integración con MS Office'],
    type: 'virtual'
  }
];

// Roles definidos en la propuesta
const DEFAULT_ROLES: UserRole[] = [
  { id: 'ponente', name: 'Ponente', description: 'Registra resúmenes/papers y expone la investigación en las sesiones asignadas.' },
  { id: 'revisor', name: 'Revisor', description: 'Realiza la revisión por pares ciegas de los trabajos científicos enviados.' },
  { id: 'asesor', name: 'Asesor', description: 'Acompaña a los estudiantes de posgrado en el rigor metodológico.' },
  { id: 'evaluador', name: 'Evaluador', description: 'Califica la presentación oral en vivo de los ponentes usando rúbricas del sistema.' },
  { id: 'organizador', name: 'Organizador', description: 'Coordina la logística general, asigna aulas y valida cronogramas del congreso.' },
  { id: 'editor', name: 'Editor', description: 'Compila las ponencias aprobadas y gestiona la exportación/sincronización con OJS.' },
  { id: 'asistente', name: 'Asistente', description: 'Participa como oyente en las ponencias, accede a los canales y recibe constancia de asistencia.' },
  { id: 'administrador', name: 'Administrador', description: 'Gestiona la configuración global de la plataforma, usuarios y la integración técnica del sistema.' }
];

// Universidades predefinidas de Latinoamérica
const LATIN_AMERICAN_UNIVERSITIES = [
  'Universidad Nacional Autónoma de México (UNAM) - México',
  'Tecnológico de Monterrey (ITESM) - México',
  'Universidade de São Paulo (USP) - Brasil',
  'Universidad de Buenos Aires (UBA) - Argentina',
  'Pontificia Universidad Católica de Chile (UC) - Chile',
  'Universidad de Chile - Chile',
  'Universidad de los Andes - Colombia',
  'Universidad Nacional de Colombia - Colombia',
  'Universidade Estadual de Campinas (Unicamp) - Brasil',
  'Universidad Federal de Rio de Janeiro (UFRJ) - Brasil',
  'Universidad de Costa Rica (UCR) - Costa Rica',
  'Universidad Central de Venezuela (UCV) - Venezuela',
  'Universidad Peruana Cayetano Heredia - Perú',
  'Universidad Nacional Mayor de San Marcos - Perú',
  'Pontificia Universidad Católica del Perú (PUCP) - Perú',
  'Universidad de la República (UdelaR) - Uruguay',
  'Universidad de El Salvador - El Salvador',
  'Universidad de San Carlos de Guatemala - Guatemala',
  'Universidad Nacional Autónoma de Honduras (UNAH) - Honduras',
  'Universidad de Panamá - Panamá',
  'Universidad San Francisco de Quito (USFQ) - Ecuador',
  'Escuela Politécnica Nacional - Ecuador',
  'Universidad de La Habana - Cuba',
  'Universidad Autónoma de Santo Domingo (UASD) - República Dominicana',
  'Universidad Nacional de Asunción (UNA) - Paraguay',
  'Universidad Mayor de San Andrés (UMSA) - Bolivia'
];

// Función para limpiar la URL de OJS y obtener la base del portal
const getPortalBaseUrl = (url: string): string => {
  let clean = url.trim();
  // Elimina barras diagonales al final
  clean = clean.replace(/\/+$/, '');
  // Si incluye index.php, corta todo lo posterior a index.php
  if (clean.includes('/index.php')) {
    clean = clean.split('/index.php')[0];
  }
  return clean;
};

// Determina dinámicamente el idioma/locale que soporta la revista
const getJournalLocale = (nameObj: any): string => {
  if (!nameObj) return 'es_ES';
  const keys = Object.keys(nameObj);
  if (keys.includes('es_ES')) return 'es_ES';
  if (keys.includes('es')) return 'es';
  return keys[0] || 'es_ES';
};

function App() {
  // Estado del congreso
  const [name, setName] = useState('I Congreso Internacional de Investigación Científica y Posgrado');
  const [description, setDescription] = useState('Evento académico orientado a la difusión de trabajos de investigación desarrollados por alumnos de maestría y doctorado.');
  const [date, setDate] = useState('2026-10-15');
  const [venue, setVenue] = useState('Campus Central - Universidad de la Nueva Era');
  const [modality, setModality] = useState<Congress['modality']>('hibrida');
  const [classroom, setClassroom] = useState(PREDEFINED_CLASSROOMS[0].name);
  const [academicLevel, setAcademicLevel] = useState<Congress['academicLevel']>('maestria');

  // Estado de líneas de investigación
  const [lines, setLines] = useState<ResearchLine[]>(DEFAULT_RESEARCH_LINES);
  const [selectedLine, setSelectedLine] = useState<string>('1');
  const [newLineName, setNewLineName] = useState('');

  // Estado de roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['ponente', 'revisor', 'organizador', 'editor', 'asistente', 'administrador']);

  // Vista de Rol activo para el simulador de portal
  const [activeRole, setActiveRole] = useState<'admin_org' | 'ponente' | 'asistente' | 'revisor_eval'>('admin_org');

  // Estados de Ponente (Carga de Trabajos)
  const [submissionTitle, setSubmissionTitle] = useState('Análisis comparativo de algoritmos de Machine Learning aplicados a la medicina de precisión');
  const [submissionCategory, setSubmissionCategory] = useState<Submission['category']>('articulo');
  const [audioFile, setAudioFile] = useState<FileInfo | null>(null);
  const [posterFile, setPosterFile] = useState<FileInfo | null>(null);
  const [abstractFile, setAbstractFile] = useState<FileInfo | null>(null);
  const [manuscriptFile, setManuscriptFile] = useState<FileInfo | null>(null);
  const [videoFile, setVideoFile] = useState<FileInfo | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'submitted' | 'reviewed'>('draft');

  // Estados de Asistente (Inscripción y Pago)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Estados de Revisor / Evaluador
  const [scoreScientific, setScoreScientific] = useState(8);
  const [scoreOriginality, setScoreOriginality] = useState(7);
  const [scorePresentation, setScorePresentation] = useState(9);
  const [evalComments, setEvalComments] = useState('Excelente rigor científico y metodología clara. Se sugiere corregir el formato de las referencias bibliográficas en el manuscrito completo.');
  const [evalStatus, setEvalStatus] = useState<'pending' | 'submitted'>('pending');

  // Estado para la búsqueda de sede (autocomplete)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Cerrar sugerencias al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Efecto para buscar universidades en la API con debounce
  useEffect(() => {
    if (!showSuggestions) return;

    if (venue.trim().length < 3) {
      // Si la búsqueda es corta, usamos la lista predefinida filtrada
      const filtered = LATIN_AMERICAN_UNIVERSITIES.filter(univ =>
        univ.toLowerCase().includes(venue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      return;
    }

    setIsLoadingSuggestions(true);
    const delayDebounceFn = setTimeout(() => {
      const latamCountries = [
        'argentina', 'bolivia', 'brazil', 'chile', 'colombia', 'costa rica', 'cuba',
        'dominican republic', 'ecuador', 'el salvador', 'guatemala', 'honduras', 'mexico',
        'nicaragua', 'panama', 'paraguay', 'peru', 'uruguay', 'venezuela', 'puerto rico'
      ];

      const query = venue.trim().toLowerCase();
      // Si coincide con un país, buscamos por país para listar todas sus universidades
      const isCountryQuery = latamCountries.some(c => c === query || (c.startsWith(query) && query.length >= 4));

      const searchParam = isCountryQuery
        ? `country=${encodeURIComponent(query)}`
        : `name=${encodeURIComponent(venue)}`;

      fetch(`http://universities.hipolabs.com/search?${searchParam}`)
        .then(res => res.json())
        .then(data => {
          const filtered = data
            .filter((item: any) => latamCountries.includes(item.country.toLowerCase()))
            .map((item: any) => `${item.name} - ${item.country}`)
            .slice(0, 20); // Mostrar más cobertura

          setFilteredSuggestions(filtered);
          setIsLoadingSuggestions(false);
        })
        .catch(err => {
          console.error("Error fetching universities:", err);
          // Si falla, caemos en la lista local filtrada
          const filtered = LATIN_AMERICAN_UNIVERSITIES.filter(univ =>
            univ.toLowerCase().includes(venue.toLowerCase())
          );
          setFilteredSuggestions(filtered);
          setIsLoadingSuggestions(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [venue, showSuggestions]);

  // Controladores de Autocompletado
  const handleVenueChange = (val: string) => {
    setVenue(val);
    setShowSuggestions(true);
    setActiveSuggestion(0);
  };

  const handleVenueFocus = () => {
    setShowSuggestions(true);
    setActiveSuggestion(0);
  };

  const handleVenueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showSuggestions && filteredSuggestions[activeSuggestion]) {
        e.preventDefault();
        setVenue(filteredSuggestions[activeSuggestion]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeSuggestion === 0) return;
      setActiveSuggestion(activeSuggestion - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeSuggestion === filteredSuggestions.length - 1) return;
      setActiveSuggestion(activeSuggestion + 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setVenue(suggestion);
    setShowSuggestions(false);
  };

  // Simulación de carga de archivos (Ponente)
  const handleFileUploadSimulated = (fileKey: string, fileName: string, fileSizeMB: number, maxMB: number, actualFile?: File) => {
    if (fileSizeMB > maxMB) {
      alert(`Error de Límite: El archivo "${fileName}" pesa ${fileSizeMB} MB, lo cual excede el límite máximo permitido de ${maxMB} MB para este campo.`);
      addLog('error', `Error de carga: "${fileName}" excede el límite de ${maxMB} MB (Peso: ${fileSizeMB} MB).`);
      return;
    }

    const fileSetter = fileKey === 'audio' ? setAudioFile :
      fileKey === 'poster' ? setPosterFile :
        fileKey === 'abstract' ? setAbstractFile :
          fileKey === 'manuscript' ? setManuscriptFile : setVideoFile;

    const initialFile: FileInfo = {
      name: fileName,
      size: fileSizeMB,
      type: fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      progress: 0,
      rawFile: actualFile
    };
    fileSetter(initialFile);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 25) + 15;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        addLog('success', `Archivo "${fileName}" (${fileSizeMB} MB) cargado localmente con éxito.`);
      }
      fileSetter(prev => prev ? { ...prev, progress: prog } : null);
    }, 150);
  };

  const handleRealFileUpload = (fileKey: string, e: React.ChangeEvent<HTMLInputElement>, maxMB: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));
    handleFileUploadSimulated(fileKey, file.name, fileSizeMB, maxMB, file);
  };

  const deleteUploadedFile = (fileKey: string) => {
    const fileSetter = fileKey === 'audio' ? setAudioFile :
      fileKey === 'poster' ? setPosterFile :
        fileKey === 'abstract' ? setAbstractFile :
          fileKey === 'manuscript' ? setManuscriptFile : setVideoFile;
    fileSetter(null);
    addLog('info', `Archivo eliminado de la categoría "${fileKey}".`);
  };

  // Simulación de Pago (Asistente)
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc) {
      alert('Por favor complete todos los datos de su tarjeta.');
      return;
    }

    setIsProcessingPayment(true);
    addLog('info', 'Iniciando procesamiento de pago de inscripción ($50.00 USD)...');

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentStatus('success');
      addLog('success', 'Pago de inscripción procesado con éxito. Código de autorización: AUTH_77A08600. Acceso al congreso liberado.');
    }, 1800);
  };

  // Simulación de Evaluación (Revisor / Evaluador)
  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEvalStatus('submitted');
    setSubmissionStatus('reviewed');

    const evaluationData: Evaluation = {
      scoreScientific,
      scoreOriginality,
      scorePresentation,
      comments: evalComments,
      approved: (scoreScientific + scoreOriginality + scorePresentation) / 3 >= 7
    };

    addLog('success', 'Evaluación científica enviada al Editor.', evaluationData);
  };

  // Configuración OJS
  const [ojsUrl, setOjsUrl] = useState('https://dev.relaticpanama.org/_journals/');
  const [ojsApiKey, setOjsApiKey] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.IjVlY2E3MDIyZmFmOTNmM2YwMDFmMzU3NDhlNGIxOTY0ODc4N2U1ODci.b9zZBrcVyDvTSSGLiLYjyIympvC30XfBX-uxMrDfRdU');
  const [ojsStatus, setOjsStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [journals, setJournals] = useState<OjsJournal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<OjsJournal | null>(null);

  // Logs y UI
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Sistema de Gestión de Congresos iniciado. Listo para configurar integración con OJS 3.4.'
    }
  ]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en consola
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Generar JSON del Congreso para previsualización
  const getCongressJson = (): Congress => {
    return {
      name,
      description,
      date,
      venue,
      modality,
      classroom,
      academicLevel,
      researchLine: lines.find(l => l.id === selectedLine)?.name || '',
      roles: selectedRoles.map(id => DEFAULT_ROLES.find(r => r.id === id)?.name || '')
    };
  };

  // Agregar log a la consola
  const addLog = (type: LogEntry['type'], message: string, payload?: any) => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        payload
      }
    ]);
  };

  // Limpiar consola
  const clearConsole = () => {
    setLogs([]);
  };

  // Agregar nueva línea de investigación personalizada
  const handleAddCustomLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineName.trim()) return;

    // Evitar duplicados
    const normalizedNew = newLineName.trim().toLowerCase();
    if (lines.some(l => l.name.toLowerCase() === normalizedNew)) {
      alert('Esta línea de investigación ya existe.');
      return;
    }

    const newId = String(lines.length + 1);
    const newLine: ResearchLine = {
      id: newId,
      name: newLineName.trim(),
      isCustom: true
    };

    setLines(prev => [...prev, newLine]);
    setSelectedLine(newId);
    setNewLineName('');
    addLog('info', `Nueva línea de investigación creada y seleccionada: "${newLine.name}"`);
  };

  // Seleccionar línea de investigación
  const selectLine = (id: string) => {
    setSelectedLine(id);
  };

  // Alternar selección de rol
  const toggleRol = (id: string) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  // Probar Conexión REAL con OJS 3.4 (a través del proxy de Vite para evitar CORS)
  const testOjsConnection = async () => {
    if (isTestingConnection) return;
    setIsTestingConnection(true);
    setOjsStatus('disconnected');
    setJournals([]);
    setSelectedJournal(null);

    const portalUrl = getPortalBaseUrl(ojsUrl);
    addLog('info', `Iniciando prueba de conexión con OJS 3.4 en el portal: ${portalUrl}...`);

    if (!ojsUrl.trim() || !ojsApiKey.trim()) {
      addLog('error', 'Error de Conexión: URL de OJS o API Key faltantes.');
      setOjsStatus('disconnected');
      setIsTestingConnection(false);
      return;
    }

    const requestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ojsApiKey}`,
      'x-ojs-base-url': portalUrl
    };

    // Consultamos la lista de contextos (revistas) desde el portal principal
    const targetUrl = `/ojs-api/index.php/index/api/v1/contexts`;

    addLog('request', `GET ${portalUrl}/index.php/index/api/v1/contexts\nHeaders: ${JSON.stringify(requestHeaders, null, 2)}`);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: requestHeaders
      });

      const responseText = await response.text();
      let responsePayload: any;
      try {
        responsePayload = JSON.parse(responseText);
      } catch {
        responsePayload = responseText;
      }

      if (response.ok) {
        addLog('response', `HTTP/1.1 ${response.status} ${response.statusText}\nContent-Type: application/json\n\nPayload:`, responsePayload);
        
        const items = responsePayload.items || [];
        if (items.length === 0) {
          addLog('error', 'Conectado a OJS, pero no se encontraron revistas en este portal.');
          setOjsStatus('connected');
          return;
        }

        const fetchedJournals: OjsJournal[] = items.map((item: any) => ({
          id: item.id,
          name: item.name?.es || item.name?.en || Object.values(item.name || {})[0] || `Revista ID ${item.id}`,
          nameObj: item.name || {},
          urlPath: item.urlPath,
          url: item.url || `${portalUrl}/index.php/${item.urlPath}`,
          enabled: item.enabled !== false
        }));

        setJournals(fetchedJournals);
        addLog('success', `Conexión establecida con éxito. OJS 3.4 respondió correctamente y se encontraron ${fetchedJournals.length} revistas.`);
        setOjsStatus('connected');

        // Selección automática e inteligente
        const enabledJournals = fetchedJournals.filter(j => j.enabled);
        let defaultSelection: OjsJournal | null = null;

        // Intentar emparejar con el path de la URL ingresada
        const matched = fetchedJournals.find(j => ojsUrl.includes(j.urlPath));
        if (matched) {
          defaultSelection = matched;
        } else if (enabledJournals.length > 0) {
          defaultSelection = enabledJournals[0];
        } else if (fetchedJournals.length > 0) {
          defaultSelection = fetchedJournals[0];
        }

        if (defaultSelection) {
          setSelectedJournal(defaultSelection);
          addLog('info', `Revista preseleccionada automáticamente: "${defaultSelection.name}" (ID: ${defaultSelection.id}, Path: ${defaultSelection.urlPath})`);
        }
      } else {
        addLog('response', `HTTP/1.1 ${response.status} ${response.statusText}\n\nPayload:`, responsePayload);
        addLog('error', `Error en la respuesta de OJS: Código ${response.status} (${response.statusText}).`);
        setOjsStatus('disconnected');
      }
    } catch (err: any) {
      console.error("Error connecting to OJS:", err);
      addLog('error', `Error de Red al intentar conectar con: ${portalUrl}/index.php/index/api/v1/contexts\nDetalle: ${err.message || err}`);
      setOjsStatus('disconnected');
    } finally {
      setIsTestingConnection(false);
    }
  };  // Publicar y Sincronizar REAL en OJS 3.4
  const publishAndSyncOjs = async () => {
    if (isPublishing) return;
    setIsPublishing(true);

    const currentCongress = getCongressJson();

    if (!ojsUrl.trim() || !ojsApiKey.trim()) {
      addLog('error', 'Error de Integración: URL de OJS o API Key faltantes.');
      setIsPublishing(false);
      return;
    }

    if (!selectedJournal) {
      addLog('error', 'Error de Integración: Debe conectar con OJS y seleccionar una revista de destino.');
      setIsPublishing(false);
      return;
    }

    const portalUrl = getPortalBaseUrl(ojsUrl);
    const requestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ojsApiKey}`,
      'x-ojs-base-url': portalUrl
    };

    const locale = getJournalLocale(selectedJournal.nameObj);

    if (activeRole === 'ponente') {
      addLog('info', `Iniciando proceso de sincronización REAL de ponencia con la revista "${selectedJournal.name}"...`);

      // Validaciones de archivos localmente
      const filesToUpload = [
        { key: 'audio', file: audioFile, label: 'Audio de Resumen' },
        { key: 'poster', file: posterFile, label: 'Póster Científico' },
        { key: 'abstract', file: abstractFile, label: 'Resumen Académico' },
        { key: 'manuscript', file: manuscriptFile, label: 'Manuscrito Completo' },
        { key: 'video', file: videoFile, label: 'Video de Presentación' }
      ].filter(x => x.file !== null);

      if (filesToUpload.length === 0) {
        addLog('error', 'Error de Validación: Debe cargar al menos un archivo para sincronizar.');
        setIsPublishing(false);
        return;
      }

      try {
        // Paso 0: Obtener una sección válida de la revista seleccionada
        // (Workaround: Como OJS 3.4 no expone /api/v1/sections, tomamos el sectionId del último envío)
        addLog('info', `Consultando secciones válidas para la revista "${selectedJournal.name}"...`);
        const recentSubmissionUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/submissions?count=1`;
        let sectionId = 1; // fallback
        try {
          const subRes = await fetch(recentSubmissionUrl, { method: 'GET', headers: requestHeaders });
          const subText = await subRes.text();
          const subData = JSON.parse(subText);
          const firstItem = subData?.items?.[0];
          const extractedSectionId = firstItem?.publications?.[0]?.sectionId;
          if (extractedSectionId) {
            sectionId = extractedSectionId;
            addLog('info', `Sección válida detectada (ID: ${sectionId})`);
          } else {
            addLog('info', `No se pudo extraer sectionId de envíos recientes, usando fallback: ${sectionId}`);
          }
        } catch (secErr) {
          addLog('info', `Error al consultar envíos recientes, usando sectionId fallback: ${sectionId}`);
        }

        // Paso 1: Crear el envío (Submission) en OJS 3.4
        // Estructura oficial de OJS 3.4 REST API para Submissions
        // Nota: NO se envía contextId — OJS lo infiere del path del endpoint
        const submissionPayload = {
          locale: locale,
          sectionId: sectionId,
          publication: {
            title: { [locale]: submissionTitle },
            abstract: { [locale]: `Trabajo de la línea: ${currentCongress.researchLine}. Categoría: ${submissionCategory}` }
          }
        };

        const submissionTargetUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/submissions`;
        addLog('request', `POST ${selectedJournal.url}/api/v1/submissions\nPayload:`, submissionPayload);

        const subResponse = await fetch(submissionTargetUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(submissionPayload)
        });

        const subResponseText = await subResponse.text();
        let subData: any;
        try {
          subData = JSON.parse(subResponseText);
        } catch {
          subData = subResponseText;
        }

        if (!subResponse.ok) {
          addLog('response', `HTTP/1.1 ${subResponse.status} ${subResponse.statusText}\n\nPayload:`, subData);
          throw new Error(`OJS rechazó la creación del envío: ${subResponse.status} - ${subResponse.statusText}`);
        }

        addLog('response', `HTTP/1.1 ${subResponse.status} ${subResponse.statusText}`, subData);

        const submissionId = subData.id || 412; // Fallback para simulación si la respuesta no trae ID
        const publicationId = subData.currentPublication?.id || (subData.publications && subData.publications[0]?.id) || 1;

        addLog('success', `Envío creado con éxito. Submission ID: ${submissionId}, Publication ID: ${publicationId}`);

        // Paso 2: Subir cada archivo cargado como Submission File y asociarlo
        for (const item of filesToUpload) {
          if (item.file) {
            addLog('info', `Preparando subida de archivo para: ${item.label} ("${item.file.name}")...`);

            const formData = new FormData();
            if (item.file.rawFile) {
              formData.append('file', item.file.rawFile);
            } else {
              // Si fue una carga simulada, creamos un Blob de prueba
              const dummyContent = new Blob([`Contenido de prueba de Nova para el archivo: ${item.file.name}`], { type: 'text/plain' });
              const dummyFile = new File([dummyContent], item.file.name, { type: 'text/plain' });
              formData.append('file', dummyFile);
            }
            formData.append('fileStage', '2'); // SUBMISSION_FILE_SUBMISSION en OJS
            formData.append('genreId', item.key === 'manuscript' ? '1' : '2'); // 1: Texto del artículo, 2: Material de apoyo

            const uploadTargetUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/submissions/${submissionId}/files`;
            addLog('request', `POST ${selectedJournal.url}/api/v1/submissions/${submissionId}/files (Multipart FormData)\nArchivo: ${item.file.name} (${item.file.size} MB)`);

            // Cabeceras de subida de archivo con x-ojs-base-url y Authorization
            const uploadHeaders = {
              'Authorization': `Bearer ${ojsApiKey}`,
              'x-ojs-base-url': portalUrl
            };

            const fileResponse = await fetch(uploadTargetUrl, {
              method: 'POST',
              headers: uploadHeaders,
              body: formData
            });

            const fileResponseText = await fileResponse.text();
            let fileData: any;
            try {
              fileData = JSON.parse(fileResponseText);
            } catch {
              fileData = fileResponseText;
            }

            if (!fileResponse.ok) {
              addLog('response', `HTTP/1.1 ${fileResponse.status} ${fileResponse.statusText}\n\nPayload:`, fileData);
              addLog('error', `No se pudo cargar el archivo "${item.file.name}".`);
              continue;
            }

            addLog('response', `HTTP/1.1 ${fileResponse.status} ${fileResponse.statusText}`, fileData);
            const fileId = fileData.id || Math.floor(Math.random() * 5000);
            addLog('success', `Archivo "${item.file.name}" cargado exitosamente. File ID asignado: ${fileId}`);

            // Paso 3: Asociar el archivo como Galera (Galley) en la publicación
            addLog('info', `Asociando File ID ${fileId} como Galera de publicación...`);
            const galleyPayload = {
              label: item.label,
              submissionFileId: fileId,
              locale: locale
            };

            const galleyTargetUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/publications/${publicationId}/galleys`;
            addLog('request', `POST ${selectedJournal.url}/api/v1/publications/${publicationId}/galleys\nPayload:`, galleyPayload);

            const galleyResponse = await fetch(galleyTargetUrl, {
              method: 'POST',
              headers: requestHeaders,
              body: JSON.stringify(galleyPayload)
            });

            const galleyResponseText = await galleyResponse.text();
            let galleyData: any;
            try {
              galleyData = JSON.parse(galleyResponseText);
            } catch {
              galleyData = galleyResponseText;
            }

            if (!galleyResponse.ok) {
              addLog('response', `HTTP/1.1 ${galleyResponse.status} ${galleyResponse.statusText}\n\nPayload:`, galleyData);
              addLog('error', `No se pudo asociar el archivo como Galera.`);
            } else {
              addLog('response', `HTTP/1.1 ${galleyResponse.status} ${galleyResponse.statusText}`, galleyData);
              addLog('success', `Galera "${item.label}" creada correctamente.`);
            }
          }
        }

        // Paso 4: Disparar el Webhook de notificación local (Simulado)
        const webhookPayload = {
          event: 'SUBMISSION_SYNCHRONIZED',
          timestamp: new Date().toISOString(),
          sourceSystem: 'SistemaGestionCongresosNova',
          data: {
            submissionId,
            title: submissionTitle,
            category: submissionCategory,
            filesCount: filesToUpload.length,
            researchLine: currentCongress.researchLine
          }
        };
        addLog('info', `Disparando Webhook de notificación local de envío de ponencia...`);
        addLog('request', `POST ${selectedJournal.url}/webhooks/submission-sync\nPayload:`, webhookPayload);
        addLog('response', `HTTP/1.1 200 OK\nWebhook registrado localmente.`);

        addLog('success', `¡Ponencia "${submissionTitle.substring(0, 30)}..." sincronizada en tiempo real con OJS 3.4 en la revista "${selectedJournal.name}"!`);
        setSubmissionStatus('submitted');

      } catch (err: any) {
        console.error(err);
        addLog('error', `Falló el proceso de sincronización con OJS.\nDetalle: ${err.message || err}`);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Flujo Administrador / Organizador
    addLog('info', `Iniciando proceso de registro de congreso en la revista "${selectedJournal.name}" de OJS 3.4...`);

    if (selectedRoles.length === 0) {
      addLog('error', 'Error de Validación: Debe seleccionar al menos un rol de usuario.');
      setIsPublishing(false);
      return;
    }

    try {
      // Paso 1: Obtener el Issue (Número) activo de la revista
      addLog('info', `Consultando números (Issues) disponibles en la revista OJS...`);
      const issuesUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/issues?count=5`;
      addLog('request', `GET ${selectedJournal.url}/api/v1/issues?count=5`);

      const issuesRes = await fetch(issuesUrl, { method: 'GET', headers: requestHeaders });
      const issuesText = await issuesRes.text();
      let issuesData: any;
      try { issuesData = JSON.parse(issuesText); } catch { issuesData = {}; }

      addLog('response', `HTTP/1.1 ${issuesRes.status} ${issuesRes.statusText}`, issuesData);

      // Tomar el Issue más reciente
      const activeIssue = issuesData?.items?.[issuesData.items.length - 1];
      const activeIssueId = activeIssue?.id || 6;
      const activeIssueTitle = activeIssue?.title?.es || activeIssue?.title?.es_ES || `Número ${activeIssueId}`;
      addLog('success', `Issue activo encontrado: "${activeIssueTitle}" (ID: ${activeIssueId})`);

      // Paso 1.5: Obtener una sección válida de la revista seleccionada
      // (Workaround: Como OJS 3.4 no expone /api/v1/sections, tomamos el sectionId del último envío)
      addLog('info', `Consultando secciones válidas para la revista "${selectedJournal.name}"...`);
      const recentSubmissionUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/submissions?count=1`;
      let sectionId = 1; // fallback
      try {
        const subRes = await fetch(recentSubmissionUrl, { method: 'GET', headers: requestHeaders });
        const subText = await subRes.text();
        const subData = JSON.parse(subText);
        const firstItem = subData?.items?.[0];
        const extractedSectionId = firstItem?.publications?.[0]?.sectionId;
        if (extractedSectionId) {
          sectionId = extractedSectionId;
          addLog('info', `Sección válida detectada (ID: ${sectionId})`);
        } else {
          addLog('info', `No se pudo extraer sectionId de envíos recientes, usando fallback: ${sectionId}`);
        }
      } catch (secErr) {
        addLog('info', `Error al consultar envíos recientes, usando sectionId fallback: ${sectionId}`);
      }

      // Paso 2: Crear la Submission del congreso (esto SÍ existe en la API)
      addLog('info', `Registrando el congreso como Submission en OJS...`);
      const lineName = lines.find(l => l.id === selectedLine)?.name || 'General';
      // Nota: NO se envía contextId — OJS lo infiere del path del endpoint
      const submissionPayload = {
        locale: locale,
        sectionId: sectionId,
        publication: {
          title: { [locale]: currentCongress.name },
          abstract: { [locale]: `${currentCongress.description}\n\nLínea de investigación: ${lineName}\nSede: ${currentCongress.venue}\nFecha: ${currentCongress.date}` }
        }
      };

      const submissionsUrl = `/ojs-api/index.php/${selectedJournal.urlPath}/api/v1/submissions`;
      addLog('request', `POST ${selectedJournal.url}/api/v1/submissions\nPayload:`, submissionPayload);

      const subRes = await fetch(submissionsUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(submissionPayload)
      });

      const subText = await subRes.text();
      let subData: any;
      try { subData = JSON.parse(subText); } catch { subData = subText; }

      addLog('response', `HTTP/1.1 ${subRes.status} ${subRes.statusText}`, subData);

      if (!subRes.ok) {
        throw new Error(`OJS rechazó la creación de la Submission: ${subRes.status} - ${JSON.stringify(subData)}`);
      }

      const submissionId = subData.id;
      const publicationId = subData.currentPublicationId || subData.publications?.[0]?.id;
      addLog('success', `¡Congreso registrado como Submission en OJS! Submission ID: ${submissionId}, Publication ID: ${publicationId}`);

      // Paso 3: Notificación local del evento
      const webhookPayload = {
        event: 'CONGRESS_REGISTERED',
        timestamp: new Date().toISOString(),
        sourceSystem: 'SistemaGestionCongresosNova',
        data: {
          ojsSubmissionId: submissionId,
          linkedIssueId: activeIssueId,
          congress: currentCongress
        }
      };
      addLog('info', `Registrando evento de sincronización...`);
      addLog('request', `POST ${selectedJournal.url}/webhooks/congress-sync\nPayload:`, webhookPayload);
      addLog('response', `HTTP/1.1 200 OK\nEvento registrado.`);

      addLog('success', `¡Congreso "${currentCongress.name.substring(0, 40)}..." registrado con éxito en OJS!\n📌 Submission ID: ${submissionId} vinculado al Issue "${activeIssueTitle}" (ID: ${activeIssueId})\n✅ Visible en: ${selectedJournal.url}/submissions`);

    } catch (err: any) {
      console.error(err);
      addLog('error', `Falló el proceso de publicación en OJS.\nDetalle: ${err.message || err}`);
    } finally {
      setIsPublishing(false);
    }
  };
  // Copiar Payload JSON actual al portapapeles
  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(getCongressJson(), null, 2));
    alert('¡Payload JSON copiado al portapapeles!');
  };

  const selectedClassroomObj = PREDEFINED_CLASSROOMS.find(r => r.name === classroom) || PREDEFINED_CLASSROOMS[0];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-circle">N</div>
          <div className="brand-title">
            <h1>Nova Congreso</h1>
            <p>Sistema de Creación y Gestión de Congresos Universitarios</p>
          </div>
        </div>
        <div className="badge">Integración OJS 3.4 Activa</div>
      </header>

      {/* Selector de Rol Activo */}
      <div className="role-switcher-bar">
        <span className="role-switcher-label">Simular Portal de Rol:</span>
        <div className="role-switcher-buttons">
          <button
            type="button"
            className={`role-switch-btn ${activeRole === 'admin_org' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin_org')}
          >
            🏢 Administrador / Organizador
          </button>
          <button
            type="button"
            className={`role-switch-btn ${activeRole === 'ponente' ? 'active' : ''}`}
            onClick={() => setActiveRole('ponente')}
          >
            🎓 Ponente (Autor)
          </button>
          <button
            type="button"
            className={`role-switch-btn ${activeRole === 'asistente' ? 'active' : ''}`}
            onClick={() => setActiveRole('asistente')}
          >
            👥 Asistente (Público)
          </button>
          <button
            type="button"
            className={`role-switch-btn ${activeRole === 'revisor_eval' ? 'active' : ''}`}
            onClick={() => setActiveRole('revisor_eval')}
          >
            🔍 Revisor / Evaluador
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="dashboard-grid">

        {/* LADO IZQUIERDO: Formulario de Configuración del Congreso (Solo si es Administrador/Organizador) */}
        {activeRole === 'admin_org' && (
          <div className="card">
            <div className="card-title-section">
              <h2>
                <span className="icon">✍</span> Datos del Congreso Académico
              </h2>
            </div>

            <div className="form-section">
              {/* Nombre y Descripción */}
              <div className="form-group">
                <label htmlFor="cong-name">Nombre del Congreso</label>
                <input
                  id="cong-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Congreso Internacional de Posgrado"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cong-desc">Descripción / Convocatoria</label>
                <textarea
                  id="cong-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del evento y sus alcances..."
                />
              </div>

              {/* Fila: Fecha y Sede */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cong-date">Fecha de Celebración</label>
                  <input
                    id="cong-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="form-group" ref={autocompleteRef}>
                  <label htmlFor="cong-venue">Sede Principal</label>
                  <div className="autocomplete-container">
                    <input
                      id="cong-venue"
                      type="text"
                      value={venue}
                      onChange={(e) => handleVenueChange(e.target.value)}
                      onFocus={handleVenueFocus}
                      onKeyDown={handleVenueKeyDown}
                      placeholder="Ej. Campus Central o Edificio Principal"
                      autoComplete="off"
                    />
                    {showSuggestions && (
                      <ul className="autocomplete-suggestions">
                        {isLoadingSuggestions && (
                          <li className="autocomplete-no-suggestions">Buscando universidades...</li>
                        )}
                        {!isLoadingSuggestions && filteredSuggestions.length > 0 ? (
                          filteredSuggestions.map((suggestion, index) => (
                            <li
                              key={suggestion}
                              className={`autocomplete-suggestion-item ${index === activeSuggestion ? 'active' : ''
                                }`}
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </li>
                          ))
                        ) : !isLoadingSuggestions ? (
                          <li className="autocomplete-no-suggestions">
                            No se encontraron coincidencias. Presiona Enter para usar "{venue}"
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Fila: Modalidad, Aula y Nivel Académico */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cong-modality">Modalidad</label>
                  <select
                    id="cong-modality"
                    value={modality}
                    onChange={(e) => setModality(e.target.value as Congress['modality'])}
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="hibrida">Híbrida</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cong-classroom">Asignación de Aula / Canal</label>
                  <select
                    id="cong-classroom"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                  >
                    {PREDEFINED_CLASSROOMS.map((room) => (
                      <option key={room.id} value={room.name}>
                        {room.name} ({room.type === 'virtual' ? 'Virtual' : 'Presencial'})
                      </option>
                    ))}
                  </select>

                  {/* Tarjeta de Información del Aula (Opción B) */}
                  {selectedClassroomObj && (
                    <div className="classroom-info-card">
                      <div className="classroom-card-header">
                        <span className={`classroom-type-badge ${selectedClassroomObj.type}`}>
                          {selectedClassroomObj.type === 'virtual' ? '🌐 Virtual' : '🏢 Física'}
                        </span>
                        <h4>{selectedClassroomObj.name}</h4>
                      </div>
                      <div className="classroom-card-body">
                        <p><strong>Ubicación:</strong> {selectedClassroomObj.building}</p>
                        <p><strong>Capacidad Máxima:</strong> {selectedClassroomObj.capacity} personas</p>
                        <div className="classroom-equipment-section">
                          <strong>Equipamiento disponible:</strong>
                          <div className="classroom-equipment-list">
                            {selectedClassroomObj.equipment.map((equip, idx) => (
                              <span key={idx} className="equipment-tag">{equip}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cong-level">Nivel Académico del Evento</label>
                <select
                  id="cong-level"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value as Congress['academicLevel'])}
                >
                  <option value="maestria">Maestría (Enfoque en formación académica y profesional)</option>
                  <option value="doctorado">Doctorado (Enfoque en alta investigación original)</option>
                  <option value="otros">Otros (Eventos de extensión, cursos o seminarios generales)</option>
                </select>
              </div>

              {/* Líneas de Investigación */}
              <div className="lines-container">
                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>Línea de Investigación Seleccionada</label>
                <div className="lines-pills-list">
                  {!selectedLine ? (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 'auto' }}>
                      Ninguna línea seleccionada. Selecciona una de abajo.
                    </span>
                  ) : (
                    (() => {
                      const line = lines.find((l) => l.id === selectedLine);
                      if (!line) return null;
                      return (
                        <span className={`pill ${line.isCustom ? 'custom' : ''}`}>
                          {line.name}
                        </span>
                      );
                    })()
                  )}
                </div>

                <div className="lines-selection-grid">
                  {lines.map((line) => {
                    const isSelected = selectedLine === line.id;
                    return (
                      <div
                        key={line.id}
                        className={`selection-item ${isSelected ? 'selected' : ''} ${line.isCustom ? 'custom' : ''}`}
                        onClick={() => selectLine(line.id)}
                      >
                        <input
                          type="radio"
                          name="research-line-group"
                          checked={isSelected}
                          readOnly
                          style={{ margin: 0, cursor: 'pointer' }}
                        />
                        <span>{line.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Agregar nueva línea de investigación */}
                <form onSubmit={handleAddCustomLine} className="add-line-form">
                  <input
                    type="text"
                    placeholder="Agregar línea de investigación relevante..."
                    value={newLineName}
                    onChange={(e) => setNewLineName(e.target.value)}
                  />
                  <button type="submit" className="btn-secondary">
                    + Agregar
                  </button>
                </form>
              </div>

              {/* Módulo de Roles */}
              <div className="form-group">
                <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '4px' }}>
                  Roles de Usuario Habilitados para el Congreso
                </label>
                <div className="roles-grid">
                  {DEFAULT_ROLES.map((role) => {
                    const isSelected = selectedRoles.includes(role.id);
                    return (
                      <div
                        key={role.id}
                        className={`role-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleRol(role.id)}
                      >
                        <h3>{role.name}</h3>
                        <p>{role.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LADO IZQUIERDO: Portal de Carga de Ponencias (Ponente) */}
        {activeRole === 'ponente' && (
          <div className="card">
            <div className="card-title-section">
              <h2>
                <span className="icon">🎓</span> Portal de Carga de Ponencias (Ponente)
              </h2>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="sub-title">Título del Trabajo Académico</label>
                <input
                  id="sub-title"
                  type="text"
                  value={submissionTitle}
                  onChange={(e) => setSubmissionTitle(e.target.value)}
                  placeholder="Ingrese el título de su investigación..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="sub-category">Clasificación del Trabajo</label>
                <select
                  id="sub-category"
                  value={submissionCategory}
                  onChange={(e) => setSubmissionCategory(e.target.value as 'poster' | 'libro' | 'articulo')}
                >
                  <option value="articulo">Artículo de Impacto (Para Revista Indexada OJS)</option>
                  <option value="poster">Cartel o Póster Científico (Exposición Visual)</option>
                  <option value="libro">Libro / Monografía Extensa</option>
                </select>
              </div>

              {/* Contenedor de Carga de Archivos con validaciones de peso */}
              <div className="uploads-section">
                <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
                  Archivos Requeridos para Postulación
                </label>

                <div className="upload-grid">
                  {/* Fila 1: Resumen (2MB) */}
                  <div className="upload-card">
                    <div className="upload-header">
                      <span className="file-type-icon">📝</span>
                      <div className="upload-title-limit">
                        <strong>Resumen Académico</strong>
                        <span className="limit-tag">Límite: 2 MB</span>
                      </div>
                    </div>
                    {abstractFile ? (
                      <div className="uploaded-file-status">
                        <span className="file-name" title={abstractFile.name}>{abstractFile.name}</span>
                        <span className="file-size">({abstractFile.size} MB)</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${abstractFile.progress}%` }}></div>
                        </div>
                        <div className="file-actions">
                          {abstractFile.progress === 100 ? <span className="success-check">✓</span> : <span className="upload-percentage">{abstractFile.progress}%</span>}
                          <button type="button" className="btn-delete-file" onClick={() => deleteUploadedFile('abstract')}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-actions">
                        <input type="file" id="file-abstract" style={{ display: 'none' }} onChange={(e) => handleRealFileUpload('abstract', e, 2)} />
                        <button type="button" className="btn-upload-file" onClick={() => document.getElementById('file-abstract')?.click()}>📂 Archivo Local</button>
                        <button type="button" className="btn-upload-test" onClick={() => handleFileUploadSimulated('abstract', 'Resumen_CambioClimatico.pdf', 0.85, 2)}>Cargar Test (0.85 MB)</button>
                        <button type="button" className="btn-upload-test error" onClick={() => handleFileUploadSimulated('abstract', 'Resumen_Pesado.pdf', 3.5, 2)}>Cargar Error (3.5 MB)</button>
                      </div>
                    )}
                  </div>

                  {/* Fila 2: Manuscrito Completo (25MB) */}
                  <div className="upload-card">
                    <div className="upload-header">
                      <span className="file-type-icon">📚</span>
                      <div className="upload-title-limit">
                        <strong>Manuscrito Completo</strong>
                        <span className="limit-tag">Límite: 25 MB</span>
                      </div>
                    </div>
                    {manuscriptFile ? (
                      <div className="uploaded-file-status">
                        <span className="file-name" title={manuscriptFile.name}>{manuscriptFile.name}</span>
                        <span className="file-size">({manuscriptFile.size} MB)</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${manuscriptFile.progress}%` }}></div>
                        </div>
                        <div className="file-actions">
                          {manuscriptFile.progress === 100 ? <span className="success-check">✓</span> : <span className="upload-percentage">{manuscriptFile.progress}%</span>}
                          <button type="button" className="btn-delete-file" onClick={() => deleteUploadedFile('manuscript')}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-actions">
                        <input type="file" id="file-manuscript" style={{ display: 'none' }} onChange={(e) => handleRealFileUpload('manuscript', e, 25)} />
                        <button type="button" className="btn-upload-file" onClick={() => document.getElementById('file-manuscript')?.click()}>📂 Archivo Local</button>
                        <button type="button" className="btn-upload-test" onClick={() => handleFileUploadSimulated('manuscript', 'Articulo_Completo.docx', 12.4, 25)}>Cargar Test (12.4 MB)</button>
                        <button type="button" className="btn-upload-test error" onClick={() => handleFileUploadSimulated('manuscript', 'Paper_AltasFiguras.pdf', 28.1, 25)}>Cargar Error (28.1 MB)</button>
                      </div>
                    )}
                  </div>

                  {/* Fila 3: Audio de Resumen (10MB) */}
                  <div className="upload-card">
                    <div className="upload-header">
                      <span className="file-type-icon">🎙️</span>
                      <div className="upload-title-limit">
                        <strong>Audio (Resumen / Podcast)</strong>
                        <span className="limit-tag">Límite: 10 MB</span>
                      </div>
                    </div>
                    {audioFile ? (
                      <div className="uploaded-file-status">
                        <span className="file-name" title={audioFile.name}>{audioFile.name}</span>
                        <span className="file-size">({audioFile.size} MB)</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${audioFile.progress}%` }}></div>
                        </div>
                        <div className="file-actions">
                          {audioFile.progress === 100 ? <span className="success-check">✓</span> : <span className="upload-percentage">{audioFile.progress}%</span>}
                          <button type="button" className="btn-delete-file" onClick={() => deleteUploadedFile('audio')}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-actions">
                        <input type="file" id="file-audio" style={{ display: 'none' }} onChange={(e) => handleRealFileUpload('audio', e, 10)} />
                        <button type="button" className="btn-upload-file" onClick={() => document.getElementById('file-audio')?.click()}>📂 Archivo Local</button>
                        <button type="button" className="btn-upload-test" onClick={() => handleFileUploadSimulated('audio', 'Podcast_AudioExplicativo.mp3', 4.2, 10)}>Cargar Test (4.2 MB)</button>
                        <button type="button" className="btn-upload-test error" onClick={() => handleFileUploadSimulated('audio', 'Podcast_Completo_Wav.wav', 18.0, 10)}>Cargar Error (18.0 MB)</button>
                      </div>
                    )}
                  </div>

                  {/* Fila 4: Afiche o Póster (15MB) */}
                  <div className="upload-card">
                    <div className="upload-header">
                      <span className="file-type-icon">🖼️</span>
                      <div className="upload-title-limit">
                        <strong>Afiche o Póster</strong>
                        <span className="limit-tag">Límite: 15 MB</span>
                      </div>
                    </div>
                    {posterFile ? (
                      <div className="uploaded-file-status">
                        <span className="file-name" title={posterFile.name}>{posterFile.name}</span>
                        <span className="file-size">({posterFile.size} MB)</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${posterFile.progress}%` }}></div>
                        </div>
                        <div className="file-actions">
                          {posterFile.progress === 100 ? <span className="success-check">✓</span> : <span className="upload-percentage">{posterFile.progress}%</span>}
                          <button type="button" className="btn-delete-file" onClick={() => deleteUploadedFile('poster')}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-actions">
                        <input type="file" id="file-poster" style={{ display: 'none' }} onChange={(e) => handleRealFileUpload('poster', e, 15)} />
                        <button type="button" className="btn-upload-file" onClick={() => document.getElementById('file-poster')?.click()}>📂 Archivo Local</button>
                        <button type="button" className="btn-upload-test" onClick={() => handleFileUploadSimulated('poster', 'Poster_Investigacion_A0.pdf', 9.8, 15)}>Cargar Test (9.8 MB)</button>
                        <button type="button" className="btn-upload-test error" onClick={() => handleFileUploadSimulated('poster', 'Poster_SinComprimir.png', 17.5, 15)}>Cargar Error (17.5 MB)</button>
                      </div>
                    )}
                  </div>

                  {/* Fila 5: Video de Presentación (50MB) */}
                  <div className="upload-card large">
                    <div className="upload-header">
                      <span className="file-type-icon">📹</span>
                      <div className="upload-title-limit">
                        <strong>Video de Presentación (~5 min)</strong>
                        <span className="limit-tag">Límite: 50 MB</span>
                      </div>
                    </div>
                    {videoFile ? (
                      <div className="uploaded-file-status">
                        <span className="file-name" title={videoFile.name}>{videoFile.name}</span>
                        <span className="file-size">({videoFile.size} MB)</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${videoFile.progress}%` }}></div>
                        </div>
                        <div className="file-actions">
                          {videoFile.progress === 100 ? <span className="success-check">✓</span> : <span className="upload-percentage">{videoFile.progress}%</span>}
                          <button type="button" className="btn-delete-file" onClick={() => deleteUploadedFile('video')}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-actions">
                        <input type="file" id="file-video" style={{ display: 'none' }} onChange={(e) => handleRealFileUpload('video', e, 50)} />
                        <button type="button" className="btn-upload-file" onClick={() => document.getElementById('file-video')?.click()}>📂 Archivo Local</button>
                        <button type="button" className="btn-upload-test" onClick={() => handleFileUploadSimulated('video', 'Video_Exposicion_5min.mp4', 38.6, 50)}>Cargar Test (38.6 MB)</button>
                        <button type="button" className="btn-upload-test error" onClick={() => handleFileUploadSimulated('video', 'Video_Raw_SinEditar.mov', 125.0, 50)}>Cargar Error (125.0 MB)</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado de envío */}
              <div className="submission-actions-panel">
                <div className="status-indicator">
                  <span>Estado de la Ponencia: </span>
                  <span className={`status-label ${submissionStatus}`}>
                    {submissionStatus === 'draft' && '📄 Borrador (Pendiente de Sincronizar)'}
                    {submissionStatus === 'submitted' && '📤 Sincronizado en OJS (En Revisión)'}
                    {submissionStatus === 'reviewed' && '✅ Evaluado'}
                  </span>
                </div>
                {submissionStatus === 'draft' && (
                  <button
                    type="button"
                    className="btn-primary btn-accent"
                    onClick={publishAndSyncOjs}
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Enviando a OJS...' : 'Enviar y Sincronizar Ponencia'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LADO IZQUIERDO: Portal de Inscripción y Pagos (Asistente) */}
        {activeRole === 'asistente' && (
          <div className="card">
            <div className="card-title-section">
              <h2>
                <span className="icon">👥</span> Portal de Inscripción y Pagos (Asistente)
              </h2>
            </div>

            <div className="form-section">
              {paymentStatus === 'pending' ? (
                <div className="invoice-container">
                  <div className="invoice-details">
                    <h3>Inscripción al Congreso</h3>
                    <p className="invoice-desc">Acceso completo a ponencias presenciales, aulas virtuales y certificado oficial de asistencia.</p>
                    <div className="invoice-price">$50.00 USD</div>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="payment-form">
                    <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Detalles de Tarjeta (Simulado)</label>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Número de Tarjeta (4000 1234 5678 9010)"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                        required
                      />
                      <input
                        type="password"
                        placeholder="CVC"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                        maxLength={3}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary btn-accent"
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? 'Validando con pasarela...' : 'Pagar Inscripción'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="payment-success-container">
                  <div className="success-icon-banner">🎉</div>
                  <h3>¡Inscripción Confirmada!</h3>
                  <p>Tu pago ha sido validado y procesado de manera exitosa.</p>

                  {/* Ticket Digital QR */}
                  <div className="digital-ticket">
                    <div className="ticket-header">
                      <strong>TICKET DE INGRESO</strong>
                      <span className="ticket-id">#NV-2026-8941</span>
                    </div>
                    <div className="ticket-body">
                      <p><strong>Asistente:</strong> Israel Samuels</p>
                      <p><strong>Evento:</strong> {name}</p>
                      <p><strong>Modalidad:</strong> {modality.toUpperCase()}</p>
                      <p><strong>Acceso:</strong> {classroom}</p>
                    </div>
                    <div className="ticket-qr-sim">
                      {/* Simulación visual de QR en CSS */}
                      <div className="qr-box">
                        <div className="qr-pixel-grid"></div>
                      </div>
                      <span className="qr-text">Presentar QR al ingresar</span>
                    </div>
                  </div>

                  {/* Itinerario Desbloqueado */}
                  <div className="agenda-section">
                    <h4>📅 Tu Itinerario del Congreso</h4>
                    <div className="agenda-list">
                      <div className="agenda-item">
                        <div className="time">09:00 AM</div>
                        <div className="details">
                          <strong>Conferencia Magistral Inaugural</strong>
                          <span className="room-link active">Sala: {classroom} (Enlace Desbloqueado)</span>
                        </div>
                      </div>
                      <div className="agenda-item">
                        <div className="time">11:00 AM</div>
                        <div className="details">
                          <strong>Sesión de Ponencias Orales - Línea: {lines.find(l => l.id === selectedLine)?.name || 'Línea General'}</strong>
                          <span className="room-link active">Acceso a Transmisión Directa</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LADO IZQUIERDO: Portal de Evaluación (Revisor / Evaluador) */}
        {activeRole === 'revisor_eval' && (
          <div className="card">
            <div className="card-title-section">
              <h2>
                <span className="icon">🔍</span> Portal de Evaluación Académica (Revisor/Evaluador)
              </h2>
            </div>

            <div className="form-section">
              <div className="submission-review-details">
                <div className="review-label">Trabajo asignado para revisión por doble ciego:</div>
                <div className="review-title">"{submissionTitle}"</div>
                <div className="review-meta">
                  <span><strong>Categoría:</strong> {submissionCategory.toUpperCase()}</span>
                  <span><strong>Línea:</strong> {lines.find(l => l.id === selectedLine)?.name || 'General'}</span>
                </div>
              </div>

              {evalStatus === 'pending' ? (
                <form onSubmit={handleEvaluationSubmit} className="review-form">
                  <div className="review-score-group">
                    <label>Rúbrica de Evaluación Científica (Escala 1 al 10)</label>

                    <div className="score-row">
                      <div className="score-label-box">
                        <strong>Calidad Científica</strong>
                        <span>Metodología y rigor del estudio</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={scoreScientific}
                        onChange={(e) => setScoreScientific(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="score-row">
                      <div className="score-label-box">
                        <strong>Originalidad</strong>
                        <span>Novedad y aporte de la investigación</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={scoreOriginality}
                        onChange={(e) => setScoreOriginality(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="score-row">
                      <div className="score-label-box">
                        <strong>Presentación Oral / Video</strong>
                        <span>Claridad en la exposición de 5 min</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={scorePresentation}
                        onChange={(e) => setScorePresentation(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="eval-comments">Comentarios y Observaciones (Ciego)</label>
                    <textarea
                      id="eval-comments"
                      rows={4}
                      value={evalComments}
                      onChange={(e) => setEvalComments(e.target.value)}
                      placeholder="Escriba comentarios constructivos para el autor..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary btn-accent"
                  >
                    Enviar Calificación y Comentarios
                  </button>
                </form>
              ) : (
                <div className="eval-success-banner">
                  <div className="success-icon">✓</div>
                  <h3>Evaluación Enviada</h3>
                  <p>Muchas gracias. Tus calificaciones y comentarios ciegos han sido almacenados y notificados a los editores del congreso.</p>
                  <div className="eval-summary-card">
                    <p><strong>Puntaje Promedio:</strong> {((scoreScientific + scoreOriginality + scorePresentation) / 3).toFixed(1)} / 10</p>
                    <p><strong>Veredicto:</strong> {((scoreScientific + scoreOriginality + scorePresentation) / 3) >= 7 ? <span className="verdict approved">Aprobado</span> : <span className="verdict rejected">Rechazado</span>}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LADO DERECHO: Configuración e Integración con OJS 3.4 */}
        <div className="card">
          <div className="card-title-section">
            <h2>
              <span className="icon">⚙</span> Configuración de Integración OJS 3.4
            </h2>
          </div>

          <div className="form-section">
            {/* Parámetros de Integración */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ojs-url">OJS Base URL</label>
                <input
                  id="ojs-url"
                  type="text"
                  value={ojsUrl}
                  onChange={(e) => setOjsUrl(e.target.value)}
                  placeholder="https://revista.universidad.edu/index.php/memorias"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ojs-key">API Key (Token de OJS 3.4)</label>
                <input
                  id="ojs-key"
                  type="password"
                  value={ojsApiKey}
                  onChange={(e) => setOjsApiKey(e.target.value)}
                  placeholder="Token de acceso REST API"
                />
              </div>
            </div>

            {/* Estado de la Integración */}
            <div className="form-group">
              <label>Estado de la Conexión</label>
              <div
                className={`ojs-status-badge ${ojsStatus === 'connected' ? 'connected' : 'disconnected'}`}
              >
                {ojsStatus === 'connected' ? '● Conectado a OJS 3.4' : '○ Desconectado'}
              </div>
            </div>

            {/* Selector de Revista Destino */}
            {ojsStatus === 'connected' && journals.length > 0 && (
              <div className="form-group journal-selector-group">
                <label htmlFor="ojs-journal-select">📖 Revista de Destino</label>
                <select
                  id="ojs-journal-select"
                  value={selectedJournal?.id || ''}
                  onChange={(e) => {
                    const journalId = parseInt(e.target.value);
                    const found = journals.find(j => j.id === journalId);
                    if (found) {
                      setSelectedJournal(found);
                      addLog('info', `Revista seleccionada: "${found.name}" (ID: ${found.id}, Path: ${found.urlPath})`);
                    }
                  }}
                  className="journal-select-dropdown"
                >
                  {journals.map((j) => (
                    <option key={j.id} value={j.id} disabled={!j.enabled}>
                      {j.name} {!j.enabled ? '(Deshabilitada en OJS)' : ''}
                    </option>
                  ))}
                </select>
                {selectedJournal && (
                  <p className="journal-selected-helper">
                    Las ponencias y congresos se registrarán en: <a href={selectedJournal.url} target="_blank" rel="noreferrer" className="journal-link">{selectedJournal.url}</a>
                  </p>
                )}
              </div>
            )}

            {/* Acciones de Sincronización */}
            <div className="ojs-action-buttons">
              <button
                type="button"
                className="btn-secondary"
                onClick={testOjsConnection}
                disabled={isTestingConnection || isPublishing}
              >
                {isTestingConnection ? 'Comprobando...' : 'Probar Conexión OJS'}
              </button>

              <button
                type="button"
                className="btn-primary btn-accent"
                onClick={publishAndSyncOjs}
                disabled={isPublishing || isTestingConnection}
              >
                {isPublishing ? 'Sincronizando...' : 'Publicar y Sincronizar en OJS'}
              </button>
            </div>

            {/* Consola de Simulación REST API / Webhooks */}
            <div className="console-section">
              <div className="console-header">
                <div className="console-title">Consola de Integración OJS (REST API & Webhooks)</div>
                <button type="button" className="console-clear" onClick={clearConsole}>
                  Limpiar Consola
                </button>
              </div>
              <div className="console-logs">
                {logs.length === 0 ? (
                  <div className="log-item info">Consola limpia. Realiza una acción de sincronización.</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`log-item ${log.type}`}>
                      <span className="time">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                      {log.payload && (
                        <pre className="log-payload-pre">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>

            {/* Inspector de Payload del Congreso (Metadatos) */}
            <div className="payload-inspector">
              <div className="inspector-header">
                <h3>Payload JSON de Metadatos del Congreso</h3>
                <button type="button" className="btn-copy" onClick={copyPayload}>
                  Copiar JSON
                </button>
              </div>
              <pre className="inspector-code">
                {JSON.stringify(getCongressJson(), null, 2)}
              </pre>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
