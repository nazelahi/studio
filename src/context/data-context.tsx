
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Tenant, Expense, RentEntry, PropertySettings } from '@/types';
import { parseISO, getMonth, getYear } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AppData {
  tenants: Tenant[];
  expenses: Expense[];
  rentData: RentEntry[];
  propertySettings: PropertySettings | null;
}

type NewRentEntry = Omit<RentEntry, 'id' | 'avatar' | 'year' | 'month' | 'dueDate' | 'created_at'>;


interface DataContextType extends AppData {
  addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  updateTenant: (tenant: Tenant) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  deleteMultipleExpenses: (expenseIds: string[]) => Promise<void>;
  addRentEntry: (rentEntry: NewRentEntry, year: number, month: number) => Promise<void>;
  addRentEntriesBatch: (rentEntries: Omit<NewRentEntry, 'tenantId' | 'avatar'>[], year: number, month: number) => Promise<void>;
  updateRentEntry: (rentEntry: RentEntry) => Promise<void>;
  deleteRentEntry: (rentEntryId: string) => Promise<void>;
  deleteMultipleRentEntries: (rentEntryIds: string[]) => Promise<void>;
  syncTenantsForMonth: (year: number, month: number) => Promise<number>;
  updatePropertySettings: (settings: Omit<PropertySettings, 'id'>) => Promise<void>;
  loading: boolean;
  getAllData: () => AppData;
  restoreAllData: (backupData: AppData) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>({ tenants: [], expenses: [], rentData: [], propertySettings: null });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const handleError = (error: any, context: string) => {
        console.error(`Error in ${context}:`, error);
        toast({
            title: `Error: ${context}`,
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    };

    const fetchData = useCallback(async () => {
        if (!supabase) {
            console.log("Supabase not initialized, skipping fetch.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [tenantsRes, expensesRes, rentDataRes, propertySettingsRes] = await Promise.all([
                supabase.from('tenants').select('*'),
                supabase.from('expenses').select('*'),
                supabase.from('rent_entries').select('*'),
                supabase.from('property_settings').select('*').eq('id', 1).single()
            ]);

            if (tenantsRes.error) throw tenantsRes.error;
            if (expensesRes.error) throw expensesRes.error;
            if (rentDataRes.error) throw rentDataRes.error;
            if (propertySettingsRes.error) throw propertySettingsRes.error;
            
            setData({
                tenants: tenantsRes.data as Tenant[],
                expenses: expensesRes.data as Expense[],
                rentData: rentDataRes.data as RentEntry[],
                propertySettings: propertySettingsRes.data as PropertySettings,
            });
        } catch (error) {
            handleError(error, 'fetching data');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    console.log('Change received!', payload);
                    fetchData();
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to real-time updates!');
                }
                if (err) {
                    const dbError = err as any;
                    console.error("Realtime subscription error:", dbError);
                    handleError(new Error(dbError.message || "Realtime was unable to connect to the project database"), 'subscribing to real-time updates');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, toast]);

    const addTenant = async (tenantData: Omit<Tenant, 'id'>) => {
        if (!supabase) return;

        const { data: newTenant, error } = await supabase.from('tenants').insert([tenantData]).select().single();
        if (error) {
            handleError(error, 'adding tenant');
            return;
        }

        if (newTenant) {
            const joinDate = parseISO(newTenant.joinDate);
            const month = getMonth(joinDate);
            const year = getYear(joinDate);

            const newRentEntryData = {
                tenantId: newTenant.id,
                name: newTenant.name,
                property: newTenant.property,
                rent: newTenant.rent,
                status: 'Pending' as const,
                avatar: newTenant.avatar,
                dueDate: new Date(year, month, 1).toISOString().split('T')[0],
                year,
                month,
            };
            const { error: rentError } = await supabase.from('rent_entries').insert([newRentEntryData]);
            if (rentError) handleError(rentError, 'auto-creating rent entry');
        }
    };

    const updateTenant = async (updatedTenant: Tenant) => {
        if (!supabase) return;
        const { id, ...tenantData } = updatedTenant;
        const { error } = await supabase.from('tenants').update(tenantData).eq('id', id);
        if (error) {
            handleError(error, 'updating tenant');
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
            .eq('tenantId', id)
            .neq('status', 'Paid')
            .gt('dueDate', new Date().toISOString());

        if (rentUpdateError) {
            handleError(rentUpdateError, 'syncing future rent entries');
        }
    };

    const deleteTenant = async (tenantId: string) => {
        if (!supabase) return;
        
        const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
        if (error) {
            handleError(error, 'deleting tenant');
        }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
        if (!supabase) return;
        const { error } = await supabase.from('expenses').insert([expense]);
        if (error) handleError(error, 'adding expense');
    };

    const updateExpense = async (updatedExpense: Expense) => {
        if (!supabase) return;
        const { id, ...expenseData } = updatedExpense;
        const { error } = await supabase.from('expenses').update(expenseData).eq('id', id);
        if (error) handleError(error, 'updating expense');
    };

    const deleteExpense = async (expenseId: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) handleError(error, 'deleting expense');
    };

    const deleteMultipleExpenses = async (expenseIds: string[]) => {
        if (!supabase || expenseIds.length === 0) return;
        const { error } = await supabase.from('expenses').delete().in('id', expenseIds);
        if (error) handleError(error, 'deleting multiple expenses');
    }

    const addRentEntry = async (rentEntryData: NewRentEntry, year: number, month: number) => {
        if (!supabase) return;
        const entryWithAvatar = { ...rentEntryData, avatar: rentEntryData.avatar || 'https://placehold.co/80x80.png' };
        await addRentEntriesBatch([entryWithAvatar], year, month);
    };

    const addRentEntriesBatch = async (rentEntriesData: Omit<NewRentEntry, 'tenantId' | 'avatar'>[], year: number, month: number) => {
        if (!supabase) return;

        const newEntriesWithDetails = await Promise.all(rentEntriesData.map(async (rentEntryData) => {
            const fullEntryData = rentEntryData as NewRentEntry;
            let tenantInfo = { id: fullEntryData.tenantId, avatar: fullEntryData.avatar };

            if (!tenantInfo.id) {
                let { data: existingTenant } = await supabase
                    .from('tenants')
                    .select('id, avatar')
                    .eq('name', rentEntryData.name)
                    .eq('property', rentEntryData.property)
                    .maybeSingle();

                if (!existingTenant) {
                    const newTenantData = {
                        name: rentEntryData.name,
                        property: rentEntryData.property,
                        rent: rentEntryData.rent,
                        joinDate: new Date(year, month, 1).toISOString().split('T')[0],
                        avatar: 'https://placehold.co/80x80.png',
                        status: 'Pending',
                        email: `${rentEntryData.name.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    };
                    const { data: newTenant, error } = await supabase.from('tenants').insert(newTenantData).select().single();
                    if (error) {
                        handleError(error, `auto-creating tenant for ${rentEntryData.name}`);
                        return null;
                    }
                    existingTenant = newTenant;
                }
                tenantInfo.id = existingTenant?.id;
                tenantInfo.avatar = existingTenant?.avatar;
            }

            return {
                ...rentEntryData,
                tenantId: tenantInfo.id,
                avatar: tenantInfo.avatar || 'https://placehold.co/80x80.png',
                dueDate: new Date(year, month, 1).toISOString().split('T')[0],
                year,
                month,
            };
        }));
        
        const validNewEntries = newEntriesWithDetails.filter((entry): entry is RentEntry => entry !== null);
        if(validNewEntries.length > 0) {
            const { error } = await supabase.from('rent_entries').insert(validNewEntries);
            if (error) handleError(error, 'batch adding rent entries');
        }
    };
    
    const updateRentEntry = async (updatedRentEntry: RentEntry) => {
        if (!supabase) return;
        const { id, ...rentEntryData } = updatedRentEntry;
        const { error } = await supabase.from('rent_entries').update(rentEntryData).eq('id', id);
        if (error) handleError(error, 'updating rent entry');
    };
    
    const deleteRentEntry = async (rentEntryId: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('rent_entries').delete().eq('id', rentEntryId);
        if (error) handleError(error, 'deleting rent entry');
    };

    const deleteMultipleRentEntries = async (rentEntryIds: string[]) => {
        if (!supabase || rentEntryIds.length === 0) return;
        const { error } = await supabase.from('rent_entries').delete().in('id', rentEntryIds);
        if (error) handleError(error, 'deleting multiple rent entries');
    };
    
    const syncTenantsForMonth = async (year: number, month: number): Promise<number> => {
        if (!supabase) return 0;
        const selectedMonthStartDate = new Date(year, month, 1);
        
        const { data: rentDataForMonth, error: rentDataError } = await supabase
            .from('rent_entries')
            .select('tenantId')
            .eq('year', year)
            .eq('month', month);

        if (rentDataError) {
            handleError(rentDataError, 'fetching rent data for sync');
            return 0;
        }
        const existingTenantIds = new Set(rentDataForMonth.map(e => e.tenantId));

        const { data: allTenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('*');

        if (tenantsError) {
            handleError(tenantsError, 'fetching tenants for sync');
            return 0;
        }

        const tenantsToSync = allTenants.filter(tenant => {
            if (existingTenantIds.has(tenant.id)) {
                return false; 
            }
            if (!tenant.joinDate) return false;
            try {
                const joinDate = parseISO(tenant.joinDate);
                return joinDate <= selectedMonthStartDate;
            } catch {
                return false; 
            }
        });

        if (tenantsToSync.length === 0) {
            return 0; 
        }
        
        const newRentEntries = tenantsToSync.map(tenant => ({
            tenantId: tenant.id,
            name: tenant.name,
            property: tenant.property,
            rent: tenant.rent,
            dueDate: new Date(year, month, 1).toISOString().split("T")[0],
            status: "Pending" as const,
            avatar: tenant.avatar,
            year: year,
            month: month,
        }));

        const { error } = await supabase.from('rent_entries').insert(newRentEntries);

        if (error) {
            handleError(error, 'syncing tenants to rent roll');
            return 0;
        }

        return tenantsToSync.length;
    };
    
    const updatePropertySettings = async (settings: Omit<PropertySettings, 'id'>) => {
        if (!supabase) return;
        const { error } = await supabase.from('property_settings').update(settings).eq('id', 1);
        if (error) handleError(error, 'updating property settings');
    }

    const getAllData = () => {
        return data;
    };

    const restoreAllData = (backupData: AppData) => {
        if (backupData && backupData.tenants && backupData.expenses && backupData.rentData) {
            // This needs to be extended if property_settings are part of backup/restore
            setData(backupData);
            window.location.reload();
        } else {
            handleError(new Error("Invalid backup data format."), "restoring data");
        }
    };


    return (
        <DataContext.Provider value={{ ...data, addTenant, updateTenant, deleteTenant, addExpense, updateExpense, deleteExpense, deleteMultipleExpenses, addRentEntry, addRentEntriesBatch, updateRentEntry, deleteRentEntry, deleteMultipleRentEntries, syncTenantsForMonth, updatePropertySettings, loading, getAllData, restoreAllData }}>
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

    