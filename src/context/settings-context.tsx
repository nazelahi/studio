
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TabNames {
    overview: string;
    tenants: string;
    integrations: string;
    reports: string;
}

interface PageDashboard {
    nav_dashboard: string;
    nav_settings: string;
    signin_button: string;
    user_menu_tooltip: string;
    user_menu_logout: string;
}

interface PageOverview {
    financial_overview_title: string;
    financial_overview_description: string;
}

interface BankAccount {
    name: string;
    accountNumber: string;
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
    bank_account_settings: {
        title: string;
        description: string;
        bank_name_label: string;
        account_number_label: string;
        add_button: string;
    };
    security_settings: {
        title: string;
        description: string;
        old_password_label: string;
        new_password_label: string;
        confirm_password_label: string;
        change_password_button: string;
    };
}

interface AppSettings {
  appName: string;
  houseName: string;
  houseAddress: string;
  tabNames: TabNames;
  footerName: string;
  bankAccounts: BankAccount[];
  page_dashboard: PageDashboard;
  page_overview: PageOverview;
  page_settings: PageSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const defaultSettings: AppSettings = {
    appName: "RentFlow",
    houseName: "Sunset Apartments",
    houseAddress: "123 Ocean View Drive, Miami, FL 33139",
    tabNames: {
        overview: "Overview",
        tenants: "Tenants",
        integrations: "Integrations",
        reports: "Reports",
    },
    footerName: "© 2024 RentFlow. All Rights Reserved.",
    bankAccounts: [
        { name: "Main Bank", accountNumber: "123456789" },
        { name: "Secondary Bank", accountNumber: "987654321" },
    ],
    page_dashboard: {
        nav_dashboard: "Dashboard",
        nav_settings: "Settings",
        signin_button: "Sign In",
        user_menu_tooltip: "Toggle user menu",
        user_menu_logout: "Log out",
    },
    page_overview: {
        financial_overview_title: "Financial Overview",
        financial_overview_description: "A summary of your income and expenses for the month.",
    },
    page_settings: {
        title: "Settings",
        property_details: {
            title: "Property Details",
            description: "Set the name and address of your property.",
            house_name_label: "House Name",
            house_address_label: "House Address",
        },
        app_settings: {
            title: "Application Settings",
            description: "Customize the names and labels used throughout the application.",
            header_name_label: "Header Name",
            footer_name_label: "Footer Name",
        },
        overview_settings: {
            title: "Overview Page Settings",
            description: "Customize the text on the monthly overview page.",
            financial_title_label: "Financial Overview Title",
            financial_description_label: "Financial Overview Description",
        },
        bank_account_settings: {
            title: "Bank Accounts",
            description: "Manage bank accounts for deposits.",
            bank_name_label: "Bank Name",
            account_number_label: "Account Number",
            add_button: "Add Account",
        },
        security_settings: {
            title: "Security",
            description: "Change your super admin password.",
            old_password_label: "Old Password",
            new_password_label: "New Password",
            confirm_password_label: "Confirm New Password",
            change_password_button: "Change Password",
        }
    },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const deepMerge = (target: any, source: any) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
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

    useEffect(() => {
        setIsMounted(true);
        try {
            const item = window.localStorage.getItem('appSettings');
            if (item) {
                const storedSettings = JSON.parse(item);
                // Deep merge to ensure all keys from default settings are present
                setSettings(deepMerge(defaultSettings, storedSettings));
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
