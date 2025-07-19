

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Tenant, Expense, RentEntry, PropertySettings as DbPropertySettings, Deposit, ZakatTransaction, Notice, WorkDetail, ZakatBankDetail, ToastFn, Document, TabNames, PageLabels } from '@/types';
import { parseISO, getMonth, getYear, subMonths, format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { addWorkDetailsBatch as addWorkDetailsBatchAction } from '@/app/actions/work';
import { addExpensesBatch as addExpensesBatchAction, deleteExpenseAction, deleteMultipleExpensesAction } from '@/app/actions/expenses';
import type { AppData } from '@/lib/data';
import { getDashboardDataAction } from '@/app/actions/data';
import { findOrCreateTenantAction, updateTenantAction, deleteTenantAction, deleteMultipleTenantsAction } from '@/app/actions/tenants';
import { addRentEntriesBatch as addRentEntriesBatchServerAction, deleteRentEntryAction, deleteMultipleRentEntriesAction } from '@/app/actions/rent';

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

interface ColorSet {
    primary: string;
    table_header_background: string;
    table_header_foreground: string;
    table_footer_background: string;
    mobile_nav_background: string;
    mobile_nav_foreground: string;
}

interface DarkColorSet {
    primary: string;
    table_header_background: string;
    table_header_foreground: string;
    table_footer_background: string;
    mobile_nav_background: string;
    mobile_nav_foreground: string;
}

interface AppTheme {
    colors: ColorSet;
    darkColors: DarkColorSet;
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
  addTenant: (formData: FormData, toast: ToastFn) => Promise<void>;
  updateTenant: (formData: FormData, toast: ToastFn) => Promise<void>;
  deleteTenant: (formData: FormData, toast: ToastFn) => Promise<void>;
  deleteMultipleTenants: (tenantIds: string[], toast: ToastFn) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'deleted_at' | 'created_at'>, toast: ToastFn) => Promise<void>;
  addExpensesBatch: (expenses: Omit<Expense, 'id' | 'deleted_at' | 'created_at'>[], toast: ToastFn) => Promise<any>;
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
        },
         darkColors: {
            primary: '#2dd4bf', // teal-400
            table_header_background: '#2dd4bf',
            table_header_foreground: '#000000',
            table_footer_background: '#a3e635', // lime-400
            mobile_nav_background: '#0d9488', // teal-600
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

// --- END: Settings-related logic ---

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
                colors: {
                    primary: serverSettings.theme_primary || defaultSettings.theme.colors.primary,
                    table_header_background: serverSettings.theme_table_header_background || defaultSettings.theme.colors.table_header_background,
                    table_header_foreground: serverSettings.theme_table_header_foreground || defaultSettings.theme.colors.table_header_foreground,
                    table_footer_background: serverSettings.theme_table_footer_background || defaultSettings.theme.colors.table_footer_background,
                    mobile_nav_background: serverSettings.theme_mobile_nav_background || defaultSettings.theme.colors.mobile_nav_background,
                    mobile_nav_foreground: serverSettings.theme_mobile_nav_foreground || defaultSettings.theme.colors.mobile_nav_foreground,
                },
                 darkColors: {
                    primary: serverSettings.theme_primary_dark || defaultSettings.theme.darkColors.primary,
                    table_header_background: serverSettings.theme_table_header_background_dark || defaultSettings.theme.darkColors.table_header_background,
                    table_header_foreground: serverSettings.theme_table_header_foreground_dark || defaultSettings.theme.darkColors.table_header_foreground,
                    table_footer_background: serverSettings.theme_table_footer_background_dark || defaultSettings.theme.darkColors.table_footer_background,
                    mobile_nav_background: serverSettings.theme_mobile_nav_background_dark || defaultSettings.theme.darkColors.mobile_nav_background,
                    mobile_nav_foreground: serverSettings.theme_mobile_nav_foreground_dark || defaultSettings.theme.darkColors.mobile_nav_foreground,
                }
            },
            // Merge page_labels from database
            ...deepMerge({ 
              page_dashboard: defaultSettings.page_dashboard, 
              tabNames: defaultSettings.tabNames,
            }, serverSettings.page_labels || {}),
            page_overview: defaultSettings.page_overview,
            page_settings: defaultSettings.page_settings,
         }
    }
    return combinedSettings;
};


export function AppContextProvider({ children, initialData }: { children: ReactNode; initialData: AppData }) {
    const { propertySettings, zakatBankDetails, ...dashboardData } = initialData;
    const [data, setData] = useState(dashboardData);
    const [settings, setSettings] = useState<AppSettings>(() => getInitialSettings(propertySettings, zakatBankDetails));
    const [loading, setLoading] = useState(true);
    
    const refreshData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        try {
            const { propertySettings, zakatBankDetails, ...dashboardData } = await getDashboardDataAction();
            setData({ ...dashboardData, zakatBankDetails });
            
            const finalSettings = getInitialSettings(propertySettings, zakatBankDetails);
            setSettings(finalSettings);

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
        setLoading(false);
        // If the initial data from the server is empty (e.g., due to a temporary server-side fetch error),
        // trigger a client-side fetch to ensure the user gets the data.
        if (!initialData.propertySettings) {
            console.log("Initial server data is incomplete. Triggering client-side refresh.");
            refreshData();
        }
    }, [initialData, refreshData]);

    useEffect(() => {
        if (!supabase) return;

        const handleDbChange = (payload: any) => {
            console.log('Database change detected, refreshing data...', payload);
            refreshData(false); 
        };

        const tables = [
            'tenants', 'expenses', 'rent_entries', 'property_settings', 
            'deposits', 'zakat_transactions', 'notices', 'work_details', 'zakat_bank_details', 'documents'
        ];
        
        const subscriptions = tables.map(table => {
            return supabase
                .channel(`public:${table}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    handleDbChange
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Successfully subscribed to real-time updates for ${table}!`);
                    }
                    if (err) {
                        const dbError = err as any;
                        console.error(`Realtime subscription error on ${table}:`, dbError);
                    }
                });
        });

        return () => {
            subscriptions.forEach(subscription => {
                supabase.removeChannel(subscription);
            });
        };
    }, [refreshData]);


     const handleSetSettings = (newSettingsOrFn: AppSettings | ((prev: AppSettings) => AppSettings)) => {
        const newSettings = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(settings) : newSettingsOrFn;
        setSettings(newSettings);
    };

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

    const addTenant = async (formData: FormData, toast: ToastFn) => {
        // This function might seem redundant now, but it's kept for potential future client-side logic before calling the server action.
        // For now, it just passes through to the server action.
        const tenantData = Object.fromEntries(formData.entries());

        const { data: newTenant, error } = await supabase.from('tenants').insert([tenantData]).select().single();
        if (error || !newTenant) {
            handleError(error, 'adding tenant', toast);
            return;
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
    };

    const updateTenant = async (formData: FormData, toast: ToastFn) => {
        const result = await updateTenantAction(formData);
        if (result.error) {
            handleError(new Error(result.error), 'updating tenant', toast);
        } else {
            await refreshData(false);
        }
    };

    const deleteTenant = async (formData: FormData, toast: ToastFn) => {
        const tenantId = formData.get('tenantId') as string;
        const result = await deleteTenantAction(formData);
        if (result.error) {
            handleError(new Error(result.error), 'deleting tenant', toast);
        } else {
             toast({
                title: 'Tenant Deleted',
                description: 'The tenant has been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('tenants', [tenantId], toast)}>Undo</Button>
             });
             await refreshData(false);
        }
    };

    const deleteMultipleTenants = async (tenantIds: string[], toast: ToastFn) => {
        const result = await deleteMultipleTenantsAction(tenantIds);
        if (result.error) {
            handleError(new Error(result.error), 'deleting multiple tenants', toast);
        } else {
            toast({
                title: `${tenantIds.length} Tenant(s) Deleted`,
                description: 'The selected tenants have been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('tenants', tenantIds, toast)}>Undo</Button>
            });
        }
        await refreshData(false);
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

    const addExpensesBatch = async (expenses: Omit<Expense, 'id' | 'deleted_at' | 'created_at'>[], toast: ToastFn) => {
        const result = await addExpensesBatchAction(expenses);
        if (result.error) {
            handleError(new Error(result.error), 'batch adding expenses', toast);
        } else {
            await refreshData(false);
        }
        return result;
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
        const formData = new FormData();
        formData.append('expenseId', expenseId);
        const result = await deleteExpenseAction(formData);

        if (result.error) {
            handleError(new Error(result.error), 'deleting expense', toast);
        } else {
            toast({
                title: 'Expense Deleted',
                description: 'The expense has been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('expenses', [expenseId], toast)}>Undo</Button>
             });
        }
        await refreshData(false);
    };

    const deleteMultipleExpenses = async (expenseIds: string[], toast: ToastFn) => {
        const result = await deleteMultipleExpensesAction(expenseIds);
        if (result.error) {
            handleError(new Error(result.error), 'deleting multiple expenses', toast);
        } else {
             toast({
                title: `${expenseIds.length} Expense(s) Deleted`,
                description: 'The selected expenses have been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('expenses', expenseIds, toast)}>Undo</Button>
             });
        }
        await refreshData(false);
    };
    
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
                    email: rentEntryData.name ? `${rentEntryData.name.replace(/\s+/g, '.').toLowerCase()}@example.com` : 'tenant@example.com',
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
            payment_for_month: rentEntryData.payment_for_month,
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
        const tenantPromises = rentEntriesData.map(entry => 
            findOrCreateTenantAction({
                name: entry.name,
                property: entry.property,
                rent: entry.rent,
                join_date: new Date(year, month, 1).toISOString().split('T')[0],
                email: entry.name ? `${entry.name.replace(/\s+/g, '.').toLowerCase()}@example.com` : 'tenant@example.com',
            })
        );
        const tenantsResult = await Promise.all(tenantPromises);

        const newEntries = rentEntriesData.map((entry, index) => {
            const tenant = tenantsResult[index];
            if (!tenant || tenant.error) {
                handleError(new Error(tenant?.error || `Failed to find or create tenant for ${entry.name}`), `batch tenant processing`, toast);
                return null;
            }
            
            return {
                ...entry,
                tenant_id: tenant.data!.id,
                avatar: tenant.data!.avatar,
                due_date: new Date(year, month, 1).toISOString().split('T')[0],
                year,
                month,
            };
        }).filter(Boolean) as (Omit<NewRentEntry, 'tenant_id' | 'avatar'> & { tenant_id: string, avatar: string, year: number, month: number, due_date: string })[];

        if (newEntries.length === 0) {
            toast({ title: "No entries to add", description: "All entries failed during tenant processing.", variant: "destructive" });
            return;
        }

        const result = await addRentEntriesBatchServerAction(newEntries);
        
        if (result.error) {
            handleError(new Error(result.error), 'batch adding rent entries', toast);
        } else {
             await refreshData(false);
        }
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
        const result = await deleteRentEntryAction(rentEntryId);
        if (result.error) {
            handleError(new Error(result.error), 'deleting rent entry', toast);
        } else {
            toast({
                title: 'Rent Entry Deleted',
                description: 'The rent entry has been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('rent_entries', [rentEntryId], toast)}>Undo</Button>
            });
        }
        await refreshData(false);
    };

    const deleteMultipleRentEntries = async (rentEntryIds: string[], toast: ToastFn) => {
        const result = await deleteMultipleRentEntriesAction(rentEntryIds);
        if (result.error) {
            handleError(new Error(result.error), 'deleting multiple rent entries', toast);
        } else {
             toast({
                title: `${rentEntryIds.length} Rent Entries Deleted`,
                description: 'The selected entries have been deleted.',
                action: <Button variant="secondary" onClick={() => undoDelete('rent_entries', rentEntryIds, toast)}>Undo</Button>
             });
        }
        await refreshData(false);
    };
    
    const syncTenantsForMonth = async (year: number, month: number, toast: ToastFn): Promise<number> => {
      try {
        if (!supabase) return 0;
        
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
            .eq('status', 'Active') // Only sync tenants marked as "Active"
            .is('deleted_at', null);

        if (tenantsError) {
            handleError(tenantsError, 'fetching tenants for sync', toast);
            return 0;
        }

        const tenantsToSync = allTenants.filter(tenant => !existingTenantIds.has(tenant.id));

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
        return { ...data, zakatBankDetails: settings.zakatBankDetails, propertySettings: null };
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
        deleteMultipleTenants,
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
