

"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { Tenant } from '@/types'
import { getSupabaseAdmin } from '@/lib/supabase'

type TenantForCreation = Omit<Tenant, 'id' | 'created_at' | 'deleted_at' | 'documents'>;

export async function findOrCreateTenantAction(tenantData: TenantForCreation) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };
    
    const { data: existingTenant, error: findError } = await supabaseAdmin
        .from('tenants')
        .select('id, avatar')
        .eq('name', tenantData.name)
        .eq('property', tenantData.property)
        .eq('status', 'Active')
        .maybeSingle();

    if (findError) {
        console.error('Error finding tenant:', findError);
        return { error: `Failed to find tenant: ${findError.message}` };
    }

    if (existingTenant) {
        return { success: true, data: existingTenant };
    }

    const { data: newTenant, error: createError } = await supabaseAdmin
        .from('tenants')
        .insert(tenantData)
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
    if (!supabaseAdmin) return { error: "Could not connect to the database." };
    
    const tenantId = formData.get('tenantId') as string;

    const avatarFile = formData.get('avatarFile') as File | null;
    let avatarUrl = formData.get('avatar') as string;

    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${tenantId || Date.now()}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('rentflow-public')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            console.error('Supabase avatar upload error:', uploadError);
            return { error: `Failed to upload avatar: ${uploadError.message}` };
        }
        
        const { data: publicUrlData } = supabaseAdmin.storage.from('rentflow-public').getPublicUrl(uploadData.path);
        avatarUrl = publicUrlData.publicUrl;
    }
    
    // Handle document uploads
    const newDocumentFiles = formData.getAll('documentFiles') as File[];
    const uploadedDocUrls: string[] = [];
    const tenantIdentifier = tenantId || `new-tenant-${Date.now()}`;

    if (newDocumentFiles.length > 0 && newDocumentFiles[0].size > 0) {
        for (const file of newDocumentFiles) {
            if (file.size > 0) {
                const fileExt = file.name.split('.').pop();
                const filePath = `tenant-docs/${tenantIdentifier}/${Date.now()}-${file.name.replace(/ /g, '_')}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('rentflow-public')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Supabase document upload error:', uploadError);
                    // We'll continue, but you might want to handle this more gracefully
                } else {
                    const { data: publicUrlData } = supabaseAdmin.storage.from('rentflow-public').getPublicUrl(uploadData.path);
                    uploadedDocUrls.push(publicUrlData.publicUrl);
                }
            }
        }
    }
    
    const existingDocuments = formData.getAll('documents[]') as string[];
    const finalDocuments = [...existingDocuments, ...uploadedDocUrls];

    const joinDateValue = formData.get('join_date') as string;
    const dobValue = formData.get('date_of_birth') as string;
    const advanceDepositValue = formData.get('advance_deposit') as string;

    const tenantData: Omit<Tenant, 'id' | 'created_at'> = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        property: formData.get('property') as string,
        rent: Number(formData.get('rent')),
        join_date: joinDateValue || new Date().toISOString().split('T')[0],
        notes: formData.get('notes') as string,
        type: formData.get('type') as string,
        status: formData.get('status') as Tenant['status'],
        father_name: formData.get('father_name') as string,
        address: formData.get('address') as string,
        date_of_birth: dobValue || null,
        nid_number: formData.get('nid_number') as string,
        advance_deposit: advanceDepositValue ? Number(advanceDepositValue) : null,
        gas_meter_number: formData.get('gas_meter_number') as string,
        electric_meter_number: formData.get('electric_meter_number') as string,
        avatar: avatarUrl || 'https://placehold.co/80x80.png',
        documents: finalDocuments,
    };
    
    if (tenantId) {
        // Update existing tenant
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

    } else {
        // Create new tenant
        const { error } = await supabaseAdmin.from('tenants').insert(tenantData);
        if (error) {
            console.error('Supabase tenant create error:', error);
            return { error: `Failed to create tenant: ${error.message}` };
        }
    }


    return { success: true };
}


export async function deleteTenantAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };

    const tenantId = formData.get('tenantId') as string;

    if (!tenantId) {
        return { error: 'Tenant ID is missing.' };
    }

    // Soft delete by updating status to "Archived"
    const { error } = await supabaseAdmin
        .from('tenants')
        .update({ status: 'Archived' })
        .eq('id', tenantId);


    if (error) {
        console.error('Supabase tenant archive error:', error);
        return { error: `Failed to archive tenant: ${error.message}` };
    }

    return { success: true };
}

export async function deleteMultipleTenantsAction(tenantIds: string[]) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };
    
    if (!tenantIds || tenantIds.length === 0) {
        return { error: 'No tenant IDs provided.' };
    }

    // Soft delete by updating status to "Archived"
    const { error } = await supabaseAdmin
        .from('tenants')
        .update({ status: 'Archived' })
        .in('id', tenantIds);


    if (error) {
        console.error('Supabase multi-archive error:', error);
        return { error: `Failed to archive tenants: ${error.message}` };
    }

    return { success: true };
}
