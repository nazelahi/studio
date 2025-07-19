
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { RentEntry } from '@/types'

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

type RentEntryForBatch = Omit<RentEntry, 'id' | 'created_at' | 'deleted_at'>;

export async function addRentEntriesBatch(rentEntries: RentEntryForBatch[]) {
    if (!rentEntries || rentEntries.length === 0) {
        return { error: 'No rent entries provided.' };
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // The rent_entries table has RLS enabled, so we need to use the admin client
    // to bypass it for batch imports.
    const { error } = await supabaseAdmin.from('rent_entries').insert(rentEntries);

    if (error) {
        console.error('Error batch inserting rent entries:', error);
        return { error: `Failed to insert rent entries: ${error.message}` };
    }

    return { success: true, count: rentEntries.length };
}


export async function deleteRentEntryAction(rentEntryId: string) {
    if (!rentEntryId) {
        return { error: 'Rent entry ID is missing.' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('rent_entries')
        .delete()
        .eq('id', rentEntryId);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: error.message };
    }
    
    return { success: true };
}

export async function deleteMultipleRentEntriesAction(rentEntryIds: string[]) {
    if (!rentEntryIds || rentEntryIds.length === 0) {
        return { error: 'No rent entry IDs provided.' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('rent_entries')
        .delete()
        .in('id', rentEntryIds);

    if (error) {
        console.error('Supabase multi-delete error:', error);
        return { error: error.message };
    }

    return { success: true };
}


export async function syncTenantsAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    const year = Number(formData.get('year'));
    const month = Number(formData.get('month'));

    if (isNaN(year) || isNaN(month)) {
        return { error: 'Invalid year or month provided.' };
    }

    try {
        const { data: rentDataForMonth, error: rentDataError } = await supabaseAdmin
            .from('rent_entries')
            .select('tenant_id')
            .eq('year', year)
            .eq('month', month);

        if (rentDataError) {
            throw new Error(`Failed to fetch rent data for sync: ${rentDataError.message}`);
        }

        const existingTenantIds = new Set(rentDataForMonth.map(e => e.tenant_id));

        const { data: allTenants, error: tenantsError } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .eq('status', 'Active');

        if (tenantsError) {
            throw new Error(`Failed to fetch tenants for sync: ${tenantsError.message}`);
        }

        const tenantsToSync = allTenants.filter(tenant => !existingTenantIds.has(tenant.id));

        if (tenantsToSync.length === 0) {
            return { success: true, count: 0 };
        }

        const newRentEntries = tenantsToSync.map(tenant => ({
            tenant_id: tenant.id,
            name: tenant.name,
            property: tenant.property,
            rent: tenant.rent,
            due_date: new Date(year, month, 1).toISOString().split("T")[0],
            status: "Pending" as const,
            avatar: tenant.avatar,
            year: year,
            month: month,
        }));

        const { error: insertError } = await supabaseAdmin.from('rent_entries').insert(newRentEntries);

        if (insertError) {
            throw new Error(`Failed to insert synced tenants: ${insertError.message}`);
        }

        return { success: true, count: tenantsToSync.length };
    } catch (error: any) {
        console.error('Error syncing tenants:', error);
        return { error: error.message };
    }
}
