
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { Expense } from '@/types'
import { format, getMonth, getYear, subMonths, parseISO } from 'date-fns'

const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function saveExpenseAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const expenseData = {
        date: formData.get('date') as string,
        category: formData.get('category') as string,
        amount: Number(formData.get('amount')),
        description: formData.get('description') as string,
        status: formData.get('status') as "Paid" | "Due",
    };
    
    const expenseId = formData.get('expenseId') as string | undefined;

    let error;

    if (expenseId) {
        // Update existing expense
        const { error: updateError } = await supabaseAdmin
            .from('expenses')
            .update(expenseData)
            .eq('id', expenseId);
        error = updateError;
    } else {
        // Insert new expense
        const { error: insertError } = await supabaseAdmin
            .from('expenses')
            .insert(expenseData);
        error = insertError;
    }

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}

export async function deleteExpenseAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const expenseId = formData.get('expenseId') as string;

    if (!expenseId) {
        return { error: 'Expense ID is missing.' };
    }

    const { error } = await supabaseAdmin
        .from('expenses')
        .delete()
        .eq('id', expenseId);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}

export async function deleteMultipleExpensesAction(expenseIds: string[]) {
    if (!expenseIds || expenseIds.length === 0) {
        return { error: 'No expense IDs provided.' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('expenses')
        .delete()
        .in('id', expenseIds);

    if (error) {
        console.error('Supabase multi-delete error:', error);
        return { error: error.message };
    }

    return { success: true };
}


export async function addExpensesBatch(expenses: Omit<Expense, 'id' | 'created_at'>[]) {
    if (!expenses || expenses.length === 0) {
        return { error: 'No expenses provided.' };
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    
    const { error } = await supabaseAdmin.from('expenses').insert(expenses);

    if (error) {
        console.error('Error batch inserting expenses:', error);
        return { error: `Failed to insert expenses: ${error.message}` };
    }

    return { success: true, count: expenses.length };
}

export async function syncExpensesAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const year = Number(formData.get('year'));
    const month = Number(formData.get('month'));

    if (isNaN(year) || isNaN(month)) {
        return { error: 'Invalid year or month provided.' };
    }

    try {
        const currentMonthDate = new Date(year, month, 1);
        const previousMonthDate = subMonths(currentMonthDate, 1);
        const previousMonth = getMonth(previousMonthDate);
        const previousYear = getYear(previousMonthDate);

        const { data: previousExpenses, error: fetchError } = await supabaseAdmin
            .from('expenses')
            .select('*')
            .gte('date', format(new Date(previousYear, previousMonth, 1), 'yyyy-MM-dd'))
            .lt('date', format(new Date(previousYear, previousMonth + 1, 1), 'yyyy-MM-dd'));

        if (fetchError) {
            throw new Error(`Failed to fetch previous month's expenses: ${fetchError.message}`);
        }
        
        if (!previousExpenses || previousExpenses.length === 0) {
            return { success: true, count: 0 };
        }

        const newExpenses = previousExpenses.map(expense => {
            const { id, created_at, date, ...rest } = expense;
            const previousDate = parseISO(date);
            // Use the same day of the month if possible, otherwise clamp to the last day
            const newDate = new Date(year, month, previousDate.getDate());
            
            return {
                ...rest,
                date: format(newDate, 'yyyy-MM-dd'),
                status: 'Due' as const,
            };
        });

        const { error: insertError } = await supabaseAdmin.from('expenses').insert(newExpenses);

        if (insertError) {
            throw new Error(`Failed to insert synced expenses: ${insertError.message}`);
        }

        return { success: true, count: newExpenses.length };
    } catch (error: any) {
        console.error('Error syncing expenses:', error);
        return { error: error.message };
    }
}
