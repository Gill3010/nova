import React, { createContext, useContext } from 'react';
import { useOjsIntegration } from '../hooks/useOjsIntegration';

type OjsContextType = ReturnType<typeof useOjsIntegration>;

const OjsContext = createContext<OjsContextType | undefined>(undefined);

export const OjsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useOjsIntegration();
  return (
    <OjsContext.Provider value={value}>
      {children}
    </OjsContext.Provider>
  );
};

export const useOjs = () => {
  const context = useContext(OjsContext);
  if (!context) {
    throw new Error('useOjs must be used within an OjsProvider');
  }
  return context;
};
