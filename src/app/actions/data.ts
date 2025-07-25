
"use server"

import type { AppData } from '@/lib/data'
import { getDashboardData } from '@/lib/data'
import { getSupabaseAdmin } from '@/lib/supabase'


// This function is called from the client to fetch all initial data.
export async function getDashboardDataAction(): Promise<Omit<AppData, 'propertySettings'>> {
    return await getDashboardData();
}

export async function clearMonthlyDataAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not create Supabase admin client." };

    const year = Number(formData.get('year'));
    const month = Number(formData.get('month'));

    if (isNaN(year) || isNaN(month)) {
        return { error: 'Invalid year or month provided.' };
    }
    
    // Clear rent entries for the month
    const { error: rentError } = await supabaseAdmin
        .from('rent_entries')
        .delete()
        .eq('year', year)
        .eq('month', month);

    if (rentError) {
        console.error('Error clearing monthly rent data:', rentError);
        return { error: `Failed to clear rent data: ${rentError.message}` };
    }
    
    // Clear expenses for the month
     const startDate = new Date(year, month, 1).toISOString();
     const endDate = new Date(year, month + 1, 0).toISOString(); // end of the month

    const { error: expenseError } = await supabaseAdmin
        .from('expenses')
        .delete()
        .gte('date', startDate)
        .lt('date', endDate);
    
    if (expenseError) {
        console.error('Error clearing monthly expense data:', expenseError);
        return { error: `Failed to clear expense data: ${expenseError.message}` };
    }
    
    return { success: true, message: `Data for ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year} has been cleared.` };
}


export async function clearYearlyDataAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not create Supabase admin client." };
    const year = Number(formData.get('year'));

    if (isNaN(year)) {
        return { error: 'Invalid year provided.' };
    }

    // Clear rent entries for the year
    const { error: rentError } = await supabaseAdmin
        .from('rent_entries')
        .delete()
        .eq('year', year);
    
    if (rentError) {
        console.error('Error clearing yearly rent data:', rentError);
        return { error: `Failed to clear rent data: ${rentError.message}` };
    }

    // Clear expenses for the year
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year + 1, 0, 1).toISOString();

    const { error: expenseError } = await supabaseAdmin
        .from('expenses')
        .delete()
        .gte('date', startDate)
        .lt('date', endDate);

    if (expenseError) {
        console.error('Error clearing yearly expense data:', expenseError);
        return { error: `Failed to clear expense data: ${expenseError.message}` };
    }

    return { success: true, message: `All data for the year ${year} has been cleared.` };
}


export async function clearTenantDataAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not create Supabase admin client." };
    const tenantId = formData.get('tenantId') as string;

    if (!tenantId) {
        return { error: 'Invalid tenant ID provided.' };
    }
    
    // Delete rent entries for the tenant
    const { error: rentError } = await supabaseAdmin
        .from('rent_entries')
        .delete()
        .eq('tenant_id', tenantId);

    if (rentError) {
        return { error: `Failed to clear rent entries for tenant: ${rentError.message}` };
    }
    
    // Delete the tenant
    const { error: tenantError } = await supabaseAdmin
        .from('tenants')
        .delete()
        .eq('id', tenantId);

    if (tenantError) {
        return { error: `Failed to delete tenant: ${tenantError.message}` };
    }

    return { success: true, message: `All data for the selected tenant has been cleared.` };
}

export async function clearAllDataAction() {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not create Supabase admin client." };
    // A list of all transactional data tables to clear.
    // We intentionally leave out 'property_settings' and 'zakat_bank_details' as they are configuration.
    const tablesToClear = [
        'rent_entries',
        'expenses',
        'tenants',
        'deposits',
        'notices',
        'work_details',
        'zakat_transactions',
        'documents'
    ];

    for (const table of tablesToClear) {
        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // A trick to delete all rows

        if (error) {
            console.error(`Error clearing table ${table}:`, error);
            return { error: `Failed to clear table ${table}: ${error.message}` };
        }
    }

    return { success: true, message: 'All transactional application data has been cleared.' };
}


export async function generateSqlBackupAction() {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "Could not create Supabase admin client." };
    const tables = ['tenants', 'expenses', 'rent_entries', 'deposits', 'notices', 'work_details', 'zakat_transactions', 'zakat_bank_details', 'property_settings', 'documents'];
    let sqlString = `
-- RentFlow SQL Backup
-- Generated on: ${new Date().toUTCString()}

`;

    try {
        for (const table of tables) {
            const { data, error } = await supabaseAdmin.from(table).select('*');
            if (error) {
                console.error(`Error fetching data from ${table}:`, error);
                throw new Error(`Could not fetch data for table ${table}.`);
            }

            if (data && data.length > 0) {
                sqlString += `\n-- Data for table: ${table}\n`;
                const columns = Object.keys(data[0]).map(col => `"${col}"`).join(', ');

                data.forEach(row => {
                    const values = Object.values(row).map(value => {
                        if (value === null || value === undefined) return 'NULL';
                        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                        if (typeof value === 'number') return value;
                        if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                        // Default to string for all other types
                        return `'${String(value).replace(/'/g, "''")}'`;
                    }).join(', ');
                    sqlString += `INSERT INTO public.${table} (${columns}) VALUES (${values});\n`;
                });
            }
        }
        return { success: true, data: sqlString };
    } catch (error: any) {
        return { error: error.message };
    }
}
