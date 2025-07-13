

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

    const logoFile = formData.get('logoFile') as File | null;
    let logoUrl: string | null = formData.get('bank_logo_url') as string || null;

    if (logoFile && logoFile.size > 0) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `property-logos/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('deposit-receipts') // Using an existing bucket
            .upload(filePath, logoFile);

        if (uploadError) {
            console.error('Supabase storage logo upload error:', uploadError);
            return { error: `Failed to upload logo: ${uploadError.message}` };
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('deposit-receipts')
            .getPublicUrl(filePath);

        logoUrl = publicUrlData.publicUrl;

        const oldLogoUrl = formData.get('oldLogoUrl') as string | undefined;
        if (oldLogoUrl) {
            try {
                const oldLogoPath = new URL(oldLogoUrl).pathname.split('/deposit-receipts/')[1];
                await supabaseClient.storage.from('deposit-receipts').remove([oldLogoPath]);
            } catch (e) {
                console.error("Could not parse or delete old bank logo from storage:", e);
            }
        }
    }

    const ownerPhotoFile = formData.get('ownerPhotoFile') as File | null;
    let ownerPhotoUrl: string | null = formData.get('owner_photo_url') as string || null;

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

        const { data: publicUrlData } = supabaseClient.storage
            .from('deposit-receipts')
            .getPublicUrl(filePath);

        ownerPhotoUrl = publicUrlData.publicUrl;

        const oldOwnerPhotoUrl = formData.get('oldOwnerPhotoUrl') as string | undefined;
        if (oldOwnerPhotoUrl) {
            try {
                const oldPhotoPath = new URL(oldOwnerPhotoUrl).pathname.split('/deposit-receipts/')[1];
                await supabaseClient.storage.from('deposit-receipts').remove([oldPhotoPath]);
            } catch (e) {
                console.error("Could not parse or delete old owner photo from storage:", e);
            }
        }
    }


    const settingsData = {
        house_name: formData.get('houseName') as string,
        house_address: formData.get('houseAddress') as string,
        bank_name: formData.get('bankName') as string,
        bank_account_number: formData.get('bankAccountNumber') as string,
        bank_logo_url: logoUrl,
        owner_name: formData.get('ownerName') as string,
        owner_photo_url: ownerPhotoUrl,
        about_us: formData.get('about_us') as string,
        contact_phone: formData.get('contact_phone') as string,
        contact_email: formData.get('contact_email') as string,
        contact_address: formData.get('contact_address') as string,
        theme_primary: formData.get('theme_primary') as string,
        theme_table_header_background: formData.get('theme_table_header_background') as string,
        theme_table_header_foreground: formData.get('theme_table_header_foreground') as string,
        theme_table_footer_background: formData.get('theme_table_footer_background') as string,
        theme_mobile_nav_background: formData.get('theme_mobile_nav_background') as string,
        theme_mobile_nav_foreground: formData.get('theme_mobile_nav_foreground') as string,
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
    const passcode = formData.get('passcode') as string;

    if (!passcode) {
        return { error: 'Passcode cannot be empty.' };
    }

    const { error } = await supabaseAdmin
        .from('property_settings')
        .update({ passcode })
        .eq('id', 1);

    if (error) {
        console.error('Supabase passcode update error:', error);
        return { error: error.message };
    }
    
    revalidatePath('/settings');

    return { success: true };
}
