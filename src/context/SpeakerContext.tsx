import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Submission, FileInfo, Contributor } from '../types';
import { DEFAULT_RESEARCH_LINES } from '../constants/data';

// ---- State shape ------------------------------------------------------------
interface SpeakerState {
  submissionTitle: string;
  submissionAbstract: string;
  submissionKeywords: string;
  contributors: Contributor[];
  submissionCategory: Submission['category'];
  audioFile: FileInfo | null;
  posterFile: FileInfo | null;
  abstractFile: FileInfo | null;
  manuscriptFile: FileInfo | null;
  videoFile: FileInfo | null;
  submissionStatus: Submission['status'];
  internalSubmissionId: number | undefined;
  ojsSubmissionId: number | undefined;
  ojsPublicationId: number | undefined;
  selectedCongressId: string;
  originalCongressId: string;
  selectedRevistaOjsId: number | undefined;
  originalRevistaOjsId?: number;
  originalRevistaOjsData?: { url: string; key: string; path: string };
  academicLevel: 'maestria' | 'doctorado' | 'otros';
  researchLine: string;
}

// ---- Actions ----------------------------------------------------------------
type SpeakerAction =
  | { type: 'SET_TITLE';           payload: string }
  | { type: 'SET_ABSTRACT';        payload: string }
  | { type: 'SET_KEYWORDS';        payload: string }
  | { type: 'SET_CONTRIBUTORS';    payload: Contributor[] | ((prev: Contributor[]) => Contributor[]) }
  | { type: 'SET_CATEGORY';        payload: Submission['category'] }
  | { type: 'SET_AUDIO_FILE';      payload: FileInfo | null | ((p: FileInfo | null) => FileInfo | null) }
  | { type: 'SET_POSTER_FILE';     payload: FileInfo | null | ((p: FileInfo | null) => FileInfo | null) }
  | { type: 'SET_ABSTRACT_FILE';   payload: FileInfo | null | ((p: FileInfo | null) => FileInfo | null) }
  | { type: 'SET_MANUSCRIPT_FILE'; payload: FileInfo | null | ((p: FileInfo | null) => FileInfo | null) }
  | { type: 'SET_VIDEO_FILE';      payload: FileInfo | null | ((p: FileInfo | null) => FileInfo | null) }
  | { type: 'SET_STATUS';          payload: Submission['status'] }
  | { type: 'SET_SUBMISSION_ID';   payload: number | undefined }
  | { type: 'SET_CONGRESS_ID';     payload: string }
  | { type: 'SET_REVISTA_OJS_ID';  payload: number | undefined }
  | { type: 'SET_ACADEMIC_LEVEL';  payload: 'maestria' | 'doctorado' | 'otros' }
  | { type: 'SET_RESEARCH_LINE';   payload: string }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: SpeakerState };

const EMPTY_CONTRIBUTOR: Contributor = {
  givenName: '',
  familyName: '',
  email: '',
  country: 'PA',
  affiliation: '',
};

const INITIAL_STATE: SpeakerState = {
  submissionTitle: '',
  submissionAbstract: '',
  submissionKeywords: '',
  contributors: [EMPTY_CONTRIBUTOR],
  submissionCategory: 'articulo',
  audioFile: null,
  posterFile: null,
  abstractFile: null,
  manuscriptFile: null,
  videoFile: null,
  submissionStatus: 'draft',
  internalSubmissionId: undefined,
  ojsSubmissionId: undefined,
  ojsPublicationId: undefined,
  selectedCongressId: '',
  originalCongressId: '',
  selectedRevistaOjsId: undefined,
  originalRevistaOjsId: undefined,
  originalRevistaOjsData: undefined,
  academicLevel: 'maestria',
  researchLine: DEFAULT_RESEARCH_LINES[0]?.name || '',
};

// ---- Reducer ----------------------------------------------------------------
function speakerReducer(state: SpeakerState, action: SpeakerAction): SpeakerState {
  switch (action.type) {
    case 'SET_TITLE':           return { ...state, submissionTitle: action.payload };
    case 'SET_ABSTRACT':        return { ...state, submissionAbstract: action.payload };
    case 'SET_KEYWORDS':        return { ...state, submissionKeywords: action.payload };
    case 'SET_CONTRIBUTORS': {
      const next = typeof action.payload === 'function'
        ? action.payload(state.contributors)
        : action.payload;
      return { ...state, contributors: next };
    }
    case 'SET_CATEGORY':        return { ...state, submissionCategory: action.payload };
    case 'SET_AUDIO_FILE': {
      const next = typeof action.payload === 'function'
        ? (action.payload as (p: FileInfo | null) => FileInfo | null)(state.audioFile)
        : action.payload;
      return { ...state, audioFile: next };
    }
    case 'SET_POSTER_FILE': {
      const next = typeof action.payload === 'function'
        ? (action.payload as (p: FileInfo | null) => FileInfo | null)(state.posterFile)
        : action.payload;
      return { ...state, posterFile: next };
    }
    case 'SET_ABSTRACT_FILE': {
      const next = typeof action.payload === 'function'
        ? (action.payload as (p: FileInfo | null) => FileInfo | null)(state.abstractFile)
        : action.payload;
      return { ...state, abstractFile: next };
    }
    case 'SET_MANUSCRIPT_FILE': {
      const next = typeof action.payload === 'function'
        ? (action.payload as (p: FileInfo | null) => FileInfo | null)(state.manuscriptFile)
        : action.payload;
      return { ...state, manuscriptFile: next };
    }
    case 'SET_VIDEO_FILE': {
      const next = typeof action.payload === 'function'
        ? (action.payload as (p: FileInfo | null) => FileInfo | null)(state.videoFile)
        : action.payload;
      return { ...state, videoFile: next };
    }
    case 'SET_STATUS':          return { ...state, submissionStatus: action.payload };
    case 'SET_SUBMISSION_ID':   return { ...state, internalSubmissionId: action.payload };
    case 'SET_CONGRESS_ID':     return { ...state, selectedCongressId: action.payload };
    case 'SET_REVISTA_OJS_ID':  return { ...state, selectedRevistaOjsId: action.payload };
    case 'SET_ACADEMIC_LEVEL':  return { ...state, academicLevel: action.payload };
    case 'SET_RESEARCH_LINE':   return { ...state, researchLine: action.payload };
    case 'RESET':               return INITIAL_STATE;
    case 'LOAD':                return { ...INITIAL_STATE, ...action.payload };
    default:                    return state;
  }
}

// ---- Context type (preserving the same public API for compatibility) --------
interface SpeakerContextType {
  submissionTitle: string;
  setSubmissionTitle: (val: string) => void;
  submissionAbstract: string;
  setSubmissionAbstract: (val: string) => void;
  submissionKeywords: string;
  setSubmissionKeywords: (val: string) => void;
  contributors: Contributor[];
  setContributors: React.Dispatch<React.SetStateAction<Contributor[]>>;
  submissionCategory: Submission['category'];
  setSubmissionCategory: (val: Submission['category']) => void;
  audioFile: FileInfo | null;
  setAudioFile: React.Dispatch<React.SetStateAction<FileInfo | null>>;
  posterFile: FileInfo | null;
  setPosterFile: React.Dispatch<React.SetStateAction<FileInfo | null>>;
  abstractFile: FileInfo | null;
  setAbstractFile: React.Dispatch<React.SetStateAction<FileInfo | null>>;
  manuscriptFile: FileInfo | null;
  setManuscriptFile: React.Dispatch<React.SetStateAction<FileInfo | null>>;
  videoFile: FileInfo | null;
  setVideoFile: React.Dispatch<React.SetStateAction<FileInfo | null>>;
  submissionStatus: Submission['status'];
  setSubmissionStatus: (val: Submission['status']) => void;
  resetSpeakerForm: () => void;
  internalSubmissionId: number | undefined;
  setInternalSubmissionId: (val: number | undefined) => void;
  ojsSubmissionId: number | undefined;
  ojsPublicationId: number | undefined;
  loadSubmission: (data: any) => void;
  selectedCongressId: string;
  originalCongressId: string;
  setSelectedCongressId: React.Dispatch<React.SetStateAction<string>>;
  selectedRevistaOjsId: number | undefined;
  setSelectedRevistaOjsId: (val: number | undefined) => void;
  originalRevistaOjsId?: number;
  originalRevistaOjsData?: { url: string; key: string; path: string };
  academicLevel: 'maestria' | 'doctorado' | 'otros';
  setAcademicLevel: (val: 'maestria' | 'doctorado' | 'otros') => void;
  researchLine: string;
  setResearchLine: (val: string) => void;
}

const SpeakerContext = createContext<SpeakerContextType | undefined>(undefined);

// ---- Provider ---------------------------------------------------------------
export const SpeakerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(speakerReducer, INITIAL_STATE);

  // Stable setters (useCallback so referential equality is preserved)
  const setSubmissionTitle   = useCallback((v: string) => dispatch({ type: 'SET_TITLE', payload: v }), []);
  const setSubmissionAbstract= useCallback((v: string) => dispatch({ type: 'SET_ABSTRACT', payload: v }), []);
  const setSubmissionKeywords= useCallback((v: string) => dispatch({ type: 'SET_KEYWORDS', payload: v }), []);
  const setContributors      = useCallback((v: Contributor[] | ((p: Contributor[]) => Contributor[])) =>
    dispatch({ type: 'SET_CONTRIBUTORS', payload: v }), []);
  const setSubmissionCategory= useCallback((v: Submission['category']) => dispatch({ type: 'SET_CATEGORY', payload: v }), []);
  const setAudioFile         = useCallback((v: FileInfo | null | ((p: FileInfo | null) => FileInfo | null)) =>
    dispatch({ type: 'SET_AUDIO_FILE', payload: v as FileInfo | null }), []);
  const setPosterFile        = useCallback((v: FileInfo | null | ((p: FileInfo | null) => FileInfo | null)) =>
    dispatch({ type: 'SET_POSTER_FILE', payload: v as FileInfo | null }), []);
  const setAbstractFile      = useCallback((v: FileInfo | null | ((p: FileInfo | null) => FileInfo | null)) =>
    dispatch({ type: 'SET_ABSTRACT_FILE', payload: v as FileInfo | null }), []);
  const setManuscriptFile    = useCallback((v: FileInfo | null | ((p: FileInfo | null) => FileInfo | null)) =>
    dispatch({ type: 'SET_MANUSCRIPT_FILE', payload: v as FileInfo | null }), []);
  const setVideoFile         = useCallback((v: FileInfo | null | ((p: FileInfo | null) => FileInfo | null)) =>
    dispatch({ type: 'SET_VIDEO_FILE', payload: v as FileInfo | null }), []);
  const setSubmissionStatus  = useCallback((v: Submission['status']) => dispatch({ type: 'SET_STATUS', payload: v }), []);
  const setInternalSubmissionId = useCallback((v: number | undefined) =>
    dispatch({ type: 'SET_SUBMISSION_ID', payload: v }), []);
  const setSelectedCongressId= useCallback((v: string | ((p: string) => string)) => {
    const next = typeof v === 'function' ? v(state.selectedCongressId) : v;
    dispatch({ type: 'SET_CONGRESS_ID', payload: next });
  }, [state.selectedCongressId]);
  const setSelectedRevistaOjsId = useCallback((v: number | undefined) =>
    dispatch({ type: 'SET_REVISTA_OJS_ID', payload: v }), []);
  const setAcademicLevel     = useCallback((v: 'maestria' | 'doctorado' | 'otros') => dispatch({ type: 'SET_ACADEMIC_LEVEL', payload: v }), []);
  const setResearchLine      = useCallback((v: string) => dispatch({ type: 'SET_RESEARCH_LINE', payload: v }), []);
  const resetSpeakerForm     = useCallback(() => dispatch({ type: 'RESET' }), []);

  const loadSubmission = useCallback((data: any) => {
    let contributors: Contributor[] = [EMPTY_CONTRIBUTOR];
    try {
      if (data.colaboradores?.startsWith('[')) {
        const parsed = JSON.parse(data.colaboradores);
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          contributors = parsed.map((name: string) => ({ ...EMPTY_CONTRIBUTOR, givenName: name }));
        } else if (parsed.length > 0 && typeof parsed[0] === 'object') {
          contributors = parsed;
        }
      } else if (data.colaboradores) {
        contributors = [{ ...EMPTY_CONTRIBUTOR, givenName: data.colaboradores }];
      }
    } catch { /* keep default */ }

    dispatch({
      type: 'LOAD',
      payload: {
        ...INITIAL_STATE,
        internalSubmissionId: data.id,
        ojsSubmissionId: data.ojs_submission_id,
        ojsPublicationId: data.ojs_publication_id,
        selectedCongressId: data.congreso_id ? String(data.congreso_id) : '',
        originalCongressId: data.congreso_id ? String(data.congreso_id) : '',
        selectedRevistaOjsId: data.revista_ojs_id || undefined,
        originalRevistaOjsId: data.revista_ojs_id || undefined,
        originalRevistaOjsData: data.portal_url && data.portal_api_key && data.revista_path ? {
          url: data.portal_url,
          key: data.portal_api_key,
          path: data.revista_path
        } : undefined,
        submissionTitle: data.titulo_articulo || '',
        submissionAbstract: data.resumen || '',
        submissionKeywords: data.palabras_claves || '',
        submissionCategory: (data.categoria as Submission['category']) || 'articulo',
        contributors,
        academicLevel: (data.nivel_academico as any) || 'maestria',
        researchLine: data.linea_investigacion || (DEFAULT_RESEARCH_LINES[0]?.name || ''),
      },
    });
  }, []);

  const value: SpeakerContextType = {
    submissionTitle: state.submissionTitle,
    setSubmissionTitle,
    submissionAbstract: state.submissionAbstract,
    setSubmissionAbstract,
    submissionKeywords: state.submissionKeywords,
    setSubmissionKeywords,
    contributors: state.contributors,
    setContributors: setContributors as React.Dispatch<React.SetStateAction<Contributor[]>>,
    submissionCategory: state.submissionCategory,
    setSubmissionCategory,
    audioFile: state.audioFile,
    setAudioFile: setAudioFile as React.Dispatch<React.SetStateAction<FileInfo | null>>,
    posterFile: state.posterFile,
    setPosterFile: setPosterFile as React.Dispatch<React.SetStateAction<FileInfo | null>>,
    abstractFile: state.abstractFile,
    setAbstractFile: setAbstractFile as React.Dispatch<React.SetStateAction<FileInfo | null>>,
    manuscriptFile: state.manuscriptFile,
    setManuscriptFile: setManuscriptFile as React.Dispatch<React.SetStateAction<FileInfo | null>>,
    videoFile: state.videoFile,
    setVideoFile: setVideoFile as React.Dispatch<React.SetStateAction<FileInfo | null>>,
    submissionStatus: state.submissionStatus,
    setSubmissionStatus,
    internalSubmissionId: state.internalSubmissionId,
    setInternalSubmissionId,
    ojsSubmissionId: state.ojsSubmissionId,
    ojsPublicationId: state.ojsPublicationId,
    selectedCongressId: state.selectedCongressId,
    originalCongressId: state.originalCongressId,
    setSelectedCongressId: setSelectedCongressId as React.Dispatch<React.SetStateAction<string>>,
    selectedRevistaOjsId: state.selectedRevistaOjsId,
    setSelectedRevistaOjsId,
    originalRevistaOjsId: state.originalRevistaOjsId,
    originalRevistaOjsData: state.originalRevistaOjsData,
    academicLevel: state.academicLevel,
    setAcademicLevel,
    researchLine: state.researchLine,
    setResearchLine,
    resetSpeakerForm,
    loadSubmission,
  };

  return <SpeakerContext.Provider value={value}>{children}</SpeakerContext.Provider>;
};

export const useSpeaker = () => {
  const context = useContext(SpeakerContext);
  if (!context) throw new Error('useSpeaker must be used within a SpeakerProvider');
  return context;
};
