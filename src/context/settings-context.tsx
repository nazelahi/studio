
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useData } from './data-context';
import type { ZakatBankDetail, PropertySettings as DbPropertySettings } from '@/types';

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

interface AppSettings {
  appName: string;
  houseName: string;
  houseAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankLogoUrl?: string;
  ownerName?: string;
  ownerPhotoUrl?: string;
  zakatBankDetails: ZakatBankDetail[];
  footerName: string;
  tabNames: TabNames;
  page_dashboard: PageDashboard;
  page_overview: PageOverview;
  page_settings: PageSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  setSettings: (newSettings: AppSettings) => void;
  loading: boolean;
  refreshSettings: () => void;
}

const defaultSettings: AppSettings = {
    appName: "RentFlow",
    houseName: "Property Name",
    houseAddress: "Property Address",
    bankName: "",
    bankAccountNumber: "",
    bankLogoUrl: undefined,
    ownerName: "Owner Name",
    ownerPhotoUrl: undefined,
    zakatBankDetails: [],
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
            title: "Overview Settings",
            description: "Customize the text on the monthly overview page. These are saved in your browser.",
            financial_title_label: "Financial Overview Title",
            financial_description_label: "Financial Overview Description",
        },
    },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const isObject = (item: any) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

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

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isMounted, setIsMounted] = useState(false);
    const { propertySettings, zakatBankDetails, loading: dataLoading, refreshData } = useData();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            let localSettings = {};
            try {
                const item = window.localStorage.getItem('appSettings');
                if (item) {
                    localSettings = JSON.parse(item);
                }
            } catch (error) {
                console.error("Failed to parse settings from localStorage", error);
            }

            const combinedSettings = deepMerge(defaultSettings, localSettings);

            if (propertySettings) {
                combinedSettings.houseName = propertySettings.house_name || defaultSettings.houseName;
                combinedSettings.houseAddress = propertySettings.house_address || defaultSettings.houseAddress;
                combinedSettings.bankName = propertySettings.bank_name || defaultSettings.bankName;
                combinedSettings.bankAccountNumber = propertySettings.bank_account_number || defaultSettings.bankAccountNumber;
                combinedSettings.bankLogoUrl = propertySettings.bank_logo_url || defaultSettings.bankLogoUrl;
                combinedSettings.ownerName = propertySettings.owner_name || defaultSettings.ownerName;
                combinedSettings.ownerPhotoUrl = propertySettings.owner_photo_url || defaultSettings.ownerPhotoUrl;
            }
            
            combinedSettings.zakatBankDetails = zakatBankDetails || [];

            setSettings(combinedSettings);
        }
    }, [isMounted, propertySettings, zakatBankDetails]);


    const handleSetSettings = (newSettings: AppSettings) => {
        const { 
            houseName, houseAddress, bankName, bankAccountNumber, bankLogoUrl, ownerName, ownerPhotoUrl, zakatBankDetails, 
            ...localSettingsToSave 
        } = newSettings;
        try {
            const currentLocal = JSON.parse(window.localStorage.getItem('appSettings') || '{}');
            const newLocal = deepMerge(currentLocal, localSettingsToSave);
            window.localStorage.setItem('appSettings', JSON.stringify(newLocal));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }

        setSettings(newSettings);
    };

    const value = {
        settings,
        setSettings: handleSetSettings,
        loading: !isMounted || dataLoading,
        refreshSettings: refreshData,
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
