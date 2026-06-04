import React, { createContext, useContext } from 'react';
import { useCongressForm } from '../hooks/useCongressForm';

type CongressContextType = ReturnType<typeof useCongressForm>;

const CongressContext = createContext<CongressContextType | undefined>(undefined);

export const CongressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useCongressForm();
  return (
    <CongressContext.Provider value={value}>
      {children}
    </CongressContext.Provider>
  );
};

export const useCongress = () => {
  const context = useContext(CongressContext);
  if (!context) {
    throw new Error('useCongress must be used within a CongressProvider');
  }
  return context;
};
