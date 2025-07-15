
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Tenant, Expense, RentEntry, PropertySettings, Deposit, ZakatTransaction, Notice, WorkDetail, ZakatBankDetail, ToastFn } from '@/types';
import { parseISO, getMonth, getYear, subMonths, format, subYears } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';


interface AppData {
  tenants: Tenant[];
  expenses: Expense[];
  rentData: RentEntry[];
  propertySettings: PropertySettings | null;
  deposits: Deposit[];
  zakatTransactions: ZakatTransaction[];
  zakatBankDetails: ZakatBankDetail[];
  notices: Notice[];
  workDetails: WorkDetail[];
}

type NewRentEntry = Omit<RentEntry, 'id' | 'avatar' | 'year' | 'month' | 'due_date' | 'created_at' | 'deleted_at'> & { avatar?: string, tenant_id?: string };


interface DataContextType extends AppData {
  addTenant: (tenant: Omit<Tenant, 'id' | 'deleted_at' | 'created_at'>, toast: ToastFn, files?: File[]) => Promise<void>;
  updateTenant: (tenant: Tenant, toast: ToastFn, files?: File[]) => Promise<void>;
  deleteTenant: (tenantId: string, toast: ToastFn) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'deleted_at' | 'created_at'>, toast: ToastFn) => Promise<void>;
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
  updatePropertySettings: (settings: Omit<PropertySettings, 'id'>, toast: ToastFn) => Promise<void>;
  loading: boolean;
  getAllData: () => AppData;
  restoreAllData: (backupData: AppData, toast: ToastFn) => void;
  refreshData: () => Promise<void>;
  getRentEntryById: (id: string) => RentEntry | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const handleError = (error: any, context: string, toast: ToastFn) => {
    const errorMessage = error.message || 'An unexpected error occurred.';
    console.error(`Error in ${context}:`, errorMessage, error);
    toast({
        title: `Error: ${context}`,
        description: errorMessage,
        variant: 'destructive',
    });
};


export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>({ tenants: [], expenses: [], rentData: [], propertySettings: null, deposits: [], zakatTransactions: [], notices: [], workDetails: [], zakatBankDetails: [] });
    const [loading, setLoading] = useState(true);
    
    const { user, loading: authLoading } = useAuth();
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (!supabase) {
                console.log("Supabase not initialized, skipping data fetch.");
                return;
            }

            const twoYearsAgo = format(subYears(new Date(), 2), 'yyyy-MM-dd');

            const [tenantsRes, expensesRes, rentDataRes, propertySettingsRes, depositsRes, zakatRes, noticesRes, workDetailsRes, zakatBankDetailsRes] = await Promise.all([
                supabase.from('tenants').select('*').is('deleted_at', null).gte('created_at', twoYearsAgo).order('name', { ascending: true }),
                supabase.from('expenses').select('*').is('deleted_at', null).gte('date', twoYearsAgo).order('date', { ascending: false }),
                supabase.from('rent_entries').select('*').is('deleted_at', null).gte('due_date', twoYearsAgo).order('due_date', { ascending: false }),
                supabase.from('property_settings').select('*').eq('id', 1).maybeSingle(),
                supabase.from('deposits').select('*').gte('deposit_date', twoYearsAgo).order('deposit_date', { ascending: false }),
                supabase.from('zakat_transactions').select('*').gte('transaction_date', twoYearsAgo).order('transaction_date', { ascending: false }),
                supabase.from('notices').select('*').gte('created_at', twoYearsAgo).order('created_at', { ascending: false }),
                supabase.from('work_details').select('*').is('deleted_at', null).gte('created_at', twoYearsAgo).order('created_at', { ascending: false }),
                supabase.from('zakat_bank_details').select('*').order('bank_name', { ascending: true }),
            ]);

            if (tenantsRes.error) throw tenantsRes.error;
            if (expensesRes.error) throw expensesRes.error;
            if (rentDataRes.error) throw rentDataRes.error;
            if (depositsRes.error) throw depositsRes.error;
            if (zakatRes.error) throw zakatRes.error;
            if (noticesRes.error) throw noticesRes.error;
            if (workDetailsRes.error) throw workDetailsRes.error;
            if (zakatBankDetailsRes.error) throw zakatBankDetailsRes.error;
            if (propertySettingsRes.error && propertySettingsRes.error.code !== 'PGRST116') {
                 throw propertySettingsRes.error;
            }
            
            setData({
                tenants: tenantsRes.data as Tenant[],
                expenses: expensesRes.data as Expense[],
                rentData: rentDataRes.data as RentEntry[],
                propertySettings: propertySettingsRes.data as PropertySettings,
                deposits: depositsRes.data as Deposit[],
                zakatTransactions: zakatRes.data as ZakatTransaction[],
                notices: noticesRes.data as Notice[],
                workDetails: workDetailsRes.data as WorkDetail[],
                zakatBankDetails: zakatBankDetailsRes.data as ZakatBankDetail[],
            });
        } catch (error: any) {
            console.error(`Error in fetching data:`, error.message, error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [fetchData, authLoading]);
    
    useEffect(() => {
        if (!supabase) return;

        const tables = [
            'tenants', 'expenses', 'rent_entries', 'property_settings', 
            'deposits', 'zakat_transactions', 'notices', 'work_details', 'zakat_bank_details'
        ];
        
        const subscriptions = tables.map(table => {
            return supabase
                .channel(`public:${table}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: table },
                    (payload) => { console.log(`New data in ${table}, refreshing...`); fetchData(); }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: table },
                    (payload) => { console.log(`Data updated in ${table}, refreshing...`); fetchData(); }
                )
                 .on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: table },
                    (payload) => { console.log(`Data deleted in ${table}, refreshing...`); fetchData(); }
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
    }, [fetchData]);

    const uploadFiles = async (tenantId: string, files: File[], toast: ToastFn): Promise<string[]> => {
        if (!supabase || files.length === 0) return [];

        const uploadPromises = files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${tenantId}/${new Date().getTime()}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('tenant-documents')
                .upload(fileName, file);

            if (uploadError) {
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
    };

    const undoDelete = async (table: string, ids: string[], toast: ToastFn) => {
        if (!supabase) return;
        const { error } = await supabase.from(table).update({ deleted_at: null }).in('id', ids);
        if (error) {
            handleError(error, `undoing delete on ${table}`, toast);
        } else {
            toast({ title: 'Restored', description: `The item(s) have been restored.` });
            await fetchData();
        }
    }

    const addTenant = async (tenantData: Omit<Tenant, 'id' | 'created_at' | 'deleted_at'>, toast: ToastFn, files: File[] = []) => {
        if (!supabase) return;
        
        // Ensure optional fields are not undefined
        const cleanTenantData = { ...tenantData };
        if (cleanTenantData.date_of_birth === '') delete (cleanTenantData as any).date_of_birth;
        if (cleanTenantData.father_name === '') delete (cleanTenantData as any).father_name;
        if (cleanTenantData.address === '') delete (cleanTenantData as any).address;
        if (cleanTenantData.nid_number === '') delete (cleanTenantData as any).nid_number;

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
        await fetchData();
    };

    const updateTenant = async (updatedTenant: Tenant, toast: ToastFn, files: File[] = []) => {
        if (!supabase) return;
        const { id, ...tenantData } = updatedTenant;
        
        const uploadedUrls = await uploadFiles(id, files, toast);
        const finalDocuments = [...(tenantData.documents || []), ...uploadedUrls];

        const cleanTenantData = { ...tenantData, documents: finalDocuments };
        if (cleanTenantData.date_of_birth === '') delete (cleanTenantData as any).date_of_birth;
        if (cleanTenantData.father_name === '') delete (cleanTenantData as any).father_name;
        if (cleanTenantData.address === '') delete (cleanTenantData as any).address;
        if (cleanTenantData.nid_number === '') delete (cleanTenantData as any).nid_number;

        const { error } = await supabase.from('tenants').update(cleanTenantData).eq('id', id);
        if (error) {
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
        await fetchData();
    };

    const deleteTenant = async (tenantId: string, toast: ToastFn) => {
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
        await fetchData();
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'deleted_at'>, toast: ToastFn) => {
        if (!supabase) return;
        const { error } = await supabase.from('expenses').insert([expense]);
        if (error) handleError(error, 'adding expense', toast);
        await fetchData();
    };

    const updateExpense = async (updatedExpense: Expense, toast: ToastFn) => {
        if (!supabase) return;
        const { id, ...expenseData } = updatedExpense;
        const { error } = await supabase.from('expenses').update(expenseData).eq('id', id);
        if (error) handleError(error, 'updating expense', toast);
        await fetchData();
    };

    const deleteExpense = async (expenseId: string, toast: ToastFn) => {
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
        await fetchData();
    };

    const deleteMultipleExpenses = async (expenseIds: string[], toast: ToastFn) => {
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
        await fetchData();
    }

    const addRentEntry = async (rentEntryData: NewRentEntry, year: number, month: number, toast: ToastFn) => {
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
        await fetchData();
    };

    const addRentEntriesBatch = async (rentEntriesData: Omit<NewRentEntry, 'tenant_id' | 'avatar'>[], year: number, month: number, toast: ToastFn) => {
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
        await fetchData();
    };
    
    const updateRentEntry = async (updatedRentEntry: RentEntry, toast: ToastFn) => {
        if (!supabase) return;
        const { id, ...rentEntryData } = updatedRentEntry;
        const { error } = await supabase.from('rent_entries').update(rentEntryData).eq('id', id);
        if (error) handleError(error, 'updating rent entry', toast);
        await fetchData();
    };
    
    const deleteRentEntry = async (rentEntryId: string, toast: ToastFn) => {
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
        await fetchData();
    };

    const deleteMultipleRentEntries = async (rentEntryIds: string[], toast: ToastFn) => {
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
        await fetchData();
    };
    
    const syncTenantsForMonth = async (year: number, month: number, toast: ToastFn): Promise<number> => {
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

        await fetchData();
        return tenantsToSync.length;
    };
    
    const syncExpensesFromPreviousMonth = async (year: number, month: number, toast: ToastFn): Promise<number> => {
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

        await fetchData();
        return newExpenses.length;
    };

    const updatePropertySettings = async (settings: Omit<PropertySettings, 'id'>, toast: ToastFn) => {
        if (!supabase) return;
        const { error } = await supabase.from('property_settings').update(settings).eq('id', 1);
        if (error) handleError(error, 'updating property settings', toast);
        await fetchData();
    }

    const getAllData = () => {
        return data;
    };

    const restoreAllData = async (backupData: AppData, toast: ToastFn) => {
      // This is a simplified restore. A real-world scenario would be much more complex,
      // handling conflicts, new vs. old data, etc.
      // For this app, we'll do a "delete all and insert" strategy.
      // This is destructive and should be used with caution.
      if (!supabase) return;

      try {
        setLoading(true);
        
        // Order of operations matters due to foreign key constraints if they existed.
        // For this app, it's simpler.
        const tables = ['rent_entries', 'expenses', 'tenants', 'deposits', 'notices', 'work_details', 'zakat_transactions', 'zakat_bank_details'];
        
        // Delete all existing data
        for (const table of tables) {
            const { error: deleteError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // A bit of a hack to delete all
            if (deleteError) throw new Error(`Failed to clear ${table}: ${deleteError.message}`);
        }
        
        // Insert new data
        // We have to remove the `propertySettings` as it's not a list to be inserted.
        const { propertySettings, ...dataToInsert } = backupData;

        for (const [table, records] of Object.entries(dataToInsert)) {
            const tableName = table === 'rentData' ? 'rent_entries' : table; // map state name to table name
             if (records.length > 0) {
                // Supabase insert doesn't like `id` field on some tables if it's auto-generated,
                // and it doesn't like extra fields. Let's be careful.
                const recordsToInsert = records.map((r: any) => {
                    const { created_at, id, ...rest } = r; // Strip fields that should be auto-generated
                    return rest;
                });

                if (recordsToInsert.length > 0) {
                    const { error: insertError } = await supabase.from(tableName).insert(recordsToInsert);
                    if (insertError) throw new Error(`Failed to insert into ${tableName}: ${insertError.message}`);
                }
            }
        }
        
        toast({ title: "Restore Complete", description: "Your data has been restored from the backup file. The application will now reload." });
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


    return (
        <DataContext.Provider value={{ ...data, addTenant, updateTenant, deleteTenant, addExpense, updateExpense, deleteExpense, deleteMultipleExpenses, addRentEntry, addRentEntriesBatch, updateRentEntry, deleteRentEntry, deleteMultipleRentEntries, syncTenantsForMonth, syncExpensesFromPreviousMonth, updatePropertySettings, loading, getAllData, restoreAllData, refreshData: fetchData, getRentEntryById }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
