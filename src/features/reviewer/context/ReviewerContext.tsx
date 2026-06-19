import React, { createContext, useContext, useState, useEffect } from 'react';
import { useOjs } from '../../../context/OjsContext';
import { fetchRevisorEnvios, submitEvaluation, fetchEvaluation, fetchSystemReport, fetchEnvioArchivoBlobUrl } from '../../../services/dbApi';
import { fetchSubmissionFiles, downloadFileAsBlobUrl } from '../../../services/ojsApi';
import type { PostgresEnvio, SystemReport } from '../../../services/dbApi';

export const DEMO_FILES = {
  pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'
};

interface ReviewerContextType {
  submissions: PostgresEnvio[];
  selectedSubmission: PostgresEnvio | null;
  setSelectedSubmission: (sub: PostgresEnvio | null) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  ojsFiles: any[];
  loadingFiles: boolean;
  fileUrls: Record<string, string>;
  fileErrorMsg: string | null;
  activeTab: 'info' | 'manuscript' | 'video' | 'audio_poster' | 'system_report';
  setActiveTab: (tab: 'info' | 'manuscript' | 'video' | 'audio_poster' | 'system_report') => void;
  scoreScientific: number;
  setScoreScientific: (val: number) => void;
  scoreOriginality: number;
  setScoreOriginality: (val: number) => void;
  scorePresentation: number;
  setScorePresentation: (val: number) => void;
  evalComments: string;
  setEvalComments: (val: string) => void;
  evalStatus: 'pending' | 'submitted';
  setEvalStatus: (val: 'pending' | 'submitted') => void;
  loadSubmissions: () => Promise<void>;
  handleEvaluationSubmit: (e: React.FormEvent) => Promise<void>;
  getFilePreviewSource: (type: 'pdf' | 'video' | 'audio' | 'poster') => string;
  averageScore: number;
  isApproved: boolean;
  // Sistema de revisión preliminar
  systemReport: SystemReport | null;
  loadingSystemReport: boolean;
  manuscriptUrl: string | null;
}

const ReviewerContext = createContext<ReviewerContextType | undefined>(undefined);

export const useReviewer = () => {
  const context = useContext(ReviewerContext);
  if (!context) {
    throw new Error('useReviewer must be used within a ReviewerProvider');
  }
  return context;
};

export const ReviewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addLog } = useOjs();

  // Submissions State
  const [submissions, setSubmissions] = useState<PostgresEnvio[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<PostgresEnvio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OJS Files State
  const [ojsFiles, setOjsFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [fileErrorMsg, setFileErrorMsg] = useState<string | null>(null);

  // Previewer Tabs (now includes system_report)
  const [activeTab, setActiveTab] = useState<'info' | 'manuscript' | 'video' | 'audio_poster' | 'system_report'>('info');

  // Sistema de revisión preliminar
  const [systemReport, setSystemReport] = useState<SystemReport | null>(null);
  const [loadingSystemReport, setLoadingSystemReport] = useState(false);

  // URL del archivo servido por Nova (sin depender de OJS)
  const [manuscriptUrl, setManuscriptUrl] = useState<string | null>(null);

  // Local state for Reviewer Evaluation
  const [scoreScientific, setScoreScientific] = useState(8);
  const [scoreOriginality, setScoreOriginality] = useState(7);
  const [scorePresentation, setScorePresentation] = useState(9);
  const [evalComments, setEvalComments] = useState('');
  const [evalStatus, setEvalStatus] = useState<'pending' | 'submitted'>('pending');

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRevisorEnvios();
      setSubmissions(data);
      if (data.length > 0) {
        setSelectedSubmission(data[0]);
      } else {
        setSelectedSubmission(null);
      }
    } catch (err: any) {
      console.error("Error loading reviewer envios:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Fetch submission files and load their Blob URLs from OJS
  useEffect(() => {
    if (!selectedSubmission) return;

    let active = true;
    let localManuscriptBlobUrl: string | null = null;

    const loadEvaluationData = async () => {
      try {
        const evalData = await fetchEvaluation(selectedSubmission.id);
        if (!active) return;
        if (evalData) {
          setScoreScientific(evalData.score_scientific);
          setScoreOriginality(evalData.score_originality);
          setScorePresentation(evalData.score_presentation);
          setEvalComments(evalData.comments || '');
          setEvalStatus('submitted');
        } else {
          setScoreScientific(8);
          setScoreOriginality(7);
          setScorePresentation(9);
          setEvalComments('');
          setEvalStatus('pending');
        }
      } catch (err) {
        console.error("Error loading evaluation:", err);
      }
    };

    const loadSystemReport = async () => {
      setLoadingSystemReport(true);
      try {
        const report = await fetchSystemReport(selectedSubmission.id);
        if (!active) return;
        setSystemReport(report);
      } finally {
        if (active) setLoadingSystemReport(false);
      }
    };

    const loadManuscriptFile = async () => {
      try {
        const blobUrl = await fetchEnvioArchivoBlobUrl(selectedSubmission.id);
        if (!active) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        setManuscriptUrl(blobUrl);
        localManuscriptBlobUrl = blobUrl;
      } catch (err) {
        console.error("Error loading manuscript blob:", err);
        if (active) {
          setManuscriptUrl(null);
        }
      }
    };

    const loadFilesFromOjs = async () => {
      if (!selectedSubmission.portal_url || !selectedSubmission.portal_api_key || !selectedSubmission.revista_path) {
        if (!active) return;
        setOjsFiles([]);
        setFileUrls({});
        setFileErrorMsg(null);
        return;
      }

      setLoadingFiles(true);
      if (active) {
        setFileUrls({});
        setFileErrorMsg(null);
      }
      try {
        const res = await fetchSubmissionFiles(
          selectedSubmission.portal_url,
          selectedSubmission.portal_api_key,
          selectedSubmission.revista_path,
          selectedSubmission.ojs_submission_id
        );
        if (!active) return;
        const filesList = res.items || res || [];
        setOjsFiles(filesList);

        // Resolve real OJS download URLs securely via Blob URLs
        const resolvedUrls: Record<string, string> = {};
        let hadError = false;
        let lastErrorMsg = '';

        for (const fileItem of filesList) {
          if (fileItem.url) {
            try {
              const blobUrl = await downloadFileAsBlobUrl(selectedSubmission.portal_api_key, fileItem.url);
              resolvedUrls[fileItem.id] = blobUrl;
            } catch (fileErr: any) {
              console.warn(`Could not load Blob URL for file #${fileItem.id}:`, fileErr);
              hadError = true;
              lastErrorMsg = fileErr.message || 'El rol actual no tiene acceso a esta operación en OJS.';
            }
          }
        }
        if (!active) {
          // Clean up resolved blob URLs if component changed selection
          Object.values(resolvedUrls).forEach(url => URL.revokeObjectURL(url));
          return;
        }
        setFileUrls(resolvedUrls);
        if (hadError) {
          setFileErrorMsg(lastErrorMsg);
        }
      } catch (err: any) {
        console.error("Error loading files from OJS:", err);
        if (active) {
          setOjsFiles([]);
          setFileErrorMsg(err.message || 'Error de conexión con OJS.');
        }
      } finally {
        if (active) setLoadingFiles(false);
      }
    };

    loadEvaluationData();
    loadManuscriptFile();
    loadFilesFromOjs();
    loadSystemReport();
    setActiveTab('info');

    return () => {
      active = false;
      if (localManuscriptBlobUrl) {
        URL.revokeObjectURL(localManuscriptBlobUrl);
      }
    };
  }, [selectedSubmission]);

  const averageScore = (scoreScientific + scoreOriginality + scorePresentation) / 3;
  const isApproved = averageScore >= 7;

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      await submitEvaluation({
        envioId: selectedSubmission.id,
        scoreScientific,
        scoreOriginality,
        scorePresentation,
        comments: evalComments,
        approved: isApproved
      });
      setEvalStatus('submitted');

      addLog('success', `Evaluación científica para el envío #${selectedSubmission.ojs_submission_id} enviada con éxito.`, {
        scoreScientific,
        scoreOriginality,
        scorePresentation,
        comments: evalComments,
        approved: isApproved
      });
    } catch (err: any) {
      alert(err.message || 'Error al enviar la calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Determina la fuente de previsualización para un tipo de archivo.
   * Para manuscritos (PDF): prioriza la URL local de Nova antes que OJS Blob URLs.
   */
  const getFilePreviewSource = (type: 'pdf' | 'video' | 'audio' | 'poster') => {
    if (type === 'pdf') {
      // Prioridad 1: Archivo subido a Nova (S3/local) — sin restricciones de OJS
      if (manuscriptUrl) return manuscriptUrl;
      // Prioridad 2: Blob URL de OJS (si está disponible)
      const pdfFile = ojsFiles.find(f =>
        f.genreId === 1 ||
        f.originalFilename?.toLowerCase().endsWith('.pdf') ||
        f.name?.es?.toLowerCase().endsWith('.pdf') ||
        f.name?.en?.toLowerCase().endsWith('.pdf')
      );
      if (pdfFile && fileUrls[pdfFile.id]) return fileUrls[pdfFile.id];
      return DEMO_FILES.pdf;
    }
    if (type === 'video') {
      const videoFile = ojsFiles.find(f =>
        f.originalFilename?.toLowerCase().endsWith('.mp4') ||
        f.name?.es?.toLowerCase().endsWith('.mp4') ||
        f.name?.en?.toLowerCase().endsWith('.mp4')
      );
      if (videoFile && fileUrls[videoFile.id]) return fileUrls[videoFile.id];
      return DEMO_FILES.video;
    }
    if (type === 'audio') {
      const audioFile = ojsFiles.find(f =>
        f.originalFilename?.toLowerCase().endsWith('.mp3') ||
        f.name?.es?.toLowerCase().endsWith('.mp3') ||
        f.name?.en?.toLowerCase().endsWith('.mp3')
      );
      if (audioFile && fileUrls[audioFile.id]) return fileUrls[audioFile.id];
      return DEMO_FILES.audio;
    }
    if (type === 'poster') {
      const posterFile = ojsFiles.find(f =>
        f.genreId === 3 ||
        f.originalFilename?.toLowerCase().endsWith('.jpg') ||
        f.originalFilename?.toLowerCase().endsWith('.png') ||
        f.name?.es?.toLowerCase().endsWith('.jpg') ||
        f.name?.es?.toLowerCase().endsWith('.png')
      );
      if (posterFile && fileUrls[posterFile.id]) return fileUrls[posterFile.id];
      return DEMO_FILES.poster;
    }
    return '';
  };

  return (
    <ReviewerContext.Provider value={{
      submissions,
      selectedSubmission,
      setSelectedSubmission,
      isLoading,
      isSubmitting,
      ojsFiles,
      loadingFiles,
      fileUrls,
      fileErrorMsg,
      activeTab,
      setActiveTab,
      scoreScientific,
      setScoreScientific,
      scoreOriginality,
      setScoreOriginality,
      scorePresentation,
      setScorePresentation,
      evalComments,
      setEvalComments,
      evalStatus,
      setEvalStatus,
      loadSubmissions,
      handleEvaluationSubmit,
      getFilePreviewSource,
      averageScore,
      isApproved,
      systemReport,
      loadingSystemReport,
      manuscriptUrl,
    }}>
      {children}
    </ReviewerContext.Provider>
  );
};
