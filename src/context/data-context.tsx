
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Tenant, Expense, RentEntry } from '@/types';
import { parseISO, startOfMonth, isFuture, getMonth, getYear } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AppData {
  tenants: Tenant[];
  expenses: Expense[];
  rentData: RentEntry[];
}

interface DataContextType extends AppData {
  addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  updateTenant: (tenant: Tenant) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addRentEntry: (rentEntry: Omit<RentEntry, 'id' | 'tenantId' | 'avatar' | 'year' | 'month' | 'dueDate'>, year: number, month: number) => Promise<void>;
  updateRentEntry: (rentEntry: RentEntry) => Promise<void>;
  deleteRentEntry: (rentEntryId: string) => Promise<void>;
  syncTenantsForMonth: (year: number, month: number) => Promise<number>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>({ tenants: [], expenses: [], rentData: [] });
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
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [tenantsRes, expensesRes, rentDataRes] = await Promise.all([
                supabase.from('tenants').select('*'),
                supabase.from('expenses').select('*'),
                supabase.from('rent_entries').select('*')
            ]);

            if (tenantsRes.error) throw tenantsRes.error;
            if (expensesRes.error) throw expensesRes.error;
            if (rentDataRes.error) throw rentDataRes.error;

            setData({
                tenants: tenantsRes.data as Tenant[],
                expenses: expensesRes.data as Expense[],
                rentData: rentDataRes.data as RentEntry[],
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
                    console.error("Realtime subscription error:", err);
                    handleError(new Error("Realtime was unable to connect to the project database"), 'subscribing to real-time updates');
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
            // Automatically add a rent entry for the current month
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

        // Also update future, unpaid rent entries
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
        
        // Only delete the tenant, not their rent history.
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

    const addRentEntry = async (rentEntryData: Omit<RentEntry, 'id' | 'tenantId' | 'avatar' | 'year' | 'month' | 'dueDate' | 'created_at'>, year: number, month: number) => {
        if (!supabase) return;

        // Check for an existing tenant based on name and property
        let { data: existingTenant } = await supabase.from('tenants').select('id, avatar').eq('name', rentEntryData.name).eq('property', rentEntryData.property).maybeSingle();

        // If tenant doesn't exist, create one
        if (!existingTenant) {
            const newTenantData = {
                name: rentEntryData.name,
                property: rentEntryData.property,
                rent: rentEntryData.rent,
                joinDate: new Date(year, month, 1).toISOString().split('T')[0],
                avatar: 'https://placehold.co/80x80.png',
                status: 'Pending',
            };
            const { data: newTenant, error } = await supabase.from('tenants').insert(newTenantData).select().single();
            if (error) {
                handleError(error, 'auto-creating tenant from rent entry');
                return;
            }
            existingTenant = newTenant;
        }

        const newEntryData = {
            ...rentEntryData,
            tenantId: existingTenant?.id,
            avatar: existingTenant?.avatar || 'https://placehold.co/80x80.png',
            dueDate: new Date(year, month, 1).toISOString().split('T')[0],
            year,
            month,
        };
        const { error } = await supabase.from('rent_entries').insert([newEntryData]);
        if (error) handleError(error, 'adding rent entry');
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
    
    const syncTenantsForMonth = async (year: number, month: number): Promise<number> => {
        if (!supabase) return 0;
        const selectedMonthStartDate = new Date(year, month, 1);

        const tenantsInMonth = data.rentData
            .filter(entry => entry.month === month && entry.year === year)
            .map(entry => entry.tenantId);

        const tenantsToSync = data.tenants.filter(tenant => {
            if (!tenant.joinDate) return false;
            const joinDate = parseISO(tenant.joinDate);
            return !tenantsInMonth.includes(tenant.id) && joinDate <= selectedMonthStartDate;
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
            year,
            month,
        }));
        
        const { error } = await supabase.from('rent_entries').insert(newRentEntries);

        if (error) {
            handleError(error, 'syncing tenants');
            return 0;
        }

        return tenantsToSync.length;
    };

    return (
        <DataContext.Provider value={{ ...data, addTenant, updateTenant, deleteTenant, addExpense, updateExpense, deleteExpense, addRentEntry, updateRentEntry, deleteRentEntry, syncTenantsForMonth, loading }}>
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
