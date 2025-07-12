

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

export async function updatePropertySettingsAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();

    const houseName = formData.get('houseName') as string;
    const houseAddress = formData.get('houseAddress') as string;
    const bankName = formData.get('bankName') as string;
    const bankAccountNumber = formData.get('bankAccountNumber') as string;
    
    const { error } = await supabaseAdmin
        .from('property_settings')
        .update({ 
            house_name: houseName, 
            house_address: houseAddress,
            bank_name: bankName,
            bank_account_number: bankAccountNumber,
        })
        .eq('id', 1);

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }

    revalidatePath('/settings');
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
    
    revalidatePath('/settings');
    
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
    
    revalidatePath('/settings');
    
    return { success: true };
}


export async function updateUserCredentialsAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User not found. Please log in again.' };
    }

    const updates: { email?: string; password?: string } = {};
    if (email) {
        updates.email = email;
    }
    if (password) {
        updates.password = password;
    }
    
    if (Object.keys(updates).length === 0) {
        return { success: true, message: 'No changes were made.' };
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updates
    );

    if (updateError) {
        console.error('Supabase credentials update error:', updateError);
        return { error: updateError.message };
    }
    
    revalidatePath('/settings');

    return { success: true };
}
