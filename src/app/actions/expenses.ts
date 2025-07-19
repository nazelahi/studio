
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { Expense } from '@/types'

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
        .update({ deleted_at: new Date().toISOString() })
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
        .update({ deleted_at: new Date().toISOString() })
        .in('id', expenseIds);

    if (error) {
        console.error('Supabase multi-delete error:', error);
        return { error: error.message };
    }

    return { success: true };
}


export async function addExpensesBatch(expenses: Omit<Expense, 'id' | 'created_at' | 'deleted_at'>[]) {
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
