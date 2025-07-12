
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

export async function logDepositAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const depositData = {
        year: Number(formData.get('year')),
        month: Number(formData.get('month')),
        amount: Number(formData.get('amount')),
        deposit_date: formData.get('deposit_date') as string,
        receipt_url: formData.get('receipt_url') as string || null,
    }
    
    const depositId = formData.get('depositId') as string | undefined;
    const oldReceiptUrl = formData.get('oldReceiptUrl') as string | undefined;

    let error;

    if (depositId) {
        // Update existing deposit
        const { error: updateError } = await supabaseAdmin
            .from('deposits')
            .update(depositData)
            .eq('id', depositId);
        error = updateError;
        
        // If update was successful and a new receipt was uploaded, delete the old one
        if (!updateError && oldReceiptUrl && depositData.receipt_url !== oldReceiptUrl) {
            try {
                // Extract the path from the full URL for deletion
                const oldReceiptPath = new URL(oldReceiptUrl).pathname.split('/deposit-receipts/')[1];
                 const { error: storageError } = await supabaseAdmin.storage
                    .from('deposit-receipts')
                    .remove([oldReceiptPath]);
                if (storageError) {
                    console.error('Supabase storage delete error (non-fatal):', storageError);
                }
            } catch (e) {
                console.error("Could not parse or delete old receipt from storage:", e)
            }
        }

    } else {
        // Insert new deposit
        const { error: insertError } = await supabaseAdmin
            .from('deposits')
            .insert(depositData);
        error = insertError;
    }

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }

    // Revalidate the path to show the new data immediately
    revalidatePath('/');
    
    return { success: true };
}


export async function deleteDepositAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const depositId = formData.get('depositId') as string;

    if (!depositId) {
        return { error: 'Deposit ID is missing.' };
    }

    const receiptUrl = formData.get('receiptPath') as string;
    if (receiptUrl) {
        try {
            const receiptPath = new URL(receiptUrl).pathname.split('/deposit-receipts/')[1];
            const { error: storageError } = await supabaseAdmin.storage
                .from('deposit-receipts')
                .remove([receiptPath]);
            
            if (storageError) {
                 console.error('Supabase storage delete error:', storageError);
                 // Non-fatal, so we don't return here. Just log it.
            }
        } catch (e) {
             console.error('Could not parse or delete receipt from storage on delete:', e);
        }
    }

    const { error } = await supabaseAdmin
        .from('deposits')
        .delete()
        .eq('id', depositId);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    
    return { success: true };
}
