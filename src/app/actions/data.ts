
"use server"

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

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

export async function fetchAllDataAction() {
    const supabase = getSupabaseAdmin();
    try {
        const [tenantsRes, expensesRes, rentDataRes, propertySettingsRes, depositsRes, zakatRes, noticesRes, workDetailsRes, zakatBankDetailsRes] = await Promise.all([
            supabase.from('tenants').select('*').is('deleted_at', null),
            supabase.from('expenses').select('*').is('deleted_at', null),
            supabase.from('rent_entries').select('*').is('deleted_at', null),
            supabase.from('property_settings').select('*').eq('id', 1).maybeSingle(),
            supabase.from('deposits').select('*'),
            supabase.from('zakat_transactions').select('*'),
            supabase.from('notices').select('*'),
            supabase.from('work_details').select('*'),
            supabase.from('zakat_bank_details').select('*'),
        ]);

        const errors = [tenantsRes.error, expensesRes.error, rentDataRes.error, depositsRes.error, zakatRes.error, noticesRes.error, workDetailsRes.error, zakatBankDetailsRes.error].filter(Boolean);
        if (propertySettingsRes.error && propertySettingsRes.error.code !== 'PGRST116') {
             errors.push(propertySettingsRes.error);
        }

        if (errors.length > 0) {
            console.error("Data fetching errors:", errors.map(e => e?.message).join('\n'));
            throw new Error(errors.map(e => e?.message).join(', '));
        }

        return {
            tenants: tenantsRes.data,
            expenses: expensesRes.data,
            rentData: rentDataRes.data,
            propertySettings: propertySettingsRes.data,
            deposits: depositsRes.data,
            zakatTransactions: zakatRes.data,
            notices: noticesRes.data,
            workDetails: workDetailsRes.data,
            zakatBankDetails: zakatBankDetailsRes.data,
        };

    } catch (error: any) {
        console.error(`Error in fetchAllDataAction:`, error.message, error);
        return { error: error.message };
    }
}
