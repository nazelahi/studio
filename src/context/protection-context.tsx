
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { LoginDialog } from '@/components/login-dialog';
import { useToast } from '@/hooks/use-toast';

interface ProtectionContextType {
  withProtection: (action: () => void, event?: React.MouseEvent) => void;
}

const ProtectionContext = createContext<ProtectionContextType | undefined>(undefined);

export function ProtectionProvider({ children }: { children: ReactNode }) {
    const { isAdmin } = useAuth();
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    const { toast } = useToast();
    
    const withProtection = useCallback((action: () => void, event?: React.MouseEvent) => {
        if(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (isAdmin) {
            action();
        } else {
            setIsLoginDialogOpen(true);
            toast({
                title: "Admin Access Required",
                description: "Please log in to perform this action.",
                variant: "destructive"
            })
        }
    }, [isAdmin, toast]);

    const value = { withProtection };

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
