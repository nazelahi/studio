
"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import 'dotenv/config'

// This function creates a Supabase client with admin privileges.
// It uses the service_role key and is intended for server-side use only
// where row-level security needs to be bypassed.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
    }
    
    // The `auth` option with `autoRefreshToken: false` and `persistSession: false`
    // is crucial for server-side clients to prevent session-related issues.
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function saveZakatTransactionAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const transactionData = {
        transaction_date: formData.get('transaction_date') as string,
        type: formData.get('type') as 'inflow' | 'outflow',
        amount: Number(formData.get('amount')),
        source_or_recipient: formData.get('source_or_recipient') as string,
        description: formData.get('description') as string || null,
    }
    
    const transactionId = formData.get('transactionId') as string | undefined;

    let error;

    if (transactionId) {
        // Update existing transaction
        const { error: updateError } = await supabaseAdmin
            .from('zakat_transactions')
            .update(transactionData)
            .eq('id', transactionId);
        error = updateError;
    } else {
        // Insert new transaction
        const { error: insertError } = await supabaseAdmin
            .from('zakat_transactions')
            .insert(transactionData);
        error = insertError;
    }

    if (error) {
        console.error('Supabase Zakat error:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    
    return { success: true };
}


export async function deleteZakatTransactionAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const transactionId = formData.get('transactionId') as string;

    if (!transactionId) {
        return { error: 'Transaction ID is missing.' };
    }

    const { error } = await supabaseAdmin
        .from('zakat_transactions')
        .delete()
        .eq('id', transactionId);

    if (error) {
        console.error('Supabase Zakat delete error:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    
    return { success: true };
}
