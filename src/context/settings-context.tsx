

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useData } from './data-context';
import type { ZakatBankDetail, PropertySettings as DbPropertySettings, TabNames } from '@/types';

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
    };
    overview_settings: {
        title: string;
        description: string;
        financial_title_label: string;
        financial_description_label: string;
    };
}

interface AppTheme {
    colors: {
        primary: string;
        table_header_background: string;
        table_header_foreground: string;
        table_footer_background: string;
        mobile_nav_background: string;
        mobile_nav_foreground: string;
    };
}

interface AppSettings {
  houseName: string;
  houseAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankLogoUrl?: string;
  ownerName?: string;
  ownerPhotoUrl?: string;
  passcode?: string;
  passcodeProtectionEnabled: boolean;
  zakatBankDetails: ZakatBankDetail[];
  footerName: string;
  tabNames: TabNames;
  theme: AppTheme;
  page_dashboard: PageDashboard;
  page_overview: PageOverview;
  page_settings: PageSettings;
  aboutUs?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  whatsappRemindersEnabled?: boolean;
  whatsappReminderSchedule?: string[];
  whatsappReminderTemplate?: string;
  tenantViewStyle: 'grid' | 'list';
  metadataTitle?: string;
  faviconUrl?: string;
}

interface SettingsContextType {
  settings: AppSettings;
  setSettings: (newSettings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  loading: boolean;
  refreshSettings: () => void;
}

const defaultSettings: AppSettings = {
    houseName: "RentFlow",
    houseAddress: "Property Address",
    bankName: "",
    bankAccountNumber: "",
    bankLogoUrl: undefined,
    ownerName: "Owner Name",
    ownerPhotoUrl: undefined,
    passcode: "",
    passcodeProtectionEnabled: true,
    zakatBankDetails: [],
    footerName: "© 2024 RentFlow. All Rights Reserved.",
    aboutUs: "Your trusted partner in property management. Providing seamless rental experiences.",
    contactPhone: "+1 (555) 123-4567",
    contactEmail: "contact@rentflow.com",
    contactAddress: "123 Property Lane, Real Estate City, 12345",
    whatsappRemindersEnabled: false,
    whatsappReminderSchedule: ['before', 'on', 'after'],
    whatsappReminderTemplate: "Hi {tenantName}, a friendly reminder that your rent of ৳{rentAmount} for {property} is due on {dueDate}. Thank you!",
    tenantViewStyle: 'grid',
    metadataTitle: "RentFlow",
    faviconUrl: "/favicon.ico",
    tabNames: {
        overview: "Overview",
        tenants: "Tenants",
        work: "Work",
        reports: "Reports",
        zakat: "Zakat",
    },
    theme: {
        colors: {
            primary: '#14b8a6', // teal-500
            table_header_background: '#14b8a6',
            table_header_foreground: '#ffffff',
            table_footer_background: '#84cc16', // lime-500
            mobile_nav_background: '#008080',
            mobile_nav_foreground: '#ffffff',
        }
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
            if (isObject(source[key]) && key in target && isObject(target[key])) {
                 output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

const hexToHsl = (hex: string): string => {
    if (!hex || typeof hex !== 'string') return '0 0% 0%';
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

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
                combinedSettings.passcode = propertySettings.passcode || defaultSettings.passcode;
                combinedSettings.passcodeProtectionEnabled = propertySettings.passcode_protection_enabled ?? defaultSettings.passcodeProtectionEnabled;
                combinedSettings.aboutUs = propertySettings.about_us || defaultSettings.aboutUs;
                combinedSettings.contactPhone = propertySettings.contact_phone || defaultSettings.contactPhone;
                combinedSettings.contactEmail = propertySettings.contact_email || defaultSettings.contactEmail;
                combinedSettings.contactAddress = propertySettings.contact_address || defaultSettings.contactAddress;
                combinedSettings.footerName = propertySettings.footer_name || defaultSettings.footerName;
                combinedSettings.tenantViewStyle = propertySettings.tenant_view_style || defaultSettings.tenantViewStyle;
                combinedSettings.metadataTitle = propertySettings.metadata_title || defaultSettings.metadataTitle;
                combinedSettings.faviconUrl = propertySettings.favicon_url || defaultSettings.faviconUrl;

                // Load theme from DB
                combinedSettings.theme.colors.primary = propertySettings.theme_primary || defaultSettings.theme.colors.primary;
                combinedSettings.theme.colors.table_header_background = propertySettings.theme_table_header_background || defaultSettings.theme.colors.table_header_background;
                combinedSettings.theme.colors.table_header_foreground = propertySettings.theme_table_header_foreground || defaultSettings.theme.colors.table_header_foreground;
                combinedSettings.theme.colors.table_footer_background = propertySettings.theme_table_footer_background || defaultSettings.theme.colors.table_footer_background;
                combinedSettings.theme.colors.mobile_nav_background = propertySettings.theme_mobile_nav_background || defaultSettings.theme.colors.mobile_nav_background;
                combinedSettings.theme.colors.mobile_nav_foreground = propertySettings.theme_mobile_nav_foreground || defaultSettings.theme.colors.mobile_nav_foreground;

                // Load WhatsApp settings from DB
                combinedSettings.whatsappRemindersEnabled = propertySettings.whatsapp_reminders_enabled ?? defaultSettings.whatsappRemindersEnabled;
                combinedSettings.whatsappReminderSchedule = propertySettings.whatsapp_reminder_schedule || defaultSettings.whatsappReminderSchedule;
                combinedSettings.whatsappReminderTemplate = propertySettings.whatsapp_reminder_template || defaultSettings.whatsappReminderTemplate;

            }
            
            combinedSettings.zakatBankDetails = zakatBankDetails || [];

            setSettings(combinedSettings);
        }
    }, [isMounted, propertySettings, zakatBankDetails]);


    const handleSetSettings = (newSettingsOrFn: AppSettings | ((prev: AppSettings) => AppSettings)) => {
        const newSettings = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(settings) : newSettingsOrFn;
        
        const { 
            houseName, houseAddress, bankName, bankAccountNumber, bankLogoUrl, ownerName, ownerPhotoUrl, 
            zakatBankDetails, passcode, passcodeProtectionEnabled, aboutUs, contactPhone, contactEmail, contactAddress, footerName,
            theme, whatsappRemindersEnabled, whatsappReminderSchedule, whatsappReminderTemplate, tenantViewStyle,
            metadataTitle, faviconUrl,
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

    useEffect(() => {
        if (isMounted) {
            const root = document.documentElement;
            root.style.setProperty('--primary', hexToHsl(settings.theme.colors.primary));
            
            const headerBgHsl = hexToHsl(settings.theme.colors.table_header_background);
            const headerFgHex = settings.theme.colors.table_header_foreground;

            root.style.setProperty('--table-header-background', headerBgHsl);
            root.style.setProperty('--table-header-foreground', hexToHsl(headerFgHex));
            root.style.setProperty('--table-footer-background', hexToHsl(settings.theme.colors.table_footer_background));
            root.style.setProperty('--table-footer-foreground', hexToHsl('#ffffff')); // Assuming white text on footer

            root.style.setProperty('--mobile-nav-background', hexToHsl(settings.theme.colors.mobile_nav_background));
            root.style.setProperty('--mobile-nav-foreground', hexToHsl(settings.theme.colors.mobile_nav_foreground));
        }
    }, [settings.theme, isMounted]);

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
