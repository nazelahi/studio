
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProtection } from './protection-context';

interface AuthContextType {
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isUnlocked } = useProtection();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isUnlocked);
  }, [isUnlocked]);
  
  const value = { isAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
