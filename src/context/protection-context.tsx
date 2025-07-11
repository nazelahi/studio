"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { PasscodeDialog } from '@/components/passcode-dialog';

interface ProtectionContextType {
  isUnlocked: boolean;
  withProtection: (action: () => void, event?: React.MouseEvent) => void;
}

const ProtectionContext = createContext<ProtectionContextType | undefined>(undefined);

export function ProtectionProvider({ children }: { children: ReactNode }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const withProtection = useCallback((action: () => void, event?: React.MouseEvent) => {
        if(event) {
            // This is needed to stop some actions from proceeding in ShadCN components like AlertDialogTrigger
            event.preventDefault();
            event.stopPropagation();
        }

        if (isUnlocked) {
            action();
        } else {
            setPendingAction(() => action);
            setIsPasscodeDialogOpen(true);
        }
    }, [isUnlocked]);

    const handleSuccess = () => {
        setIsUnlocked(true);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const value = { isUnlocked, withProtection };

    return (
        <ProtectionContext.Provider value={value}>
            {children}
            <PasscodeDialog
                isOpen={isPasscodeDialogOpen}
                onOpenChange={setIsPasscodeDialogOpen}
                onSuccess={handleSuccess}
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
