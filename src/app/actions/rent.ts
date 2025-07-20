

"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { RentEntry, Tenant } from '@/types'
import { getSupabaseAdmin } from '@/lib/supabase'

type RentEntryForBatch = Omit<RentEntry, 'id' | 'created_at'>;

export async function addRentEntriesBatch(rentEntries: RentEntryForBatch[], year: number, month: number) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };

    if (!rentEntries || rentEntries.length === 0) {
        return { error: 'No rent entries provided.' };
    }
    
    // Ensure all entries have the correct year and month
    const entriesToInsert = rentEntries.map(entry => ({
        ...entry,
        year,
        month,
        due_date: new Date(year, month, 1).toISOString().split("T")[0],
    }));

    const { error } = await supabaseAdmin.from('rent_entries').insert(entriesToInsert);

    if (error) {
        console.error('Error batch inserting rent entries:', error);
        return { error: `Failed to insert rent entries: ${error.message}` };
    }

    return { success: true, count: rentEntries.length };
}


export async function deleteRentEntryAction(rentEntryId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };

    if (!rentEntryId) {
        return { error: 'Rent entry ID is missing.' };
    }
    
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
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };

    if (!rentEntryIds || rentEntryIds.length === 0) {
        return { error: 'No rent entry IDs provided.' };
    }

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
    if (!supabaseAdmin) return { error: "Could not connect to the database." };
    
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
            return { success: true, count: 0, message: "All active tenants are already in the rent roll." };
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


export async function syncTenantsFromPreviousYearAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not connect to the database." };
    
    const currentYear = Number(formData.get('year'));
    const currentMonth = Number(formData.get('month'));
    const previousYear = currentYear - 1;

    if (isNaN(currentYear) || isNaN(currentMonth)) {
        return { error: 'Invalid year or month provided.' };
    }

    try {
        // 1. Get tenants already in the current month's rent roll
        const { data: currentRentData, error: currentRentError } = await supabaseAdmin
            .from('rent_entries')
            .select('tenant_id')
            .eq('year', currentYear)
            .eq('month', currentMonth);
        if (currentRentError) throw new Error(`Failed to fetch current rent data: ${currentRentError.message}`);
        const currentTenantIds = new Set(currentRentData.map(e => e.tenant_id));

        // 2. Get all distinct tenant_ids from the previous year's rent entries
        const { data: prevYearTenantIds, error: prevIdsError } = await supabaseAdmin
            .from('rent_entries')
            .select('tenant_id', { count: 'exact', head: false })
            .eq('year', previousYear);
        if(prevIdsError) throw new Error(`Failed to fetch previous year's tenant IDs: ${prevIdsError.message}`);

        const uniquePrevYearTenantIds = Array.from(new Set(prevYearTenantIds.map(t => t.tenant_id)));

        if (uniquePrevYearTenantIds.length === 0) {
            return { success: true, count: 0, message: "No tenants found in the previous year." };
        }
        
        // 3. Fetch details for those tenants who are still active
        const { data: previousYearTenants, error: previousTenantsError } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .in('id', uniquePrevYearTenantIds)
            .eq('status', 'Active');
            
        if (previousTenantsError) throw new Error(`Failed to fetch previous year's tenants: ${previousTenantsError.message}`);


        // 4. Filter out tenants who are already in the current rent roll
        const tenantsToSync = previousYearTenants.filter(tenant => !currentTenantIds.has(tenant.id));

        if (tenantsToSync.length === 0) {
            return { success: true, count: 0, message: "All tenants from previous year are already synced." };
        }

        // 5. Create new rent entries
        const newRentEntries = tenantsToSync.map(tenant => ({
            tenant_id: tenant.id,
            name: tenant.name,
            property: tenant.property,
            rent: tenant.rent,
            due_date: new Date(currentYear, currentMonth, 1).toISOString().split("T")[0],
            status: "Pending" as const,
            avatar: tenant.avatar,
            year: currentYear,
            month: currentMonth,
        }));

        const { error: insertError } = await supabaseAdmin.from('rent_entries').insert(newRentEntries);

        if (insertError) {
            throw new Error(`Failed to insert synced tenants from previous year: ${insertError.message}`);
        }

        return { success: true, count: tenantsToSync.length };
    } catch (error: any) {
        console.error('Error syncing tenants from previous year:', error);
        return { error: error.message };
    }
}
