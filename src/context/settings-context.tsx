


"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useData } from './data-context';

interface PageDashboard {
    nav_dashboard: string;
    nav_settings: string;
}

interface PageOverview {
    financial_overview_title: string;
    financial_overview_description: string;
}

interface PageSettings {
    title: string;
    property_details: {
        title: string;
        description: string;
        house_name_label: string;
        house_address_label: string;
    };
    app_settings: {
        title: string;
        description: string;
        header_name_label: string;
        footer_name_label: string;
    };
    overview_settings: {
        title: string;
        description: string;
        financial_title_label: string;
        financial_description_label: string;
    };
}

interface TabNames {
    overview: string;
    tenants: string;
    work: string;
    integrations: string;
    reports: string;
    zakat: string;
}

interface AppSettings {
  appName: string;
  houseName: string;
  houseAddress: string;
  bankName: string;
  bankAccountNumber: string;
  zakatBankName: string;
  zakatBankAccountNumber: string;
  houseImages: string[];
  footerName: string;
  tabNames: TabNames;
  page_dashboard: PageDashboard;
  page_overview: PageOverview;
  page_settings: PageSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  loading: boolean;
  refreshSettings: () => void;
}

const defaultSettings: AppSettings = {
    appName: "RentFlow",
    houseName: "Sunset Apartments",
    houseAddress: "123 Ocean View Drive, Miami, FL 33139",
    bankName: "",
    bankAccountNumber: "",
    zakatBankName: "",
    zakatBankAccountNumber: "",
    houseImages: [],
    footerName: "© 2024 RentFlow. All Rights Reserved.",
    tabNames: {
        overview: "Overview",
        tenants: "Tenants",
        work: "Work",
        integrations: "Integrations",
        reports: "Reports",
        zakat: "Zakat",
    },
    page_dashboard: {
        nav_dashboard: "Dashboard",
        nav_settings: "Settings",
    },
    page_overview: {
        financial_overview_title: "Financial Overview",
        financial_overview_description: "A summary of your income and expenses for the month.",
    },
    page_settings: {
        title: "Settings",
        property_details: {
            title: "Property & Bank Details",
            description: "Set your property and bank details. This is stored in the database.",
            house_name_label: "House Name",
            house_address_label: "House Address",
        },
        app_settings: {
            title: "Application Settings",
            description: "Customize the names and labels used throughout the application. These are saved in your browser.",
            header_name_label: "Header Name",
            footer_name_label: "Footer Name",
        },
        overview_settings: {
            title: "Overview Page Settings",
            description: "Customize the text on the monthly overview page. These are saved in your browser.",
            financial_title_label: "Financial Overview Title",
            financial_description_label: "Financial Overview Description",
        },
    },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const deepMerge = (target: any, source: any) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key]) && key in target) {
                 output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

const isObject = (item: any) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
}


export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isMounted, setIsMounted] = useState(false);
    const { propertySettings, loading: dataLoading, refreshData } = useData();
    
    const loadDBSettings = useCallback(() => {
        if (!dataLoading && propertySettings) {
             setSettings(prev => ({
                ...prev,
                houseName: propertySettings.house_name || prev.houseName,
                houseAddress: propertySettings.house_address || prev.houseAddress,
                bankName: propertySettings.bank_name || prev.bankName,
                bankAccountNumber: propertySettings.bank_account_number || prev.bankAccountNumber,
                zakatBankName: propertySettings.zakat_bank_name || prev.zakatBankName,
                zakatBankAccountNumber: propertySettings.zakat_bank_account_number || prev.zakatBankAccountNumber,
                houseImages: propertySettings.house_images || [],
            }));
        }
    }, [propertySettings, dataLoading]);

    const refreshSettings = useCallback(() => {
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        setIsMounted(true);
        try {
            const item = window.localStorage.getItem('appSettings');
            if (item) {
                const storedSettings = JSON.parse(item);
                setSettings(prev => deepMerge(prev, storedSettings));
            }
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
        }
    }, []);

    useEffect(() => {
      loadDBSettings();
    }, [loadDBSettings]);
    
    useEffect(() => {
        if (isMounted) {
            const { houseName, houseAddress, bankName, bankAccountNumber, zakatBankName, zakatBankAccountNumber, houseImages, ...localSettings } = settings;
            try {
                window.localStorage.setItem('appSettings', JSON.stringify(localSettings));
            } catch (error) {
                console.error("Failed to save settings to localStorage", error);
            }
        }
    }, [settings, isMounted]);

    const loading = !isMounted || dataLoading;

    const value = {
        settings,
        setSettings,
        loading,
        refreshSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
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
