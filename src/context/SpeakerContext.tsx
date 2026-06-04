import React, { createContext, useContext, useState } from 'react';
import type { Submission, FileInfo } from '../types';

interface SpeakerContextType {
  submissionTitle: string;
  setSubmissionTitle: (val: string) => void;
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
}

const SpeakerContext = createContext<SpeakerContextType | undefined>(undefined);

export const SpeakerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [submissionTitle, setSubmissionTitle] = useState(
    'Análisis comparativo de algoritmos de Machine Learning aplicados a la medicina de precisión'
  );
  const [submissionCategory, setSubmissionCategory] = useState<Submission['category']>('articulo');
  const [audioFile, setAudioFile] = useState<FileInfo | null>(null);
  const [posterFile, setPosterFile] = useState<FileInfo | null>(null);
  const [abstractFile, setAbstractFile] = useState<FileInfo | null>(null);
  const [manuscriptFile, setManuscriptFile] = useState<FileInfo | null>(null);
  const [videoFile, setVideoFile] = useState<FileInfo | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<Submission['status']>('draft');

  return (
    <SpeakerContext.Provider
      value={{
        submissionTitle,
        setSubmissionTitle,
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
