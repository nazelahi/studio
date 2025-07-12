
"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import 'dotenv/config'

// This file is for server-side actions only.
// It uses the service_role key to have admin privileges.

export async function updatePropertySettingsAction(formData: FormData) {
    const houseName = formData.get('houseName') as string;
    const houseAddress = formData.get('houseAddress') as string;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Supabase credentials are not configured on the server. Please check your .env.local file.' };
    }
    
    // Create a Supabase client with service_role privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabaseAdmin
        .from('property_settings')
        .update({ house_name: houseName, house_address: houseAddress })
        .eq('id', 1);

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }

    // Revalidate the path to show the new data immediately
    revalidatePath('/settings');
    revalidatePath('/');
    
    return { success: true };
}


export async function updateUserCredentialsAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Supabase credentials are not configured on the server. Please check your .env.local file.' };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Get the current user from the session cookie
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser();

    if (userError || !user) {
        return { error: 'Could not authenticate user. Please log in again.' };
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
        user.id,
        updates
    );

    if (updateError) {
        console.error('Supabase credentials update error:', updateError);
        return { error: updateError.message };
    }
    
    revalidatePath('/settings');

    return { success: true };
}
