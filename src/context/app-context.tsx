

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Tenant, Expense, RentEntry, PropertySettings as DbPropertySettings, Deposit, ZakatTransaction, Notice, WorkDetail, ZakatBankDetail, ToastFn, Document, TabNames, PageLabels } from '@/types';
import { supabase } from '@/lib/supabase';
import { addWorkDetailsBatch as addWorkDetailsBatchAction } from '@/app/actions/work';
import { addExpensesBatch as addExpensesBatchAction, deleteExpenseAction, deleteMultipleExpensesAction, saveExpenseAction, syncExpensesAction } from '@/app/actions/expenses';
import type { AppData } from '@/lib/data';
import { getDashboardDataAction } from '@/app/actions/data';
import { findOrCreateTenantAction, updateTenantAction, deleteTenantAction, deleteMultipleTenantsAction } from '@/app/actions/tenants';
import { addRentEntriesBatch as addRentEntriesBatchServerAction, deleteRentEntryAction, deleteMultipleRentEntriesAction, syncTenantsAction } from '@/app/actions/rent';
import { useToast } from "@/hooks/use-toast";

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
  addTenant: (formData: FormData) => Promise<void>;
  updateTenant: (formData: FormData) => Promise<void>;
  deleteTenant: (formData: FormData) => Promise<void>;
  deleteMultipleTenants: (tenantIds: string[]) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  addExpensesBatch: (expenses: Omit<Expense, 'id' | 'created_at'>[]) => Promise<any>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  deleteMultipleExpenses: (expenseIds: string[]) => Promise<void>;
  addRentEntry: (rentEntry: NewRentEntry, year: number, month: number) => Promise<void>;
  addRentEntriesBatch: (rentEntries: Omit<NewRentEntry, 'tenant_id' | 'avatar'>[], year: number, month: number) => Promise<void>;
  updateRentEntry: (rentEntry: RentEntry) => Promise<void>;
  deleteRentEntry: (rentEntryId: string) => Promise<void>;
  deleteMultipleRentEntries: (rentEntryIds: string[]) => Promise<void>;
  syncTenantsForMonth: (year: number, month: number) => Promise<void>;
  syncExpensesFromPreviousMonth: (year: number, month: number) => Promise<void>;
  loading: boolean;
  getAllData: () => Omit<AppData, 'propertySettings'>;
  restoreAllData: (backupData: Omit<AppData, 'propertySettings'>) => void;
  refreshData: () => Promise<void>;
  getRentEntryById: (id: string) => RentEntry | null;
  addWorkDetailsBatch: (workDetails: Omit<WorkDetail, 'id' | 'created_at'>[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
            documentCategories: serverSettings.document_categories || defaultSettings.documentCategories,
            dateFormat: serverSettings.date_format || defaultSettings.dateFormat,
            currencySymbol: serverSettings.currency_symbol || defaultSettings.currencySymbol,
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

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];


export function AppContextProvider({ children, initialData }: { children: ReactNode; initialData: AppData }) {
    const { toast } = useToast();
    const { propertySettings, zakatBankDetails, ...dashboardData } = initialData;
    const [data, setData] = useState(dashboardData);
    const [settings, setSettings] = useState<AppSettings>(() => getInitialSettings(propertySettings, zakatBankDetails));
    const [loading, setLoading] = useState(true);
    
    const handleError = useCallback((error: any, context: string) => {
        const errorMessage = error.message || 'An unexpected error occurred.';
        console.error(`Error in ${context}:`, errorMessage, error);
        toast({
            title: `Error: ${context}`,
            description: errorMessage,
            variant: 'destructive',
        });
    }, [toast]);

    const refreshData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { propertySettings, zakatBankDetails, ...dashboardData } = await getDashboardDataAction();
            setData({ ...dashboardData, zakatBankDetails });
            const finalSettings = getInitialSettings(propertySettings, zakatBankDetails);
            setSettings(finalSettings);
        } catch (error: any) {
            handleError(error, "refreshing data");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        setLoading(false);
    }, []);

    const handleSetSettings = (newSettingsOrFn: AppSettings | ((prev: AppSettings) => AppSettings)) => {
        const newSettings = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(settings) : newSettingsOrFn;
        setSettings(newSettings);
    };

    const addTenant = async (formData: FormData) => {
       await updateTenant(formData); // Uses the same logic, but without a tenantId
    };

    const updateTenant = async (formData: FormData) => {
        const result = await updateTenantAction(formData);
        if (result.error) {
            handleError(new Error(result.error), 'updating tenant');
        } else {
            toast({ title: "Tenant Saved", description: "The tenant details have been successfully saved." });
            await refreshData();
        }
    };

    const deleteTenant = async (formData: FormData) => {
        const result = await deleteTenantAction(formData);
        if (result.error) {
            handleError(new Error(result.error), 'archiving tenant');
        } else {
             toast({
                title: 'Tenant Archived',
                description: 'The tenant has been archived and removed from the active list.',
             });
             await refreshData();
        }
    };

    const deleteMultipleTenants = async (tenantIds: string[]) => {
        const result = await deleteMultipleTenantsAction(tenantIds);
        if (result.error) {
            handleError(new Error(result.error), 'archiving multiple tenants');
        } else {
            toast({
                title: `${tenantIds.length} Tenant(s) Archived`,
                description: 'The selected tenants have been archived.',
            });
            await refreshData();
        }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const formData = new FormData();
      Object.entries(expense).forEach(([key, value]) => formData.append(key, String(value)));
      const result = await saveExpenseAction(formData);
       if (result.error) {
            handleError(new Error(result.error), 'adding expense');
        } else {
            await refreshData();
        }
    };

    const addExpensesBatch = async (expenses: Omit<Expense, 'id' | 'created_at'>[]) => {
        const result = await addExpensesBatchAction(expenses);
        if (result.error) {
            handleError(new Error(result.error), 'batch adding expenses');
        } else {
            toast({ title: "Import Successful", description: `${result.count} expenses have been added.` });
            await refreshData();
        }
        return result;
    };


    const updateExpense = async (updatedExpense: Expense) => {
      try {
        const formData = new FormData();
        formData.append('expenseId', updatedExpense.id);
        formData.append('date', updatedExpense.date);
        formData.append('category', updatedExpense.category);
        formData.append('amount', String(updatedExpense.amount));
        formData.append('description', updatedExpense.description);
        formData.append('status', updatedExpense.status);
        
        const result = await saveExpenseAction(formData);
        if (result.error) {
             handleError(new Error(result.error), 'updating expense');
        } else {
             setData(prev => ({
                ...prev,
                expenses: prev.expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
            }));
        }
      } catch (error) {
        handleError(error, 'updating expense');
      }
    };

    const deleteExpense = async (expenseId: string) => {
        const formData = new FormData();
        formData.append('expenseId', expenseId);
        const result = await deleteExpenseAction(formData);

        if (result.error) {
            handleError(new Error(result.error), 'deleting expense');
        } else {
             setData(prev => ({
                ...prev,
                expenses: prev.expenses.filter(exp => exp.id !== expenseId)
            }));
        }
    };

    const deleteMultipleExpenses = async (expenseIds: string[]) => {
        const result = await deleteMultipleExpensesAction(expenseIds);
        if (result.error) {
            handleError(new Error(result.error), 'deleting multiple expenses');
        } else {
             setData(prev => ({
                ...prev,
                expenses: prev.expenses.filter(exp => !expenseIds.includes(exp.id))
            }));
        }
    };
    
    const addRentEntry = async (rentEntryData: NewRentEntry, year: number, month: number) => {
        const tenantResult = await findOrCreateTenantAction({
            name: rentEntryData.name,
            property: rentEntryData.property,
            rent: rentEntryData.rent,
            join_date: new Date(year, month, 1).toISOString().split('T')[0],
            email: rentEntryData.name ? `${rentEntryData.name.replace(/\s+/g, '.').toLowerCase()}@example.com` : 'tenant@example.com',
            status: 'Active',
            avatar: rentEntryData.avatar,
        });

        if (tenantResult.error || !tenantResult.data) {
             handleError(new Error(tenantResult.error || 'Failed to create tenant for new rent entry.'), 'creating rent entry');
             return;
        }

        const newEntry = {
            ...rentEntryData,
            tenant_id: tenantResult.data.id,
            avatar: tenantResult.data.avatar,
            year: year,
            month: month,
            due_date: new Date(year, month, 1).toISOString().split('T')[0],
        }

        const { data: insertedEntry, error } = await supabase.from('rent_entries').insert(newEntry).select().single();
        if (error) {
             handleError(error, 'adding rent entry');
        } else {
             setData(prev => ({ ...prev, rentData: [...prev.rentData, insertedEntry] }));
        }
    };

    const addRentEntriesBatch = async (rentEntriesData: Omit<NewRentEntry, 'tenant_id' | 'avatar'>[], year: number, month: number) => {
      try {
        const tenantPromises = rentEntriesData.map(entry => 
            findOrCreateTenantAction({
                name: entry.name,
                property: entry.property,
                rent: entry.rent,
                join_date: new Date(year, month, 1).toISOString().split('T')[0],
                email: entry.name ? `${entry.name.replace(/\s+/g, '.').toLowerCase()}@example.com` : 'tenant@example.com',
                status: 'Active',
            })
        );
        const tenantsResult = await Promise.all(tenantPromises);

        const newEntries = rentEntriesData.map((entry, index) => {
            const tenant = tenantsResult[index];
            if (!tenant || tenant.error) {
                handleError(new Error(tenant?.error || `Failed to find or create tenant for ${entry.name}`), `batch tenant processing`);
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
            handleError(new Error(result.error), 'batch adding rent entries');
        } else {
             toast({ title: "Import Successful", description: `${result.count} entries have been added to ${months[month]}, ${year}.` });
             await refreshData();
        }
      } catch (error) {
        handleError(error, 'batch adding rent entries');
      }
    };
    
    const updateRentEntry = async (updatedRentEntry: RentEntry) => {
        const { id, ...rentEntryData } = updatedRentEntry;
        const { error } = await supabase.from('rent_entries').update(rentEntryData).eq('id', id);
        if (error) {
            handleError(error, 'updating rent entry');
        } else {
            setData(prev => ({
                ...prev,
                rentData: prev.rentData.map(re => re.id === id ? updatedRentEntry : re)
            }));
        }
    };
    
    const deleteRentEntry = async (rentEntryId: string) => {
        const result = await deleteRentEntryAction(rentEntryId);
        if (result.error) {
            handleError(new Error(result.error), 'deleting rent entry');
        } else {
            setData(prev => ({
                ...prev,
                rentData: prev.rentData.filter(re => re.id !== rentEntryId)
            }));
        }
    };

    const deleteMultipleRentEntries = async (rentEntryIds: string[]) => {
        const result = await deleteMultipleRentEntriesAction(rentEntryIds);
        if (result.error) {
            handleError(new Error(result.error), 'deleting multiple rent entries');
        } else {
            setData(prev => ({
                ...prev,
                rentData: prev.rentData.filter(re => !rentEntryIds.includes(re.id))
            }));
        }
    };
    
    const syncTenantsForMonth = async (year: number, month: number) => {
        const formData = new FormData();
        formData.append('year', String(year));
        formData.append('month', String(month));
        const result = await syncTenantsAction(formData);

        if (result.error) {
            handleError(new Error(result.error), 'syncing tenants to rent roll');
            return;
        }
        
        if (result.count > 0) {
            toast({ title: "Sync Complete", description: `${result.count} tenant(s) have been added to the rent roll.` });
            await refreshData();
        } else {
            toast({ title: "Already up to date", description: result.message || "All active tenants are already in the rent roll for this month." });
        }
    };
    
    const syncExpensesFromPreviousMonth = async (year: number, month: number) => {
        const formData = new FormData();
        formData.append('year', String(year));
        formData.append('month', String(month));
        const result = await syncExpensesAction(formData);

        if (result.error) {
            handleError(new Error(result.error), 'syncing expenses to current month');
            return;
        }
        
        if (result.count > 0) {
            toast({ title: "Sync Complete", description: `${result.count} expense(s) from the previous month have been copied.` });
            await refreshData();
        } else {
            toast({ title: "No new expenses to sync", description: result.message || "There were no new expenses to copy from the previous month." });
        }
    };

    const getAllData = (): Omit<AppData, 'propertySettings'> => {
        return { ...data, zakatBankDetails: settings.zakatBankDetails, propertySettings: null };
    };

    const restoreAllData = async (backupData: Omit<AppData, 'propertySettings'>) => {
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
        handleError(error, "restoring data");
        setLoading(false);
      }
    };
    
    const getRentEntryById = (id: string): RentEntry | null => {
        return data.rentData.find(entry => entry.id === id) || null;
    }
    
    const addWorkDetailsBatch = async (workDetails: Omit<WorkDetail, 'id' | 'created_at'>[]) => {
      try {
        const result = await addWorkDetailsBatchAction(workDetails);
        if (result.error) {
            handleError(new Error(result.error), 'batch adding work details');
        } else {
            toast({ title: "Import Successful", description: `${result.count} work items have been imported.` });
            await refreshData();
        }
      } catch(error) {
        handleError(error, 'batch adding work details');
      }
    };

    type NewRentEntry = Omit<RentEntry, 'id' | 'avatar' | 'year' | 'month' | 'due_date' | 'created_at'> & { avatar?: string, tenant_id?: string };

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
