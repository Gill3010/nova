import React, { createContext, useContext, useState } from 'react';

export type RoleType = 'admin_org' | 'ponente' | 'asistente' | 'revisor_eval';

interface UserRoleContextType {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<RoleType>('admin_org');

  return (
    <UserRoleContext.Provider value={{ activeRole, setActiveRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
