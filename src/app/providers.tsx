import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CongressProvider } from '../context/CongressContext';
import { SpeakerProvider } from '../context/SpeakerContext';
import { OjsProvider } from '../context/OjsContext';

const ProtectedProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <>{children}</>;
  return (
    <CongressProvider key={`congress-${user.id}`}>
      <SpeakerProvider key={`speaker-${user.id}`}>
        <OjsProvider key={`ojs-${user.id}`}>
          {children}
        </OjsProvider>
      </SpeakerProvider>
    </CongressProvider>
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ProtectedProviders>
        {children}
      </ProtectedProviders>
    </AuthProvider>
  );
};
