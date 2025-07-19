
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
