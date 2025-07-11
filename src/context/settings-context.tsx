
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
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const item = window.localStorage.getItem('appSettings');
            if (item) {
                const storedSettings = JSON.parse(item);
                // Ensure all keys are present, falling back to default
                setSettings({
                    ...defaultSettings,
                    ...storedSettings,
                    tabNames: {
                        ...defaultSettings.tabNames,
                        ...storedSettings.tabNames,
                    }
                });
            }
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
        }
    }, []);
    
    useEffect(() => {
        if (isMounted) {
            try {
                window.localStorage.setItem('appSettings', JSON.stringify(settings));
            } catch (error) {
                console.error("Failed to save settings to localStorage", error);
            }
        }
    }, [settings, isMounted]);

    if (!isMounted) {
        // Render with default settings on the server and during initial client render
        // to avoid hydration mismatch. You can optionally render a loading skeleton here.
        return (
            <SettingsContext.Provider value={{ settings: defaultSettings, setSettings }}>
                {children}
            </SettingsContext.Provider>
        );
    }

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
