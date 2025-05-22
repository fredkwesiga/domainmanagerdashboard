import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const defaultPermissions = {
    dashboard: true,
    domains: false,
    hosting: false,
    subscriptions: false,
    birthdays: false,
    expenseSync: false,
    settings: false,
  };

  // Validate and initialize permissions from localStorage
  const storedPermissions = JSON.parse(localStorage.getItem('userPermissions')) || defaultPermissions;
  const initialPermissions = {
    ...defaultPermissions,
    ...Object.fromEntries(
      Object.entries(storedPermissions).filter(([key]) => Object.keys(defaultPermissions).includes(key))
    ),
  };

  console.log('UserContext: Initialized permissions:', initialPermissions);

  const [userPermissions, setUserPermissions] = useState(initialPermissions);

  const updatePermissions = (newPermissions) => {
    const validatedPermissions = {
      ...defaultPermissions,
      ...Object.fromEntries(
        Object.entries(newPermissions).filter(([key]) => Object.keys(defaultPermissions).includes(key))
      ),
    };
    console.log('UserContext: Updating permissions to', validatedPermissions);
    setUserPermissions(validPermissions);
    localStorage.setItem('userPermissions', JSON.stringify(validPermissions));
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