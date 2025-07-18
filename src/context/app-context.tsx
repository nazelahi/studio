
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Tenant, Expense, RentEntry, PropertySettings as DbPropertySettings, Deposit, ZakatTransaction, Notice, WorkDetail, ZakatBankDetail, ToastFn, Document, TabNames } from '@/types';
import { parseISO, getMonth, getYear, subMonths, format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { addWorkDetailsBatch as addWorkDetailsBatchAction } from '@/app/actions/work';
import type { AppData } from '@/lib/data';
import { getDashboardDataAction } from '@/app/actions/data';
import { getSettingsData } from '@/lib/data';

// --- START: Settings-related types moved here ---
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

export interface AppSettings {
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
  appLogoUrl?: string;
  documentCategories: string[];
  dateFormat: string;
  currencySymbol: string;
}
// --- END: Settings-related types ---

type AppContextType = {
  tenants: Tenant[];
  expenses: Expense[];
  rentData: RentEntry[];
  deposits: Deposit[];
  zakatTransactions: ZakatTransaction[];
  notices: Notice[];
  workDetails: WorkDetail[];
  documents: Document[];
  settings: AppSettings;
  setSettings: (newSettings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'deleted_at' | 'created_at'>, toast: ToastFn, files?: File[]) => Promise<void>;
  updateTenant: (tenant: Tenant, toast: ToastFn, files?: File[]) => Promise<void>;
  deleteTenant: (tenantId: string, toast: ToastFn) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'deleted_at' | 'created_at'>, toast: ToastFn) => Promise<void>;
  addExpensesBatch: (expenses: Omit<Expense, 'id' | 'deleted_at' | 'created_at'>[], toast: ToastFn) => Promise<void>;
  updateExpense: (expense: Expense, toast: ToastFn) => Promise<void>;
  deleteExpense: (expenseId: string, toast: ToastFn) => Promise<void>;
  deleteMultipleExpenses: (expenseIds: string[], toast: ToastFn) => Promise<void>;
  addRentEntry: (rentEntry: NewRentEntry, year: number, month: number, toast: ToastFn) => Promise<void>;
  addRentEntriesBatch: (rentEntries: Omit<NewRentEntry, 'tenant_id' | 'avatar'>[], year: number, month: number, toast: ToastFn) => Promise<void>;
  updateRentEntry: (rentEntry: RentEntry, toast: ToastFn) => Promise<void>;
  deleteRentEntry: (rentEntryId: string, toast: ToastFn) => Promise<void>;
  deleteMultipleRentEntries: (rentEntryIds: string[], toast: ToastFn) => Promise<void>;
  syncTenantsForMonth: (year: number, month: number, toast: ToastFn) => Promise<number>;
  syncExpensesFromPreviousMonth: (year: number, month: number, toast: ToastFn) => Promise<number>;
  loading: boolean;
  getAllData: () => Omit<AppData, 'propertySettings'>;
  restoreAllData: (backupData: Omit<AppData, 'propertySettings'>, toast: ToastFn) => void;
  refreshData: () => Promise<void>;
  getRentEntryById: (id: string) => RentEntry | null;
  addWorkDetailsBatch: (workDetails: Omit<WorkDetail, 'id' | 'created_at' | 'deleted_at'>[], toast: ToastFn) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const handleError = (error: any, context: string, toast: ToastFn) => {
    const errorMessage = error.message || 'An unexpected error occurred.';
    console.error(`Error in ${context}:`, errorMessage, error);
    toast({
        title: `Error: ${context}`,
        description: errorMessage,
        variant: 'destructive',
    });
};

// --- START: Settings-related logic moved here ---
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
    appLogoUrl: undefined,
    documentCategories: ["Legal", "Agreements", "Receipts", "ID Cards", "Property Deeds", "Blueprints", "Miscellaneous"],
    dateFormat: "dd MMM, yyyy",
    currencySymbol: "৳",
    tabNames: {
        overview: "Overview",
        tenants: "Tenants",
        work: "Work",
        reports: "Reports",
        zakat: "Zakat",
        documents: "Documents",
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
    if (!hex || typeof hex !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
        return '0 0% 0%'; // Return a default for invalid hex
    }
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
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

// --- END: Settings-related logic ---

type InitialSettings = {
    propertySettings: DbPropertySettings | null;
    zakatBankDetails: ZakatBankDetail[];
}

const initialAppData: Omit<AppData, 'propertySettings'> = {
    tenants: [],
    expenses: [],
    rentData: [],
    deposits: [],
    zakatTransactions: [],
    zakatBankDetails: [],
    notices: [],
    workDetails: [],
    documents: [],
}

const getInitialSettings = (serverSettings: DbPropertySettings | null, zakatDetails: ZakatBankDetail[]) => {
    let combinedSettings = { ...defaultSettings };
     if (serverSettings) {
         combinedSettings = {
            ...defaultSettings,
            houseName: serverSettings.house_name || defaultSettings.houseName,
            houseAddress: serverSettings.house_address || defaultSettings.houseAddress,
            bankName: serverSettings.bank_name || defaultSettings.bankName,
            bankAccountNumber: serverSettings.bank_account_number || defaultSettings.bankAccountNumber,
            bankLogoUrl: serverSettings.bank_logo_url || defaultSettings.bankLogoUrl,
            ownerName: serverSettings.owner_name || defaultSettings.ownerName,
            ownerPhotoUrl: serverSettings.owner_photo_url || defaultSettings.ownerPhotoUrl,
            passcode: serverSettings.passcode || defaultSettings.passcode,
            passcodeProtectionEnabled: serverSettings.passcode_protection_enabled ?? defaultSettings.passcodeProtectionEnabled,
            aboutUs: serverSettings.about_us || defaultSettings.aboutUs,
            contactPhone: serverSettings.contact_phone || defaultSettings.contactPhone,
            contactEmail: serverSettings.contact_email || defaultSettings.contactEmail,
            contactAddress: serverSettings.contact_address || defaultSettings.contactAddress,
            footerName: serverSettings.footer_name || defaultSettings.footerName,
            tenantViewStyle: serverSettings.tenant_view_style || defaultSettings.tenantViewStyle,
            metadataTitle: serverSettings.metadata_title || defaultSettings.metadataTitle,
            faviconUrl: serverSettings.favicon_url || defaultSettings.faviconUrl,
            appLogoUrl: serverSettings.app_logo_url || defaultSettings.appLogoUrl,
            dateFormat: serverSettings.date_format || defaultSettings.dateFormat,
            currencySymbol: serverSettings.currency_symbol || defaultSettings.currencySymbol,
            documentCategories: serverSettings.document_categories || defaultSettings.documentCategories,
            whatsappRemindersEnabled: serverSettings.whatsapp_reminders_enabled ?? defaultSettings.whatsappRemindersEnabled,
            whatsappReminderSchedule: serverSettings.whatsapp_reminder_schedule || defaultSettings.whatsappReminderSchedule,
            whatsappReminderTemplate: serverSettings.whatsapp_reminder_template || defaultSettings.whatsappReminderTemplate,
            zakatBankDetails: zakatDetails || [],
            theme: {
                ...defaultSettings.theme,
                colors: {
                    ...defaultSettings.theme.colors,
                    primary: serverSettings.theme_primary || defaultSettings.theme.colors.primary,
                    table_header_background: serverSettings.theme_table_header_background || defaultSettings.theme.colors.table_header_background,
                    table_header_foreground: serverSettings.theme_table_header_foreground || defaultSettings.theme.colors.table_header_foreground,
                    table_footer_background: serverSettings.theme_table_footer_background || defaultSettings.theme.colors.table_footer_background,
                    mobile_nav_background: serverSettings.theme_mobile_nav_background || defaultSettings.theme.colors.mobile_nav_background,
                    mobile_nav_foreground: serverSettings.theme_mobile_nav_foreground || defaultSettings.theme.colors.mobile_nav_foreground,
                }
            }
         }
    }
    return combinedSettings;
};


export function AppContextProvider({ children, initialSettings }: { children: ReactNode; initialSettings: InitialSettings }) {
    const [data, setData] = useState(initialAppData);
    const [settings, setSettings] = useState<AppSettings>(() => getInitialSettings(initialSettings.propertySettings, initialSettings.zakatBankDetails));
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    
    const refreshData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const { propertySettings, zakatBankDetails, ...dashboardData } = await getDashboardDataAction();
            setData({ ...dashboardData, zakatBankDetails });

            let localSettings = {};
            try {
                const item = window.localStorage.getItem('appSettings');
                if (item) {
                    localSettings = JSON.parse(item);
                }
            } catch (error) {
                console.error("Failed to parse settings from localStorage", error);
            }
            
            const newServerSettings = getInitialSettings(propertySettings, zakatBankDetails);
            setSettings(prev => deepMerge(newServerSettings, localSettings));

        } catch (error: any) {
            console.error(`Error in refreshing data:`, error.message, error);
            handleError(error, "refreshing data", () => {});
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        refreshData();
    }, [refreshData]);


     const handleSetSettings = (newSettingsOrFn: AppSettings | ((prev: AppSettings) => AppSettings)) => {
        const newSettings = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(settings) : newSettingsOrFn;
        
        const { 
            houseName, houseAddress, bankName, bankAccountNumber, bankLogoUrl, ownerName, ownerPhotoUrl, 
            zakatBankDetails, passcode, passcodeProtectionEnabled, aboutUs, contactPhone, contactEmail, contactAddress, footerName,
            theme, whatsappRemindersEnabled, whatsappReminderSchedule, whatsappReminderTemplate, tenantViewStyle,
            metadataTitle, faviconUrl, appLogoUrl, documentCategories, dateFormat, currencySymbol,
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
            root.style.setProperty('--table-header-background', hexToHsl(settings.theme.colors.table_header_background));
            root.style.setProperty('--table-header-foreground', hexToHsl(settings.theme.colors.table_header_foreground));
            root.style.setProperty('--table-footer-background', hexToHsl(settings.theme.colors.table_footer_background));
            root.style.setProperty('--table-footer-foreground', hexToHsl('#ffffff')); // Assuming white text on footer
            root.style.setProperty('--mobile-nav-background', hexToHsl(settings.theme.colors.mobile_nav_background));
            root.style.setProperty('--mobile-nav-foreground', hexToHsl(settings.theme.colors.mobile_nav_foreground));
        }
    }, [settings.theme, isMounted]);


    const uploadFiles = async (tenantId: string, files: File[], toast: ToastFn): Promise<string[]> => {
      try {
        if (!supabase || files.length === 0) return [];
        const timestamp = new Date().getTime();
        const uploadPromises = files.map(async (file, index) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${tenantId}/${timestamp}-${index}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('tenant-documents')
                .upload(fileName, file);

            if (uploadError) {
                handleError(uploadError, `uploading file ${file.name}`, toast);
                return null;
            }

            if (!uploadData) {
                const uploadError = new Error("Upload succeeded but no data was returned.");
                handleError(uploadError, `uploading file ${file.name}`, toast);
                return null;
            }

            const { data: publicUrlData } = supabase.storage
                .from('tenant-documents')
                .getPublicUrl(uploadData.path);
                
            return publicUrlData.publicUrl;
        });

        const results = await Promise.all(uploadPromises);
        return results.filter((url): url is string => url !== null);
      } catch (error) {
        handleError(error, 'uploading files', toast);
        return [];
      }
    };

    const undoDelete = async (table: string, ids: string[], toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { error } = await supabase.from(table).update({ deleted_at: null }).in('id', ids);
        if (error) {
            handleError(error, `undoing delete on ${table}`, toast);
        } else {
            toast({ title: 'Restored', description: `The item(s) have been restored.` });
            await refreshData(false);
        }
      } catch (error) {
        handleError(error, `undoing delete on ${table}`, toast);
      }
    }

    const addTenant = async (tenantData: Omit<Tenant, 'id' | 'created_at' | 'deleted_at'>, toast: ToastFn, files: File[] = []) => {
      try {
        if (!supabase) return;
        
        const cleanTenantData = { ...tenantData };
        if (cleanTenantData.date_of_birth === '') delete (cleanTenantData as any).date_of_birth;
        if (cleanTenantData.father_name === '') delete (cleanTenantData as any).father_name;
        if (cleanTenantData.address === '') delete (cleanTenantData as any).address;
        if (cleanTenantData.nid_number === '') delete (cleanTenantData as any).nid_number;
        if (cleanTenantData.gas_meter_number === '') delete (cleanTenantData as any).gas_meter_number;
        if (cleanTenantData.electric_meter_number === '') delete (cleanTenantData as any).electric_meter_number;

        const { data: newTenant, error } = await supabase.from('tenants').insert([cleanTenantData]).select().single();
        if (error || !newTenant) {
            handleError(error, 'adding tenant', toast);
            return;
        }

        const uploadedUrls = await uploadFiles(newTenant.id, files, toast);
        
        if (uploadedUrls.length > 0) {
            const { error: updateError } = await supabase
                .from('tenants')
                .update({ documents: uploadedUrls })
                .eq('id', newTenant.id);

            if (updateError) handleError(updateError, 'updating tenant with documents', toast);
        }

        const joinDate = parseISO(newTenant.join_date);
        const month = getMonth(joinDate);
        const year = getYear(joinDate);

        const newRentEntryData = {
            tenant_id: newTenant.id,
            name: newTenant.name,
            property: newTenant.property,
            rent: newTenant.rent,
            status: 'Pending' as const,
            avatar: newTenant.avatar,
            due_date: new Date(year, month, 1).toISOString().split('T')[0],
            year,
            month,
        };
        const { error: rentError } = await supabase.from('rent_entries').insert([newRentEntryData]);
        if (rentError) handleError(rentError, 'auto-creating rent entry', toast);
        await refreshData(false);
      } catch (error) {
        handleError(error, 'adding tenant', toast);
      }
    };

    const updateTenant = async (updatedTenant: Tenant, toast: ToastFn, files: File[] = []) => {
      try {
        if (!supabase) return;
        const { id, ...tenantData } = updatedTenant;
        
        const uploadedUrls = await uploadFiles(id, files, toast);
        const finalDocuments = [...(tenantData.documents || []), ...uploadedUrls];

        const cleanTenantData = { ...tenantData, documents: finalDocuments };
        if (cleanTenantData.date_of_birth === '') delete (cleanTenantData as any).date_of_birth;
        if (cleanTenantData.father_name === '') delete (cleanTenantData as any).father_name;
        if (cleanTenantData.address === '') delete (cleanTenantData as any).address;
        if (cleanTenantData.nid_number === '') delete (cleanTenantData as any).nid_number;
        if (cleanTenantData.gas_meter_number === '') delete (cleanTenantData as any).gas_meter_number;
        if (cleanTenantData.electric_meter_number === '') delete (cleanTenantData as any).electric_meter_number;

        const { error } = await supabase.from('tenants').update(cleanTenantData).eq('id', id);
        if (error || !id) {
            handleError(error, 'updating tenant', toast);
            return;
        }

        const { error: rentUpdateError } = await supabase
            .from('rent_entries')
            .update({
                name: tenantData.name,
                property: tenantData.property,
                rent: tenantData.rent,
                avatar: tenantData.avatar,
            })
            .eq('tenant_id', id)
            .neq('status', 'Paid')
            .gt('due_date', new Date().toISOString());

        if (rentUpdateError) {
            handleError(rentUpdateError, 'syncing future rent entries', toast);
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'updating tenant', toast);
      }
    };

    const deleteTenant = async (tenantId: string, toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { error } = await supabase.from('tenants').update({ deleted_at: new Date().toISOString() }).eq('id', tenantId);
        if (error) {
            handleError(error, 'deleting tenant', toast);
        } else {
             toast({
                title: 'Tenant Deleted',
                description: 'The tenant has been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('tenants', [tenantId], toast)}>Undo</Button>
             });
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'deleting tenant', toast);
      }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'deleted_at'>, toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { error } = await supabase.from('expenses').insert([expense]);
        if (error) handleError(error, 'adding expense', toast);
        await refreshData(false);
      } catch (error) {
        handleError(error, 'adding expense', toast);
      }
    };

    const addExpensesBatch = async (expenses: Omit<Expense, 'id' | 'created_at' | 'deleted_at'>[], toast: ToastFn) => {
      try {
        if (!supabase || expenses.length === 0) return;
        const { error } = await supabase.from('expenses').insert(expenses);
        if (error) {
            handleError(error, 'batch adding expenses', toast);
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'batch adding expenses', toast);
      }
    };


    const updateExpense = async (updatedExpense: Expense, toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { id, ...expenseData } = updatedExpense;
        const { error } = await supabase.from('expenses').update(expenseData).eq('id', id);
        if (error) handleError(error, 'updating expense', toast);
        await refreshData(false);
      } catch (error) {
        handleError(error, 'updating expense', toast);
      }
    };

    const deleteExpense = async (expenseId: string, toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', expenseId);
        if (error) {
            handleError(error, 'deleting expense', toast);
        } else {
            toast({
                title: 'Expense Deleted',
                description: 'The expense has been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('expenses', [expenseId], toast)}>Undo</Button>
             });
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'deleting expense', toast);
      }
    };

    const deleteMultipleExpenses = async (expenseIds: string[], toast: ToastFn) => {
      try {
        if (!supabase || expenseIds.length === 0) return;
        const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).in('id', expenseIds);
        if (error) {
            handleError(error, 'deleting multiple expenses', toast);
        } else {
            toast({
                title: `${expenseIds.length} Expense(s) Deleted`,
                description: 'The selected expenses have been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('expenses', expenseIds, toast)}>Undo</Button>
             });
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'deleting multiple expenses', toast);
      }
    }

    const addRentEntry = async (rentEntryData: NewRentEntry, year: number, month: number, toast: ToastFn) => {
      try {
        if (!supabase) return;

        let tenantId = rentEntryData.tenant_id;
        let tenantAvatar = rentEntryData.avatar;

        if (!tenantId) {
            let { data: existingTenant } = await supabase
                .from('tenants')
                .select('id, avatar')
                .eq('name', rentEntryData.name)
                .eq('property', rentEntryData.property)
                .is('deleted_at', null)
                .maybeSingle();
            
            if (!existingTenant) {
                const newTenantData: Omit<Tenant, 'id' | 'created_at' | 'deleted_at'> = {
                    name: rentEntryData.name,
                    property: rentEntryData.property,
                    rent: rentEntryData.rent,
                    join_date: new Date(year, month, 1).toISOString().split('T')[0],
                    avatar: 'https://placehold.co/80x80.png',
                    status: 'Active',
                    email: `${rentEntryData.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                };
                const { data: newTenant, error } = await supabase.from('tenants').insert(newTenantData).select().single();
                if (error || !newTenant) {
                    handleError(error || new Error('Failed to create tenant'), `auto-creating tenant for ${rentEntryData.name}`, toast);
                    return;
                }
                existingTenant = newTenant;
            }
            tenantId = existingTenant.id;
            tenantAvatar = existingTenant.avatar;
        }

        const newEntry = {
            name: rentEntryData.name,
            property: rentEntryData.property,
            rent: rentEntryData.rent,
            payment_date: rentEntryData.payment_date,
            collected_by: rentEntryData.collected_by,
            status: rentEntryData.status,
            tenant_id: tenantId,
            avatar: tenantAvatar || 'https://placehold.co/80x80.png',
            due_date: new Date(year, month, 1).toISOString().split('T')[0],
            year,
            month,
        };
        
        const { error } = await supabase.from('rent_entries').insert(newEntry);
        if (error) handleError(error, 'adding rent entry', toast);
        await refreshData(false);
      } catch (error) {
        handleError(error, 'adding rent entry', toast);
      }
    };

    const addRentEntriesBatch = async (rentEntriesData: Omit<NewRentEntry, 'tenant_id' | 'avatar'>[], year: number, month: number, toast: ToastFn) => {
      try {
        if (!supabase) return;

        const newEntriesWithDetails = await Promise.all(rentEntriesData.map(async (rentEntryData) => {
            let tenantInfo = { id: (rentEntryData as NewRentEntry).tenant_id, avatar: (rentEntryData as NewRentEntry).avatar };

            if (!tenantInfo.id) {
                let { data: existingTenant } = await supabase
                    .from('tenants')
                    .select('id, avatar')
                    .eq('name', rentEntryData.name)
                    .eq('property', rentEntryData.property)
                    .is('deleted_at', null)
                    .maybeSingle();

                if (!existingTenant) {
                    const newTenantData = {
                        name: rentEntryData.name,
                        property: rentEntryData.property,
                        rent: rentEntryData.rent,
                        join_date: new Date(year, month, 1).toISOString().split('T')[0],
                        avatar: 'https://placehold.co/80x80.png',
                        status: 'Active' as const,
                        email: `${rentEntryData.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    };
                    const { data: newTenant, error } = await supabase.from('tenants').insert(newTenantData).select().single();
                    if (error) {
                        handleError(error, `auto-creating tenant for ${rentEntryData.name}`, toast);
                        return null;
                    }
                    existingTenant = newTenant;
                }
                tenantInfo.id = existingTenant?.id;
                tenantInfo.avatar = existingTenant?.avatar;
            }
            
            const newEntry = {
                ...rentEntryData,
                tenant_id: tenantInfo.id,
                avatar: tenantInfo.avatar || 'https://placehold.co/80x80.png',
                due_date: new Date(year, month, 1).toISOString().split('T')[0],
                year,
                month,
            };

            const { id, ...entryToInsert } = newEntry as any;

            return entryToInsert;
        }));
        
        const validNewEntries = newEntriesWithDetails.filter((entry): entry is Omit<RentEntry, 'id'> => entry !== null);
        if(validNewEntries.length > 0) {
            const { error } = await supabase.from('rent_entries').insert(validNewEntries);
            if (error) handleError(error, 'batch adding rent entries', toast);
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'batch adding rent entries', toast);
      }
    };
    
    const updateRentEntry = async (updatedRentEntry: RentEntry, toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { id, ...rentEntryData } = updatedRentEntry;
        const { error } = await supabase.from('rent_entries').update(rentEntryData).eq('id', id);
        if (error) handleError(error, 'updating rent entry', toast);
        await refreshData(false);
      } catch (error) {
        handleError(error, 'updating rent entry', toast);
      }
    };
    
    const deleteRentEntry = async (rentEntryId: string, toast: ToastFn) => {
      try {
        if (!supabase) return;
        const { error } = await supabase.from('rent_entries').update({ deleted_at: new Date().toISOString() }).eq('id', rentEntryId);
        if (error) {
            handleError(error, 'deleting rent entry', toast);
        } else {
            toast({
                title: 'Rent Entry Deleted',
                description: 'The rent entry has been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('rent_entries', [rentEntryId], toast)}>Undo</Button>
            });
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'deleting rent entry', toast);
      }
    };

    const deleteMultipleRentEntries = async (rentEntryIds: string[], toast: ToastFn) => {
      try {
        if (!supabase || rentEntryIds.length === 0) return;
        const { error } = await supabase.from('rent_entries').update({ deleted_at: new Date().toISOString() }).in('id', rentEntryIds);
        if (error) {
            handleError(error, 'deleting multiple rent entries', toast);
        } else {
             toast({
                title: `${rentEntryIds.length} Rent Entries Deleted`,
                description: 'The selected entries have been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('rent_entries', rentEntryIds, toast)}>Undo</Button>
             });
        }
        await refreshData(false);
      } catch (error) {
        handleError(error, 'deleting multiple rent entries', toast);
      }
    };
    
    const syncTenantsForMonth = async (year: number, month: number, toast: ToastFn): Promise<number> => {
      try {
        if (!supabase) return 0;
        const selectedMonthStartDate = new Date(year, month, 1);
        
        const { data: rentDataForMonth, error: rentDataError } = await supabase
            .from('rent_entries')
            .select('tenant_id')
            .eq('year', year)
            .eq('month', month)
            .is('deleted_at', null);

        if (rentDataError) {
            handleError(rentDataError, 'fetching rent data for sync', toast);
            return 0;
        }
        const existingTenantIds = new Set(rentDataForMonth.map(e => e.tenant_id));

        const { data: allTenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('*')
            .is('deleted_at', null);

        if (tenantsError) {
            handleError(tenantsError, 'fetching tenants for sync', toast);
            return 0;
        }

        const tenantsToSync = allTenants.filter(tenant => {
            if (existingTenantIds.has(tenant.id)) {
                return false; 
            }
            if (!tenant.join_date) return false;
            try {
                const joinDate = parseISO(tenant.join_date);
                return joinDate <= selectedMonthStartDate;
            } catch {
                return false; 
            }
        });

        if (tenantsToSync.length === 0) {
            return 0; 
        }
        
        const newRentEntries = tenantsToSync.map(tenant => ({
            tenant_id: tenant.id,
            name: tenant.name,
            property: tenant.property,
            rent: tenant.rent,
            due_date: new Date(year, month, 1).toISOString().split("T")[0],
            status: "Pending" as const,
            avatar: tenant.avatar,
            year: year,
            month: month,
        }));

        const { error } = await supabase.from('rent_entries').insert(newRentEntries);

        if (error) {
            handleError(error, 'syncing tenants to rent roll', toast);
            return 0;
        }

        await refreshData(false);
        return tenantsToSync.length;
      } catch (error) {
        handleError(error, 'syncing tenants to rent roll', toast);
        return 0;
      }
    };
    
    const syncExpensesFromPreviousMonth = async (year: number, month: number, toast: ToastFn): Promise<number> => {
      try {
        if (!supabase) return 0;
        
        const currentMonthDate = new Date(year, month, 1);
        const previousMonthDate = subMonths(currentMonthDate, 1);
        const previousMonth = getMonth(previousMonthDate);
        const previousYear = getYear(previousMonthDate);

        const { data: previousExpenses, error: fetchError } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', format(new Date(previousYear, previousMonth, 1), 'yyyy-MM-dd'))
            .lt('date', format(new Date(previousYear, previousMonth + 1, 1), 'yyyy-MM-dd'))
            .is('deleted_at', null);

        if (fetchError) {
            handleError(fetchError, 'fetching previous month expenses for sync', toast);
            return 0;
        }

        if (!previousExpenses || previousExpenses.length === 0) {
            return 0;
        }
        
        const newExpenses = previousExpenses.map(expense => {
            const { id, created_at, date, deleted_at, ...rest } = expense;
            const previousDate = parseISO(date);
            const newDate = new Date(year, month, previousDate.getDate());
            
            return {
                ...rest,
                date: format(newDate, 'yyyy-MM-dd'),
                status: 'Due' as const, 
            };
        });

        const { error: insertError } = await supabase.from('expenses').insert(newExpenses);

        if (insertError) {
            handleError(insertError, 'syncing expenses to current month', toast);
            return 0;
        }

        await refreshData(false);
        return newExpenses.length;
      } catch (error) {
        handleError(error, 'syncing expenses to current month', toast);
        return 0;
      }
    };

    const getAllData = (): Omit<AppData, 'propertySettings'> => {
        return { ...data };
    };

    const restoreAllData = async (backupData: Omit<AppData, 'propertySettings'>, toast: ToastFn) => {
      if (!supabase) return;

      try {
        setLoading(true);
        
        const tables = ['rent_entries', 'expenses', 'tenants', 'deposits', 'notices', 'work_details', 'zakat_transactions', 'zakat_bank_details', 'documents', 'property_settings'];
        
        for (const table of tables) {
            const { error: deleteError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) throw new Error(`Failed to clear ${table}: ${deleteError.message}`);
        }
        
        const { ...dataToInsert } = backupData;

        for (const [table, records] of Object.entries(dataToInsert)) {
            const tableName = table === 'rentData' ? 'rent_entries' : table;
             if (records.length > 0) {
                const recordsToInsert = records.map((r: any) => {
                    const { created_at, ...rest } = r;
                    return rest;
                });

                if (recordsToInsert.length > 0) {
                    const { error: insertError } = await supabase.from(tableName).insert(recordsToInsert);
                    if (insertError) throw new Error(`Failed to insert into ${tableName}: ${insertError.message}`);
                }
            }
        }
        
        toast({ title: "Restore Complete", description: "Your data has been restored. The application will now reload." });
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error: any) {
        handleError(error, "restoring data", toast);
        setLoading(false);
      }
    };
    
    const getRentEntryById = (id: string): RentEntry | null => {
        return data.rentData.find(entry => entry.id === id) || null;
    }
    
    const addWorkDetailsBatch = async (workDetails: Omit<WorkDetail, 'id' | 'created_at' | 'deleted_at'>[], toast: ToastFn) => {
      try {
        const result = await addWorkDetailsBatchAction(workDetails);
        if (result.error) {
            handleError(new Error(result.error), 'batch adding work details', toast);
        } else {
            toast({ title: "Import Successful", description: `${result.count} work items have been imported.` });
        }
        await refreshData(false);
      } catch(error) {
        handleError(error, 'batch adding work details', toast);
      }
    };

    type NewRentEntry = Omit<RentEntry, 'id' | 'avatar' | 'year' | 'month' | 'due_date' | 'created_at' | 'deleted_at'> & { avatar?: string, tenant_id?: string };

    const value: AppContextType = {
        ...data,
        settings,
        setSettings: handleSetSettings,
        loading,
        refreshData,
        getAllData,
        restoreAllData,
        addTenant,
        updateTenant,
        deleteTenant,
        addExpense,
        addExpensesBatch,
        updateExpense,
        deleteExpense,
        deleteMultipleExpenses,
        addRentEntry,
        addRentEntriesBatch,
        updateRentEntry,
        deleteRentEntry,
        deleteMultipleRentEntries,
        syncTenantsForMonth,
        syncExpensesFromPreviousMonth,
        getRentEntryById,
        addWorkDetailsBatch,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
}
