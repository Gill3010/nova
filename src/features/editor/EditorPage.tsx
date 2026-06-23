import React, { useState, useEffect, useCallback } from 'react';
import { 
  Inbox, 
  AlertTriangle, 
  ClipboardCheck, 
  RefreshCw, 
  Search, 
  UserPlus, 
  UserMinus, 
  Bot, 
  Star, 
  MessageSquare, 
  Calendar, 
  User, 
  Download, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { 
  fetchEditorDashboard, 
  submitEditorialDecision, 
  fetchDecisionHistory, 
  fetchActiveReviewers, 
  assignRevisorEnvio, 
  unassignRevisorEnvio, 
  fetchRevisorAssignments,
  fetchDetailedEvaluations,
  getEnvioArchivoUrl,
  fetchEnvioArchivoBlobUrl
} from '../../services/dbApi';
import { fetchSubmissionFiles, downloadFileAsBlobUrl } from '../../services/ojsApi';
import type { PostgresUser } from '../../services/dbApi';
import type { 
  EditorDashboardEnvio, 
  EditorialDecision, 
  ReviewerEvaluation
} from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const EditorPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // Dashboard state
  const [submissions, setSubmissions] = useState<EditorDashboardEnvio[]>([]);
  const [selectedSub, setSelectedSub] = useState<EditorDashboardEnvio | null>(null);
  const [evaluations, setEvaluations] = useState<ReviewerEvaluation[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<EditorialDecision[]>([]);
  const [reviewers, setReviewers] = useState<PostgresUser[]>([]);
  const [assignments, setAssignments] = useState<{ revisor_id: number; envio_id: number }[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'detalles' | 'evaluaciones' | 'ia_report' | 'asignar' | 'pdf'>('detalles');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'revision_required'>('all');
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Decision Form state
  const [decision, setDecision] = useState<'accepted' | 'rejected' | 'revision_required' | ''>('');
  const [justificacion, setJustificacion] = useState('');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // PDF Viewer state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (activeTab === 'pdf' && selectedSub) {
      setLoadingPdf(true);
      setPdfError(null);
      setPdfUrl(null);
      
      const loadPdf = async () => {
        try {
          if (selectedSub.archivo_key) {
             const blobUrl = await fetchEnvioArchivoBlobUrl(selectedSub.id);
             if (active) setPdfUrl(blobUrl);
             return;
          }
          
          if (selectedSub.portal_url && selectedSub.portal_api_key && selectedSub.revista_path) {
             const res = await fetchSubmissionFiles(
               selectedSub.portal_url,
               selectedSub.portal_api_key,
               selectedSub.revista_path,
               selectedSub.ojs_submission_id
             );
             const files = res.items || res || [];
             const pdfFile = files.find((f: any) =>
               f.genreId === 1 ||
               f.originalFilename?.toLowerCase().endsWith('.pdf') ||
               f.name?.es?.toLowerCase().endsWith('.pdf') ||
               f.name?.en?.toLowerCase().endsWith('.pdf')
             );
             
             if (pdfFile && pdfFile.url) {
               const blobUrl = await downloadFileAsBlobUrl(selectedSub.portal_api_key, pdfFile.url);
               if (active) setPdfUrl(blobUrl);
               return;
             }
          }
          
          if (active) setPdfError('PDF no encontrado localmente ni en OJS.');
        } catch (err: any) {
          if (active) setPdfError(err.message || 'Error cargando el PDF.');
        } finally {
          if (active) setLoadingPdf(false);
        }
      };
      
      loadPdf();
    }
    
    return () => {
      active = false;
      // Note: we don't revoke here instantly because the iframe might still be rendering it, 
      // but in a real app we'd revoke the old URL when selectedSub changes.
    };
  }, [activeTab, selectedSub]);

  // Load submissions & active reviewers
  const loadDashboardData = useCallback(async () => {
    setLoadingSubmissions(true);
    setError(null);
    try {
      const [dashData, revsData] = await Promise.all([
        fetchEditorDashboard(),
        fetchActiveReviewers()
      ]);
      setSubmissions(dashData);
      setReviewers(revsData);
    } catch (err: any) {
      console.error('Error loading editor dashboard:', err);
      setError(err.message || 'Error al cargar los datos del panel del editor.');
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.rol === 'editor' || currentUser?.rol === 'admin') {
      loadDashboardData();
    }
  }, [currentUser, loadDashboardData]);

  // Load detailed info for selected submission
  const loadSubmissionDetails = async (sub: EditorDashboardEnvio) => {
    setLoadingDetails(true);
    setFormSuccess(null);
    setFormError(null);
    try {
      const [evals, history, assigns] = await Promise.all([
        fetchDetailedEvaluations(sub.id),
        fetchDecisionHistory(sub.id),
        fetchRevisorAssignments()
      ]);
      setEvaluations(evals);
      setDecisionHistory(history);
      setAssignments(assigns);
      
      // Auto fill form with latest decision if it exists
      if (sub.estado_editorial !== 'pending') {
        setDecision(sub.estado_editorial as any);
        setJustificacion(sub.ultima_justificacion || '');
      } else {
        setDecision('');
        setJustificacion('');
      }
    } catch (err: any) {
      console.error('Error loading submission details:', err);
      setError(err.message || 'Error al cargar detalles de las evaluaciones.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectSubmission = (sub: EditorDashboardEnvio) => {
    setSelectedSub(sub);
    setActiveTab('detalles');
    loadSubmissionDetails(sub);
  };

  // Toggle Reviewer Assignment
  const handleToggleAssignment = async (revisorId: number, envioId: number, isCurrentlyAssigned: boolean) => {
    try {
      if (isCurrentlyAssigned) {
        await unassignRevisorEnvio(revisorId, envioId);
        setAssignments(prev => prev.filter(a => !(a.revisor_id === revisorId && a.envio_id === envioId)));
      } else {
        await assignRevisorEnvio(revisorId, envioId);
        setAssignments(prev => [...prev, { revisor_id: revisorId, envio_id: envioId }]);
      }
      
      // Refresh evaluations in case assignment changed
      const evals = await fetchDetailedEvaluations(envioId);
      setEvaluations(evals);
      
      // Update local submissions list counter
      setSubmissions(prev => 
        prev.map(s => {
          if (s.id === envioId) {
            const diff = isCurrentlyAssigned ? -1 : 1;
            return { ...s, total_evaluaciones: Math.max(0, s.total_evaluaciones + diff) };
          }
          return s;
        })
      );
      if (selectedSub && selectedSub.id === envioId) {
        setSelectedSub(prev => prev ? { 
          ...prev, 
          total_evaluaciones: Math.max(0, prev.total_evaluaciones + (isCurrentlyAssigned ? -1 : 1)) 
        } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Error al modificar la asignación del revisor.');
    }
  };

  // Submit Editorial Decision
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    if (!decision) {
      setFormError('Por favor seleccione una decisión.');
      return;
    }
    if (!justificacion || justificacion.trim().length < 10) {
      setFormError('La justificación debe tener al menos 10 caracteres.');
      return;
    }

    setSubmittingDecision(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const newDecision = await submitEditorialDecision(selectedSub.id, decision, justificacion);
      
      setFormSuccess(`Decisión registrada con éxito: ${
        decision === 'accepted' ? 'Aceptado' : decision === 'rejected' ? 'Rechazado' : 'Cambios Solicitados'
      }`);

      // Update selected submission locally
      const updatedSub = {
        ...selectedSub,
        estado_editorial: decision as any,
        ultima_decision: decision as any,
        ultima_justificacion: justificacion,
        fecha_decision: newDecision.created_at,
        editor_nombre: currentUser?.nombre || 'Editor'
      };
      setSelectedSub(updatedSub);

      // Update in submissions list
      setSubmissions(prev => prev.map(s => s.id === selectedSub.id ? updatedSub : s));

      // Refresh decision history
      const history = await fetchDecisionHistory(selectedSub.id);
      setDecisionHistory(history);
    } catch (err: any) {
      console.error('Error submitting decision:', err);
      setFormError(err.message || 'Error al guardar la decisión editorial.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Filtering Logic
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.titulo_articulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.congreso_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#${sub.ojs_submission_id}`.includes(searchTerm);
      
    const matchesStatus = 
      statusFilter === 'all' || 
      sub.estado_editorial === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Access check
  if (currentUser?.rol !== 'editor' && currentUser?.rol !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Denegado</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Top Banner / Header */}
      <Card className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <ClipboardCheck className="h-5 w-5 text-indigo-500" aria-hidden="true" /> Panel de Decisiones Editoriales
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Analiza evaluaciones, asigna revisores a envíos y toma decisiones editoriales finales sobre manuscritos.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadDashboardData} disabled={loadingSubmissions}>
          <RefreshCw className={`h-3.5 w-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} aria-hidden="true" />
          {loadingSubmissions ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Card>

      {error && (
        <div className="bg-red-55/70 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200/50">
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Main Grid split screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left pane: Submissions List */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          <Card className="p-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Manuscritos</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por título, congreso o ID..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-1 mt-1">
              {(['all', 'pending', 'accepted', 'rejected', 'revision_required'] as const).map(f => {
                const labels: Record<string, string> = {
                  all: 'Todos',
                  pending: 'Pendientes',
                  accepted: 'Aceptados',
                  rejected: 'Rechazados',
                  revision_required: 'Cambios'
                };
                const active = statusFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all ${
                      active 
                        ? 'bg-indigo-650 border-indigo-650 text-white dark:bg-indigo-600' 
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Submissions List Container */}
          <div className="flex flex-col gap-2 max-h-[650px] overflow-y-auto pr-1">
            {loadingSubmissions ? (
              <div className="py-20 text-center">
                <RefreshCw className="h-6 w-6 mx-auto text-indigo-500 animate-spin mb-2" />
                <span className="text-xs text-zinc-400">Cargando envíos...</span>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
                <Inbox className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="text-xs font-semibold">No se encontraron manuscritos</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Prueba a cambiar tus filtros de búsqueda.</p>
              </div>
            ) : (
              filteredSubmissions.map(sub => {
                const isSelected = selectedSub?.id === sub.id;
                
                // Calculate average evaluations score if available
                const hasScore = sub.avg_scientific !== null;
                const scoreAvg = hasScore 
                  ? ((Number(sub.avg_scientific) + Number(sub.avg_originality) + Number(sub.avg_presentation)) / 3).toFixed(1)
                  : null;

                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full gap-2">
                      <span className="text-[10px] font-bold text-zinc-400">ID #{sub.ojs_submission_id}</span>
                      {sub.estado_editorial === 'pending' ? (
                        <Badge variant="warning">Pendiente</Badge>
                      ) : sub.estado_editorial === 'accepted' ? (
                        <Badge variant="success">Aceptado</Badge>
                      ) : sub.estado_editorial === 'rejected' ? (
                        <Badge variant="destructive">Rechazado</Badge>
                      ) : (
                        <Badge variant="warning">Cambios Req.</Badge>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 line-clamp-2 leading-snug">
                      {sub.titulo_articulo}
                    </h4>

                    <div className="flex items-center gap-1 text-[10px] text-zinc-450 dark:text-zinc-500">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="truncate max-w-[120px]">{sub.congreso_nombre}</span>
                    </div>

                    {/* Stats summary row */}
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1 w-full text-[10px]">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {sub.total_evaluaciones} {sub.total_evaluaciones === 1 ? 'evaluación' : 'evaluaciones'}
                      </span>
                      {scoreAvg && (
                        <span className="font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          {scoreAvg}/10
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Detailed view & decision form */}
        <div className="lg:col-span-8 w-full flex flex-col gap-6">
          {!selectedSub ? (
            <Card className="flex flex-col items-center justify-center py-40 text-center">
              <Inbox className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Ningún manuscrito seleccionado</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs">
                Selecciona uno de los manuscritos en la lista de la izquierda para ver sus revisiones, asignaciones y emitir una decisión.
              </p>
            </Card>
          ) : (
            <Card className="flex flex-col gap-6 p-6">
              
              {/* Submission Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-455">
                    {selectedSub.congreso_nombre}
                  </span>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">
                    "{selectedSub.titulo_articulo}"
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                    <User className="h-3.5 w-3.5" />
                    <span>Autor: <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedSub.autor_email}</span></span>
                    <span>•</span>
                    <span>ID OJS: <span className="font-semibold text-zinc-700 dark:text-zinc-300">#{selectedSub.ojs_submission_id}</span></span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {selectedSub.estado_editorial === 'pending' ? (
                    <Badge variant="warning" className="px-3 py-1 text-sm font-bold">Decisión Pendiente</Badge>
                  ) : selectedSub.estado_editorial === 'accepted' ? (
                    <Badge variant="success" className="px-3 py-1 text-sm font-bold">Aceptado</Badge>
                  ) : selectedSub.estado_editorial === 'rejected' ? (
                    <Badge variant="destructive" className="px-3 py-1 text-sm font-bold">Rechazado</Badge>
                  ) : (
                    <Badge variant="warning" className="px-3 py-1 text-sm font-bold">Cambios Solicitados</Badge>
                  )}
                  {selectedSub.fecha_decision && (
                    <span className="text-[9px] text-zinc-400 italic">
                      Por: {selectedSub.editor_nombre} ({new Date(selectedSub.fecha_decision).toLocaleDateString()})
                    </span>
                  )}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg gap-1">
                {(['detalles', 'evaluaciones', 'ia_report', 'asignar', 'pdf'] as const).map(tab => {
                  const labels = {
                    detalles: 'Ficha',
                    evaluaciones: `Reviews (${selectedSub.total_evaluaciones})`,
                    ia_report: 'Preliminar',
                    asignar: 'Asignar',
                    pdf: 'PDF'
                  };
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${
                        active
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels */}
              <div className="min-h-[300px] border border-zinc-100 dark:border-zinc-850 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/10">
                {loadingDetails ? (
                  <div className="py-20 text-center">
                    <RefreshCw className="h-6 w-6 mx-auto text-indigo-500 animate-spin mb-2" />
                    <span className="text-xs text-zinc-400">Cargando detalles...</span>
                  </div>
                ) : (
                  <>
                    {/* 1. DETALLES PANEL */}
                    {activeTab === 'detalles' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Resumen Académico</span>
                          <p className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200/50 dark:border-zinc-800 text-xs text-zinc-750 dark:text-zinc-300 leading-relaxed italic whitespace-pre-wrap">
                            {selectedSub.resumen || 'El autor no ha proporcionado un resumen para este artículo.'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs">
                            <span className="text-zinc-400 block font-semibold mb-1">Clasificación</span>
                            <div className="flex flex-col gap-1.5">
                              <div><span className="text-zinc-400">Categoría:</span> <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedSub.categoria || 'N/A'}</span></div>
                              {selectedSub.nivel_academico && (
                                <div><span className="text-zinc-400">Nivel Académico:</span> <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedSub.nivel_academico}</span></div>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs">
                            <span className="text-zinc-400 block font-semibold mb-1">Línea de Investigación</span>
                            <span className="font-bold text-zinc-850 dark:text-zinc-200">{selectedSub.linea_investigacion || 'General / Multidisciplinaria'}</span>
                          </div>
                        </div>

                        {selectedSub.archivo_key && (
                          <div className="flex justify-start mt-2">
                            <a 
                              href={getEnvioArchivoUrl(selectedSub.id)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-650 hover:text-indigo-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg transition-colors shadow-2xs"
                            >
                              <Download className="h-4 w-4" /> Descargar archivo de manuscrito original
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. EVALUACIONES PANEL */}
                    {activeTab === 'evaluaciones' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Evaluaciones de Revisores Científicos</h4>
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                            Total: {evaluations.length}
                          </span>
                        </div>

                        {evaluations.length === 0 ? (
                          <div className="text-center py-10 text-zinc-500 bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <MessageSquare className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                            <p className="text-xs font-semibold">Aún no hay evaluaciones cargadas</p>
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">Asigna revisores en la pestaña "Asignar" para que evalúen el manuscrito.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {evaluations.map((ev) => {
                              const evAvg = ((ev.score_scientific + ev.score_originality + ev.score_presentation) / 3).toFixed(1);
                              return (
                                <div key={ev.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-extrabold text-zinc-855 dark:text-zinc-250">{ev.revisor_nombre}</span>
                                      <span className="text-[9px] text-zinc-400">{ev.revisor_email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {ev.approved ? (
                                        <Badge variant="success">Recomienda: Aceptar</Badge>
                                      ) : (
                                        <Badge variant="destructive">Recomienda: Rechazar</Badge>
                                      )}
                                      <span className="text-xs font-black bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                                        {evAvg}/10
                                      </span>
                                    </div>
                                  </div>

                                  {/* Score Bars */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850">
                                    <div>
                                      <div className="flex justify-between text-[9px] font-semibold text-zinc-400 mb-0.5">
                                        <span>Calidad Científica</span>
                                        <span>{ev.score_scientific}/10</span>
                                      </div>
                                      <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${ev.score_scientific * 10}%` }} />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between text-[9px] font-semibold text-zinc-400 mb-0.5">
                                        <span>Originalidad</span>
                                        <span>{ev.score_originality}/10</span>
                                      </div>
                                      <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${ev.score_originality * 10}%` }} />
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex justify-between text-[9px] font-semibold text-zinc-400 mb-0.5">
                                        <span>Presentación</span>
                                        <span>{ev.score_presentation}/10</span>
                                      </div>
                                      <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${ev.score_presentation * 10}%` }} />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic bg-zinc-50/50 dark:bg-zinc-950/10 p-3 rounded-lg border border-zinc-200/20">
                                    <span className="text-[10px] font-bold text-zinc-400 block not-italic uppercase mb-1">Comentarios del Revisor</span>
                                    "{ev.comments}"
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. PRELIMINAR PANEL */}
                    {activeTab === 'ia_report' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Bot className="h-4 w-4 text-violet-500" /> Revisión preliminar del sistema
                          </div>
                          {selectedSub.ia_comments && (
                            <Badge variant="success">Generado</Badge>
                          )}
                        </div>

                        {!selectedSub.ia_comments ? (
                          <div className="w-full flex flex-col items-center justify-center gap-3 py-16 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800/60">
                            <Bot className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                            <div className="text-center">
                              <p className="text-xs font-semibold">Revisión preliminar del sistema no disponible</p>
                              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">La revisión preliminar se genera automáticamente cuando se adjunta un archivo al manuscrito.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-850">
                              <div>
                                <div className="flex justify-between items-center text-[10px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
                                  <span>Calidad Científica</span>
                                  <span>{selectedSub.ia_scientific}/10</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-violet-500" style={{ width: `${(selectedSub.ia_scientific || 0) * 10}%` }} />
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center text-[10px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
                                  <span>Originalidad</span>
                                  <span>{selectedSub.ia_originality}/10</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-violet-500" style={{ width: `${(selectedSub.ia_originality || 0) * 10}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center text-[10px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
                                  <span>Presentación</span>
                                  <span>{selectedSub.ia_presentation}/10</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-violet-500" style={{ width: `${(selectedSub.ia_presentation || 0) * 10}%` }} />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-violet-500 block mb-2">
                                Observaciones del Sistema
                              </span>
                              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic">
                                {selectedSub.ia_comments}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. ASIGNAR PANEL */}
                    {activeTab === 'asignar' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Gestión de Revisores Científicos</h4>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Asigna revisores a este manuscrito para que lo evalúen. Los cambios se persisten automáticamente.
                        </p>

                        {reviewers.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic py-4">No hay revisores activos disponibles en el sistema.</p>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {reviewers.map(rev => {
                              const isAssigned = assignments.some(a => a.revisor_id === rev.id && a.envio_id === selectedSub.id);
                              return (
                                <label
                                  key={rev.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                    isAssigned
                                      ? 'bg-blue-50/40 dark:bg-blue-950/15 border-blue-500'
                                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() => handleToggleAssignment(rev.id, selectedSub.id, isAssigned)}
                                      className="rounded border-zinc-350 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-bold text-zinc-900 dark:text-white">{rev.nombre}</span>
                                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500">{rev.email}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    {isAssigned ? (
                                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <UserMinus className="h-3.5 w-3.5" /> Asignado
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-500 flex items-center gap-1">
                                        <UserPlus className="h-3.5 w-3.5" /> Sin asignar
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. PDF PANEL */}
                    {activeTab === 'pdf' && (
                      <div className="w-full h-[500px] flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs text-zinc-450">
                          <span>Visor de Manuscrito PDF</span>
                          {pdfUrl && (
                            <a 
                              href={pdfUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                            >
                              Abrir externo <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        
                        {loadingPdf ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400 py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                            <span className="text-xs font-semibold">Cargando PDF seguro...</span>
                          </div>
                        ) : pdfError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-red-500 py-12 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6 text-center">
                            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                            <span className="text-xs font-bold">PDF no disponible</span>
                            <span className="text-[10px] text-red-400">{pdfError}</span>
                          </div>
                        ) : pdfUrl ? (
                          <iframe
                            src={`${pdfUrl}#toolbar=0`}
                            title="Visor PDF Editor"
                            className="w-full h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
                          />
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Editorial Decision Form */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
                <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-250 uppercase tracking-wider mb-3">
                  Toma de Decisión Editorial
                </h4>
                
                {selectedSub.estado_editorial !== 'pending' && (
                  <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 p-3 rounded-lg border border-amber-200 text-xs">
                    <span className="font-bold block mb-0.5">Atención:</span>
                    Este manuscrito ya cuenta con una decisión registrada ({
                      selectedSub.estado_editorial === 'accepted' ? 'Aceptado' : selectedSub.estado_editorial === 'rejected' ? 'Rechazado' : 'Cambios Solicitados'
                    }). Si lo deseas, puedes modificar o re-evaluar la decisión y la justificación a continuación.
                  </div>
                )}

                <form onSubmit={handleDecisionSubmit} className="flex flex-col gap-4">
                  {/* Select decision */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Decisión Final</label>
                    <select
                      value={decision}
                      onChange={e => setDecision(e.target.value as any)}
                      className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={submittingDecision}
                    >
                      <option value="">-- Seleccionar Decisión --</option>
                      <option value="accepted">Aceptar Manuscrito (accepted)</option>
                      <option value="rejected">Rechazar Manuscrito (rejected)</option>
                      <option value="revision_required">Solicitar Cambios Adicionales (revision_required)</option>
                    </select>
                  </div>

                  {/* Justification */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Justificación Editorial</label>
                    <textarea
                      placeholder="Escribe la justificación científica o editorial para esta decisión. Esta justificación será visible para el autor y quedará registrada en el historial..."
                      rows={4}
                      value={justificacion}
                      onChange={e => setJustificacion(e.target.value)}
                      className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      disabled={submittingDecision}
                    />
                    <span className="text-[10px] text-zinc-400">Mínimo 10 caracteres.</span>
                  </div>

                  {formError && (
                    <div className="text-xs text-red-650 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200">
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div className="text-xs text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-250">
                      {formSuccess}
                    </div>
                  )}

                  <div className="flex justify-end mt-2">
                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={submittingDecision}
                      disabled={submittingDecision || !decision || justificacion.trim().length < 10}
                    >
                      {selectedSub.estado_editorial === 'pending' ? 'Registrar Decisión Editorial' : 'Actualizar Decisión Editorial'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* History of Decisions */}
              {decisionHistory.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
                  <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-250 uppercase tracking-wider mb-3">
                    Historial de Decisiones Editoriales
                  </h4>
                  <div className="flex flex-col gap-3">
                    {decisionHistory.map((h) => (
                      <div key={h.id} className="bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 rounded-lg p-3 text-xs flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {h.decision === 'accepted' ? (
                              <Badge variant="success">Aceptado</Badge>
                            ) : h.decision === 'rejected' ? (
                              <Badge variant="destructive">Rechazado</Badge>
                            ) : (
                              <Badge variant="warning">Cambios Req.</Badge>
                            )}
                            <span className="text-[10px] text-zinc-550 dark:text-zinc-400">
                              Por: <span className="font-semibold">{h.editor_nombre}</span> ({h.editor_email})
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-normal pl-2 border-l border-zinc-300 dark:border-zinc-700 italic">
                          "{h.justificacion}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </Card>
          )}
        </div>

      </div>
    </div>
  );
};
