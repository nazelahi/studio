

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
    const zakatBankName = formData.get('zakatBankName') as string;
    const zakatBankAccountNumber = formData.get('zakatBankAccountNumber') as string;

    // Handle house image uploads
    const newImageFiles = formData.getAll('new_house_images') as File[];
    const existingImageUrls = formData.getAll('existing_house_images') as string[];

    const uploadedUrls: string[] = [];

    for (const file of newImageFiles) {
        if (file && file.size > 0) {
            const fileExt = file.name.split('.').pop();
            const filePath = `property/${Date.now()}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('property-images')
                .upload(filePath, file);
            
            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError);
                return { error: `Failed to upload image: ${uploadError.message}` };
            }

            const { data: publicUrlData } = supabaseAdmin.storage
                .from('property-images')
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
        }
    }
    
    // Combine existing (kept) URLs with newly uploaded URLs
    const finalImageUrls = [...existingImageUrls, ...uploadedUrls];

    // Find images to delete from storage
    const initialImages = JSON.parse(formData.get('initial_house_images') as string || '[]');
    const imagesToDelete = initialImages.filter((url: string) => !existingImageUrls.includes(url));

    if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete.map((url: string) => {
            try {
                // Correctly parse the path from the public URL
                const urlObject = new URL(url);
                const pathParts = urlObject.pathname.split('/property-images/');
                return pathParts[1] ? `property-images/${pathParts[1]}` : null;
            } catch (e) {
                console.error('Could not parse image URL for deletion', e);
                return null;
            }
        }).filter((p): p is string => p !== null);

        if (pathsToDelete.length > 0) {
            // The path should not start with the bucket name again for the remove call
            const finalPathsToDelete = pathsToDelete.map(p => p.replace('property-images/', ''));

            if (finalPathsToDelete.length > 0) {
                 const { error: storageError } = await supabaseAdmin.storage
                    .from('property-images')
                    .remove(finalPathsToDelete);
                
                if (storageError) {
                    // Log as non-fatal, as the main update can still proceed
                    console.error('Non-fatal: Could not delete old images from storage', storageError);
                }
            }
        }
    }


    const { error } = await supabaseAdmin
        .from('property_settings')
        .update({ 
            house_name: houseName, 
            house_address: houseAddress,
            bank_name: bankName,
            bank_account_number: bankAccountNumber,
            zakat_bank_name: zakatBankName,
            zakat_bank_account_number: zakatBankAccountNumber,
            house_images: finalImageUrls,
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
