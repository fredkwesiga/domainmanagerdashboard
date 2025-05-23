// context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Initialize userPermissions from localStorage or use default
  const [userPermissions, setUserPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem('userPermissions');
    return storedPermissions
      ? JSON.parse(storedPermissions)
      : {
          dashboard: true,
          domains: false,
          packages: false,
          expiringDomains: false,
          expiredDomains: false,
          hosting: false,
          subscriptions: false,
          birthdays: false,
          expenseSync: false,
          settings: false,
        };
  });

  // Sync userPermissions with localStorage changes
  useEffect(() => {
    console.log('UserContext: Initializing userPermissions:', userPermissions);
  }, []);

  const updatePermissions = (newPermissions) => {
    console.log('UserContext: Updating permissions:', newPermissions);
    setUserPermissions(newPermissions);
    localStorage.setItem('userPermissions', JSON.stringify(newPermissions));
  };

  return (
    <UserContext.Provider value={{ userPermissions, updatePermissions }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};