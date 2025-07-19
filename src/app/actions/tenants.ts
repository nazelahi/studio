
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { Tenant } from '@/types'

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

type TenantForCreation = Omit<Tenant, 'id' | 'created_at' | 'deleted_at' | 'status' | 'documents'>;

export async function findOrCreateTenantAction(tenantData: TenantForCreation) {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: existingTenant, error: findError } = await supabaseAdmin
        .from('tenants')
        .select('id, avatar')
        .eq('name', tenantData.name)
        .eq('property', tenantData.property)
        .is('deleted_at', null)
        .maybeSingle();

    if (findError) {
        console.error('Error finding tenant:', findError);
        return { error: `Failed to find tenant: ${findError.message}` };
    }

    if (existingTenant) {
        return { success: true, data: existingTenant };
    }

    const newTenantData: Omit<Tenant, 'id' | 'created_at' | 'deleted_at'> = {
        ...tenantData,
        avatar: tenantData.avatar || 'https://placehold.co/80x80.png',
        status: 'Active',
    };

    const { data: newTenant, error: createError } = await supabaseAdmin
        .from('tenants')
        .insert(newTenantData)
        .select('id, avatar')
        .single();
    
    if (createError) {
        console.error('Error creating tenant:', createError);
        return { error: `Failed to create tenant: ${createError.message}` };
    }
    
    return { success: true, data: newTenant };
}


export async function updateTenantAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const tenantId = formData.get('tenantId') as string;
    
    if (!tenantId) {
        return { error: 'Tenant ID is missing.' };
    }

    const avatarFile = formData.get('avatarFile') as File | null;
    let avatarUrl = formData.get('avatar') as string;

    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${tenantId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('tenant-documents')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            console.error('Supabase avatar upload error:', uploadError);
            return { error: `Failed to upload avatar: ${uploadError.message}` };
        }
        
        const { data: publicUrlData } = supabaseAdmin.storage.from('tenant-documents').getPublicUrl(uploadData.path);
        avatarUrl = publicUrlData.publicUrl;
    }

    const tenantData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        property: formData.get('property') as string,
        rent: Number(formData.get('rent')),
        join_date: formData.get('join_date') as string,
        notes: formData.get('notes') as string,
        type: formData.get('type') as string,
        status: formData.get('status') as Tenant['status'],
        father_name: formData.get('father_name') as string,
        address: formData.get('address') as string,
        date_of_birth: formData.get('date_of_birth') as string,
        nid_number: formData.get('nid_number') as string,
        advance_deposit: Number(formData.get('advance_deposit')),
        gas_meter_number: formData.get('gas_meter_number') as string,
        electric_meter_number: formData.get('electric_meter_number') as string,
        avatar: avatarUrl,
        documents: formData.getAll('documents[]') as string[],
    };

    const { error } = await supabaseAdmin
        .from('tenants')
        .update(tenantData)
        .eq('id', tenantId);

    if (error) {
        console.error('Supabase tenant update error:', error);
        return { error: `Failed to update tenant: ${error.message}` };
    }
    
    // Also update associated rent entries
    const { error: rentUpdateError } = await supabaseAdmin
        .from('rent_entries')
        .update({
            name: tenantData.name,
            property: tenantData.property,
            rent: tenantData.rent,
            avatar: tenantData.avatar,
        })
        .eq('tenant_id', tenantId);

    if (rentUpdateError) {
        console.error('Supabase rent entry sync error:', rentUpdateError);
        // Non-fatal, so we don't return an error to the client for this.
    }

    return { success: true };
}


export async function deleteTenantAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const tenantId = formData.get('tenantId') as string;

    if (!tenantId) {
        return { error: 'Tenant ID is missing.' };
    }

    const { error } = await supabaseAdmin
        .from('tenants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', tenantId);

    if (error) {
        console.error('Supabase tenant delete error:', error);
        return { error: `Failed to delete tenant: ${error.message}` };
    }

    return { success: true };
}
