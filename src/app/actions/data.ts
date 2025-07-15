
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { revalidatePath } from 'next/cache'

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

export async function clearMonthlyDataAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
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
     const endDate = new Date(year, month + 1, 1).toISOString();

    const { error: expenseError } = await supabaseAdmin
        .from('expenses')
        .delete()
        .gte('date', startDate)
        .lt('date', endDate);
    
    if (expenseError) {
        console.error('Error clearing monthly expense data:', expenseError);
        return { error: `Failed to clear expense data: ${expenseError.message}` };
    }
    
    revalidatePath('/');
    return { success: true, message: `Data for ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year} has been cleared.` };
}


export async function clearYearlyDataAction(formData: FormData) {
    const supabaseAdmin = getSupabaseAdmin();
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

    revalidatePath('/');
    return { success: true, message: `All data for the year ${year} has been cleared.` };
}

export async function generateSqlBackupAction() {
    const supabaseAdmin = getSupabaseAdmin();
    const tables = ['tenants', 'expenses', 'rent_entries', 'deposits', 'notices', 'work_details', 'zakat_transactions', 'zakat_bank_details', 'property_settings'];
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
                const columns = Object.keys(data[0]).join(', ');

                data.forEach(row => {
                    const values = Object.values(row).map(value => {
                        if (value === null || value === undefined) return 'NULL';
                        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                        if (typeof value === 'number') return value;
                        if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                        return `'${String(value).replace(/'/g, "''")}'`;
                    }).join(', ');
                    sqlString += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
                });
            }
        }
        return { success: true, data: sqlString };
    } catch (error: any) {
        return { error: error.message };
    }
}
