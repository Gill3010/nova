import React, { createContext, useContext, useState } from 'react';
import type { Submission, FileInfo, Contributor } from '../types';

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
  loadSubmission: (data: any) => void;
  selectedCongressId: string;
  setSelectedCongressId: React.Dispatch<React.SetStateAction<string>>;
}

const SpeakerContext = createContext<SpeakerContextType | undefined>(undefined);

export const SpeakerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionAbstract, setSubmissionAbstract] = useState('');
  const [submissionKeywords, setSubmissionKeywords] = useState('');
  const [contributors, setContributors] = useState<Contributor[]>([
    { givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }
  ]);
  const [submissionCategory, setSubmissionCategory] = useState<Submission['category']>('articulo');
  const [audioFile, setAudioFile] = useState<FileInfo | null>(null);
  const [posterFile, setPosterFile] = useState<FileInfo | null>(null);
  const [abstractFile, setAbstractFile] = useState<FileInfo | null>(null);
  const [manuscriptFile, setManuscriptFile] = useState<FileInfo | null>(null);
  const [videoFile, setVideoFile] = useState<FileInfo | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<Submission['status']>('draft');
  const [internalSubmissionId, setInternalSubmissionId] = useState<number | undefined>(undefined);
  const [selectedCongressId, setSelectedCongressId] = useState<string>('');

  const resetSpeakerForm = () => {
    setInternalSubmissionId(undefined);
    setSubmissionTitle('');
    setSubmissionAbstract('');
    setSubmissionKeywords('');
    setContributors([{ givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }]);
    setSubmissionCategory('articulo');
    setAudioFile(null);
    setPosterFile(null);
    setAbstractFile(null);
    setManuscriptFile(null);
    setVideoFile(null);
    setSubmissionStatus('draft');
    setSelectedCongressId('');
  };

  const loadSubmission = (data: any) => {
    setInternalSubmissionId(data.id);
    if (data.congreso_id) setSelectedCongressId(data.congreso_id.toString());
    setSubmissionTitle(data.titulo_articulo || '');
    setSubmissionAbstract(''); // Assuming abstract isn't loaded back for now
    setSubmissionKeywords(data.palabras_claves || '');
    setSubmissionCategory((data.categoria as any) || 'articulo');
    try {
      if (data.colaboradores && data.colaboradores.startsWith('[')) {
        const parsed = JSON.parse(data.colaboradores);
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          // Fallback for old data where we saved an array of strings
          setContributors(parsed.map((name: string) => ({ givenName: name, familyName: '', email: '', country: 'PA', affiliation: '' })));
        } else if (parsed.length > 0 && typeof parsed[0] === 'object') {
          // New format: full objects
          setContributors(parsed);
        } else {
          setContributors([{ givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }]);
        }
      } else if (data.colaboradores) {
        setContributors([{ givenName: data.colaboradores, familyName: '', email: '', country: 'PA', affiliation: '' }]);
      } else {
        setContributors([{ givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }]);
      }
    } catch (e) {
      setContributors([{ givenName: '', familyName: '', email: '', country: 'PA', affiliation: '' }]);
    }
  };

  return (
    <SpeakerContext.Provider
      value={{
        submissionTitle,
        setSubmissionTitle,
        submissionAbstract,
        setSubmissionAbstract,
        submissionKeywords,
        setSubmissionKeywords,
        contributors,
        setContributors,
        submissionCategory,
        setSubmissionCategory,
        audioFile,
        setAudioFile,
        posterFile,
        setPosterFile,
        abstractFile,
        setAbstractFile,
        manuscriptFile,
        setManuscriptFile,
        videoFile,
        setVideoFile,
        submissionStatus,
        setSubmissionStatus,
        internalSubmissionId,
        setInternalSubmissionId,
        selectedCongressId,
        setSelectedCongressId,
        resetSpeakerForm,
        loadSubmission
      }}
    >
      {children}
    </SpeakerContext.Provider>
  );
};

export const useSpeaker = () => {
  const context = useContext(SpeakerContext);
  if (!context) {
    throw new Error('useSpeaker must be used within a SpeakerProvider');
  }
  return context;
};
