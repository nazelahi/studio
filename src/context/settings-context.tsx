"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TabNames {
    overview: string;
    tenants: string;
    whatsapp: string;
    reports: string;
}

interface AppSettings {
  appName: string;
  tabNames: TabNames;
  footerName: string;
}

interface SettingsContextType {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const defaultSettings: AppSettings = {
    appName: "RentFlow",
    tabNames: {
        overview: "Overview",
        tenants: "Tenants",
        whatsapp: "WhatsApp",
        reports: "Reports",
    },
    footerName: "© 2024 RentFlow. All Rights Reserved.",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(() => {
        if (typeof window === 'undefined') {
            return defaultSettings;
        }
        try {
            const item = window.localStorage.getItem('appSettings');
            return item ? JSON.parse(item) : defaultSettings;
        } catch (error) {
            console.error(error);
            return defaultSettings;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('appSettings', JSON.stringify(settings));
        } catch (error) {
            console.error(error);
        }
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
