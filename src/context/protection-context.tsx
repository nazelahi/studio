
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { LoginDialog } from '@/components/login-dialog';

interface ProtectionContextType {
  isUnlocked: boolean;
  withProtection: (action: () => void, event?: React.MouseEvent) => void;
}

const ProtectionContext = createContext<ProtectionContextType | undefined>(undefined);

export function ProtectionProvider({ children }: { children: ReactNode }) {
    const { isAdmin } = useAuth();
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    
    // The action should only be triggered if the user is an admin.
    // If not, we prompt them to log in.
    const withProtection = useCallback((action: () => void, event?: React.MouseEvent) => {
        if(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (isAdmin) {
            action();
        } else {
            setIsLoginDialogOpen(true);
        }
    }, [isAdmin]);

    // isUnlocked is now directly tied to the isAdmin state from the AuthContext.
    const value = { isUnlocked: isAdmin, withProtection };

    return (
        <ProtectionContext.Provider value={value}>
            {children}
            <LoginDialog 
                isOpen={isLoginDialogOpen}
                onOpenChange={setIsLoginDialogOpen}
            />
        </ProtectionContext.Provider>
    );
}

export function useProtection() {
  const context = useContext(ProtectionContext);
  if (context === undefined) {
    throw new Error('useProtection must be used within a ProtectionProvider');
  }
  return context;
}
