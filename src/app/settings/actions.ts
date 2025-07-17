

"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import 'dotenv/config'
import { supabase as supabaseClient } from '@/lib/supabase'

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
    
    // Fetch the current settings to get existing image URLs
    const { data: currentSettings, error: fetchError } = await supabaseAdmin
        .from('property_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "No rows found"
        console.error('Supabase fetch settings error:', fetchError);
        return { error: `Failed to fetch current settings: ${fetchError.message}` };
    }

    const settingsData: { [key: string]: any } = {};

    // Handle simple text fields from FormData
    for (const [key, value] of formData.entries()) {
        if (key !== 'bankLogoFile' && key !== 'ownerPhotoFile' && key !== 'faviconFile' && key !== 'document_categories[]' && key !== 'appLogoFile') {
            if (key === 'whatsapp_reminders_enabled') {
                 settingsData[key] = value === 'on';
            } else if (key === 'whatsapp_reminder_schedule') {
                if (!settingsData[key]) settingsData[key] = [];
                settingsData[key].push(value);
            }
             else {
                settingsData[key] = value;
            }
        }
    }
    
    // Handle array for document categories
    const categories = formData.getAll('document_categories[]');
    if (categories.length > 0) {
        settingsData.document_categories = categories;
    }


    const bankLogoFile = formData.get('bankLogoFile') as File | null;
    if (bankLogoFile && bankLogoFile.size > 0) {
        const fileExt = bankLogoFile.name.split('.').pop();
        const filePath = `property-logos/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('deposit-receipts') // Using an existing bucket
            .upload(filePath, bankLogoFile);

        if (uploadError) {
            console.error('Supabase storage bank logo upload error:', uploadError);
            return { error: `Failed to upload bank logo: ${uploadError.message}` };
        }

        const { data: publicUrlData } = supabaseClient.storage.from('deposit-receipts').getPublicUrl(filePath);
        settingsData.bank_logo_url = publicUrlData.publicUrl;

        // Delete the old logo if it exists
        if (currentSettings?.bank_logo_url) {
            try {
                const oldLogoPath = new URL(currentSettings.bank_logo_url).pathname.split('/deposit-receipts/')[1];
                await supabaseClient.storage.from('deposit-receipts').remove([oldLogoPath]);
            } catch (e) {
                console.error("Could not parse or delete old bank logo from storage:", e);
            }
        }
    }

    const appLogoFile = formData.get('appLogoFile') as File | null;
    if (appLogoFile && appLogoFile.size > 0) {
        const fileExt = appLogoFile.name.split('.').pop();
        const filePath = `app-logos/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('deposit-receipts') 
            .upload(filePath, appLogoFile);

        if (uploadError) {
            console.error('Supabase storage app logo upload error:', uploadError);
            return { error: `Failed to upload app logo: ${uploadError.message}` };
        }

        const { data: publicUrlData } = supabaseClient.storage.from('deposit-receipts').getPublicUrl(filePath);
        settingsData.app_logo_url = publicUrlData.publicUrl;

        if (currentSettings?.app_logo_url) {
            try {
                const oldLogoPath = new URL(currentSettings.app_logo_url).pathname.split('/deposit-receipts/')[1];
                await supabaseClient.storage.from('deposit-receipts').remove([oldLogoPath]);
            } catch (e) {
                console.error("Could not parse or delete old app logo from storage:", e);
            }
        }
    }

    const ownerPhotoFile = formData.get('ownerPhotoFile') as File | null;
    if (ownerPhotoFile && ownerPhotoFile.size > 0) {
        const fileExt = ownerPhotoFile.name.split('.').pop();
        const filePath = `owner-photos/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('deposit-receipts')
            .upload(filePath, ownerPhotoFile);

        if (uploadError) {
            console.error('Supabase owner photo upload error:', uploadError);
            return { error: `Failed to upload owner photo: ${uploadError.message}` };
        }

        const { data: publicUrlData } = supabaseClient.storage.from('deposit-receipts').getPublicUrl(filePath);
        settingsData.owner_photo_url = publicUrlData.publicUrl;

        // Delete the old photo if it exists
        if (currentSettings?.owner_photo_url) {
            try {
                const oldPhotoPath = new URL(currentSettings.owner_photo_url).pathname.split('/deposit-receipts/')[1];
                await supabaseClient.storage.from('deposit-receipts').remove([oldPhotoPath]);
            } catch (e) {
                console.error("Could not parse or delete old owner photo from storage:", e);
            }
        }
    }

    const faviconFile = formData.get('faviconFile') as File | null;
    if (faviconFile && faviconFile.size > 0) {
        const fileExt = faviconFile.name.split('.').pop();
        const filePath = `favicons/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('deposit-receipts')
            .upload(filePath, faviconFile, {
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase favicon upload error:', uploadError);
            return { error: `Failed to upload favicon: ${uploadError.message}` };
        }

        const { data: publicUrlData } = supabaseClient.storage.from('deposit-receipts').getPublicUrl(filePath);
        settingsData.favicon_url = publicUrlData.publicUrl;

        // Delete the old favicon if it exists
        if (currentSettings?.favicon_url) {
            try {
                const oldFaviconPath = new URL(currentSettings.favicon_url).pathname.split('/deposit-receipts/')[1];
                await supabaseClient.storage.from('deposit-receipts').remove([oldFaviconPath]);
            } catch (e) {
                console.error("Could not parse or delete old favicon from storage:", e);
            }
        }
    }

    if (Object.keys(settingsData).length === 0) {
        return { success: true, message: "No changes to save." };
    }
    
    const { error } = await supabaseAdmin
        .from('property_settings')
        .update(settingsData)
        .eq('id', 1);

    if (error) {
        console.error('Supabase error:', error);
        return { error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/');
    
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

export async function updatePasscodeAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const settingsData: { passcode_protection_enabled: boolean; passcode?: string } = {
        passcode_protection_enabled: formData.get('passcode_protection_enabled') === 'on'
    };
    
    const passcode = formData.get('passcode') as string;
    // Only update the passcode if it's provided. This allows enabling/disabling without changing the passcode.
    if (passcode) {
        settingsData.passcode = passcode;
    }

    const { error } = await supabaseAdmin
        .from('property_settings')
        .update(settingsData)
        .eq('id', 1);

    if (error) {
        console.error('Supabase passcode update error:', error);
        return { error: error.message };
    }
    
    revalidatePath('/settings');

    return { success: true };
}
