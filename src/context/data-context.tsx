
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Tenant, Expense, RentEntry } from '@/types';
import { parseISO, startOfMonth } from 'date-fns';

interface AppData {
  tenants: Tenant[];
  expenses: Expense[];
  rentData: RentEntry[];
}

interface DataContextType extends AppData {
  addTenant: (tenant: Omit<Tenant, 'id'>) => void;
  updateTenant: (tenant: Tenant) => void;
  deleteTenant: (tenantId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  addRentEntry: (rentEntry: Omit<RentEntry, 'id' | 'tenantId' | 'avatar' | 'year' | 'month' | 'dueDate'>, year: number, month: number) => void;
  updateRentEntry: (rentEntry: RentEntry) => void;
  deleteRentEntry: (rentEntryId: string) => void;
  syncTenantsForMonth: (year: number, month: number) => number;
}

const initialTenants: Tenant[] = [
    { id: "T001", name: "Alice Johnson", email: "alice.j@email.com", phone: "555-1234", property: "Apt 101", rent: 1200, joinDate: "2023-01-15", notes: "Prefers quiet hours after 10 PM.", status: "Paid", avatar: "https://placehold.co/80x80.png" },
    { id: "T002", name: "Bob Smith", email: "bob.smith@email.com", phone: "555-5678", property: "Apt 102", rent: 1250, joinDate: "2022-07-20", notes: "Has a small dog named Sparky.", status: "Pending", avatar: "https://placehold.co/80x80.png" },
    { id: "T003", name: "Charlie Brown", email: "charlie.b@email.com", phone: "555-8765", property: "Apt 201", rent: 1400, joinDate: "2023-08-01", notes: "", status: "Overdue", avatar: "https://placehold.co/80x80.png" },
    { id: "T004", name: "Diana Prince", property: "Apt 202", rent: 1450, status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'diana.p@email.com', joinDate: '2024-01-01' },
    { id: "T005", name: "Ethan Hunt", property: "Apt 301", rent: 1600, status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'ethan.h@email.com', joinDate: '2024-02-01' },
    { id: "T006", name: "Frank Castle", property: "Apt 101", rent: 1200, status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'frank.c@email.com', joinDate: '2024-03-01' },
];

const initialExpenses: Expense[] = [
  { id: "EXP001", date: "2024-07-15", category: "Maintenance", amount: 150.00, description: "Plumbing repair at Unit 101", status: "Reimbursed" },
  { id: "EXP002", date: "2024-07-12", category: "Utilities", amount: 75.50, description: "Common area electricity", status: "Pending" },
  { id: "EXP003", date: "2024-08-10", category: "Landscaping", amount: 200.00, description: "Monthly gardening service", status: "Reimbursed" },
  { id: "EXP004", date: "2024-08-05", category: "Supplies", amount: 45.25, description: "Cleaning supplies", status: "Pending" },
  { id: "EXP005", date: "2024-06-28", category: "Repairs", amount: 350.00, description: "Roof leak fix at Unit 204", status: "Reimbursed" },
];


const generateInitialRentData = (tenants: Tenant[]): RentEntry[] => {
    const rentData: RentEntry[] = [];
    const currentYear = new Date().getFullYear();
    tenants.forEach(tenant => {
        const joinDate = parseISO(tenant.joinDate);
        // Generate for last year and this year for demo
        for (const year of [currentYear -1, currentYear]) {
            const startMonth = joinDate.getFullYear() < year ? 0 : joinDate.getMonth();
            for (let monthIndex = startMonth; monthIndex < 12; monthIndex++) {
                const monthStartDate = new Date(year, monthIndex, 1);
                if (monthStartDate < startOfMonth(joinDate)) continue;

                const dueDate = new Date(year, monthIndex, 1);
                rentData.push({
                    id: `${tenant.id}-${year}-${monthIndex}`,
                    tenantId: tenant.id,
                    name: tenant.name,
                    property: tenant.property,
                    rent: tenant.rent,
                    dueDate: dueDate.toISOString().split("T")[0],
                    status: "Pending", // Default status
                    avatar: tenant.avatar,
                    year: year,
                    month: monthIndex
                });
            }
        }
    });
    return rentData;
};


const initialData: AppData = {
    tenants: initialTenants,
    expenses: initialExpenses,
    rentData: generateInitialRentData(initialTenants),
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>(() => {
        if (typeof window === 'undefined') {
            return initialData;
        }
        try {
            const item = window.localStorage.getItem('appData');
            return item ? JSON.parse(item) : initialData;
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            return initialData;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('appData', JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, [data]);

    const addTenant = (tenant: Omit<Tenant, 'id'>) => {
        setData(prevData => {
            const newTenant = { ...tenant, id: `T${Date.now()}` };
            return { ...prevData, tenants: [...prevData.tenants, newTenant] };
        });
    };

    const updateTenant = (updatedTenant: Tenant) => {
        setData(prevData => ({
            ...prevData,
            tenants: prevData.tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t)
        }));
    };

    const deleteTenant = (tenantId: string) => {
        setData(prevData => ({
            ...prevData,
            tenants: prevData.tenants.filter(t => t.id !== tenantId),
             rentData: prevData.rentData.filter(r => r.tenantId !== tenantId)
        }));
    };

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        setData(prevData => {
            const newExpense = { ...expense, id: `EXP${Date.now()}` };
            return { ...prevData, expenses: [...prevData.expenses, newExpense] };
        });
    };

    const updateExpense = (updatedExpense: Expense) => {
        setData(prevData => ({
            ...prevData,
            expenses: prevData.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e)
        }));
    };

    const deleteExpense = (expenseId: string) => {
        setData(prevData => ({
            ...prevData,
            expenses: prevData.expenses.filter(e => e.id !== expenseId)
        }));
    };

    const addRentEntry = (rentEntry: Omit<RentEntry, 'id' | 'tenantId' | 'avatar' | 'year' | 'month' | 'dueDate'>, year: number, month: number) => {
        setData(prevData => {
            const newEntry: RentEntry = {
                ...rentEntry,
                id: `RENT-${Date.now()}`,
                tenantId: `T-MANUAL-${Date.now()}`,
                avatar: 'https://placehold.co/80x80.png',
                dueDate: new Date(year, month, 1).toISOString().split('T')[0],
                year,
                month,
            };
            return { ...prevData, rentData: [...prevData.rentData, newEntry] };
        });
    };

    const updateRentEntry = (updatedRentEntry: RentEntry) => {
        setData(prevData => ({
            ...prevData,
            rentData: prevData.rentData.map(r => r.id === updatedRentEntry.id ? updatedRentEntry : r)
        }));
    };

    const deleteRentEntry = (rentEntryId: string) => {
        setData(prevData => ({
            ...prevData,
            rentData: prevData.rentData.filter(r => r.id !== rentEntryId)
        }));
    };
    
    const syncTenantsForMonth = (year: number, month: number): number => {
        let newEntriesCount = 0;
        setData(prevData => {
            const selectedMonthStartDate = new Date(year, month, 1);

            const tenantsInMonth = prevData.rentData
                .filter(entry => entry.month === month && entry.year === year)
                .map(entry => entry.tenantId);

            const tenantsToSync = prevData.tenants.filter(tenant => {
                const joinDate = parseISO(tenant.joinDate);
                return !tenantsInMonth.includes(tenant.id) && joinDate <= selectedMonthStartDate;
            });
            
            if (tenantsToSync.length === 0) {
                return prevData;
            }

            newEntriesCount = tenantsToSync.length;

            const newRentEntries: RentEntry[] = tenantsToSync.map(tenant => ({
                id: `${tenant.id}-${year}-${month}`,
                tenantId: tenant.id,
                name: tenant.name,
                property: tenant.property,
                rent: tenant.rent,
                dueDate: new Date(year, month, 1).toISOString().split("T")[0],
                status: "Pending",
                avatar: tenant.avatar,
                year,
                month,
            }));

            return {
                ...prevData,
                rentData: [...prevData.rentData, ...newRentEntries]
            };
        });
        return newEntriesCount;
    };

    return (
        <DataContext.Provider value={{ ...data, addTenant, updateTenant, deleteTenant, addExpense, updateExpense, deleteExpense, addRentEntry, updateRentEntry, deleteRentEntry, syncTenantsForMonth }}>
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
