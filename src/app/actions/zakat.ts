
"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import 'dotenv/config'
import { supabase as supabaseClient } from '@/lib/supabase' // Use the client-side configured supabase for storage

// This function creates a Supabase client with admin privileges.
// It uses the service_role key and is intended for server-side use only
// where row-level security needs to be bypassed for DB operations.
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

export async function saveZakatTransactionAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();

    const receiptFile = formData.get('receiptFile') as File | null;
    let receiptUrl: string | null = formData.get('receipt_url') as string || null;

    if (receiptFile && receiptFile.size > 0) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('zakat-receipts')
            .upload(filePath, receiptFile);
        
        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            return { error: `Failed to upload receipt: ${uploadError.message}` };
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('zakat-receipts')
            .getPublicUrl(filePath);

        receiptUrl = publicUrlData.publicUrl;

        const oldReceiptUrl = formData.get('oldReceiptUrl') as string | undefined;
        if (oldReceiptUrl) {
            try {
                const oldReceiptPath = new URL(oldReceiptUrl).pathname.split('/zakat-receipts/')[1];
                await supabaseClient.storage.from('zakat-receipts').remove([oldReceiptPath]);
            } catch (e) {
                 console.error("Could not parse or delete old Zakat receipt from storage:", e)
            }
        }
    }
    
    const transactionData = {
        transaction_date: formData.get('transaction_date') as string,
        type: formData.get('type') as 'inflow' | 'outflow',
        amount: Number(formData.get('amount')),
        source_or_recipient: formData.get('source_or_recipient') as string,
        description: formData.get('description') as string || null,
        receipt_url: receiptUrl,
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
    
    const receiptUrl = formData.get('receiptUrl') as string;
    if (receiptUrl) {
        try {
            const receiptPath = new URL(receiptUrl).pathname.split('/storage/v1/object/public/zakat-receipts/')[1];
            if (receiptPath) {
                const { error: storageError } = await supabaseClient.storage
                    .from('zakat-receipts')
                    .remove([receiptPath]);
                
                if (storageError) {
                    console.error('Supabase storage delete error:', storageError);
                }
            }
        } catch (e) {
             console.error('Could not parse or delete receipt from storage on delete:', e);
        }
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

export async function saveZakatBankDetailAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const detailId = formData.get('detailId') as string | undefined;

    const data = {
        bank_name: formData.get('bank_name') as string,
        account_number: formData.get('account_number') as string,
        account_holder: formData.get('account_holder') as string,
    };

    let error;

    if (detailId) {
        const { error: updateError } = await supabaseAdmin
            .from('zakat_bank_details')
            .update(data)
            .eq('id', detailId);
        error = updateError;
    } else {
        const { error: insertError } = await supabaseAdmin
            .from('zakat_bank_details')
            .insert(data);
        error = insertError;
    }

    if (error) {
        console.error('Supabase error saving Zakat bank detail:', error);
        return { error: error.message };
    }
    
    revalidatePath('/');
    
    return { success: true };
}

export async function deleteZakatBankDetailAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const detailId = formData.get('detailId') as string;

    if (!detailId) {
        return { error: 'Detail ID is missing.' };
    }

    const { error } = await supabaseAdmin
        .from('zakat_bank_details')
        .delete()
        .eq('id', detailId);

    if (error) {
        console.error('Supabase error deleting Zakat bank detail:', error);
        return { error: error.message };
    }
    
    revalidatePath('/');
    
    return { success: true };
}
