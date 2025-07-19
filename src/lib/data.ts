
import { createClient } from '@supabase/supabase-js';
import { subYears, format } from 'date-fns';
import type { Tenant, Expense, RentEntry, PropertySettings, Deposit, ZakatTransaction, Notice, WorkDetail, ZakatBankDetail, Document } from '@/types';

const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

export interface AppData {
  tenants: Tenant[];
  expenses: Expense[];
  rentData: RentEntry[];
  propertySettings: PropertySettings | null;
  deposits: Deposit[];
  zakatTransactions: ZakatTransaction[];
  zakatBankDetails: ZakatBankDetail[];
  notices: Notice[];
  workDetails: WorkDetail[];
  documents: Document[];
}

export async function getDashboardData(): Promise<AppData> {
    const supabase = getSupabaseAdmin();
    const twoYearsAgo = format(subYears(new Date(), 2), 'yyyy-MM-dd');

    try {
        const [
            tenantsRes, 
            expensesRes, 
            rentDataRes, 
            propertySettingsRes, 
            depositsRes, 
            zakatRes, 
            noticesRes, 
            workDetailsRes, 
            zakatBankDetailsRes, 
            documentsRes
        ] = await Promise.all([
            supabase.from('tenants').select('id, name, email, phone, property, rent, join_date, notes, status, avatar, type, documents, father_name, address, date_of_birth, nid_number, advance_deposit, gas_meter_number, electric_meter_number, created_at').is('deleted_at', null).gte('created_at', twoYearsAgo).order('name', { ascending: true }),
            supabase.from('expenses').select('id, date, category, amount, description, status').is('deleted_at', null).gte('date', twoYearsAgo).order('date', { ascending: false }),
            supabase.from('rent_entries').select('id, tenant_id, name, property, rent, due_date, status, avatar, year, month, payment_date, collected_by, payment_for_month').is('deleted_at', null).gte('due_date', twoYearsAgo).order('due_date', { ascending: false }),
            supabase.from('property_settings').select('*').eq('id', 1).maybeSingle(),
            supabase.from('deposits').select('id, year, month, amount, deposit_date, receipt_url').gte('deposit_date', twoYearsAgo).order('deposit_date', { ascending: false }),
            supabase.from('zakat_transactions').select('id, transaction_date, type, amount, source_or_recipient, description, receipt_url').gte('transaction_date', twoYearsAgo).order('transaction_date', { ascending: false }),
            supabase.from('notices').select('id, year, month, content').gte('created_at', twoYearsAgo).order('created_at', { ascending: false }),
            supabase.from('work_details').select('id, title, description, category, status, product_cost, worker_cost, due_date, created_at').is('deleted_at', null).gte('created_at', twoYearsAgo).order('created_at', { ascending: false }),
            supabase.from('zakat_bank_details').select('id, bank_name, account_number, account_holder, logo_url, location').order('bank_name', { ascending: true }),
            supabase.from('documents').select('*').order('created_at', { ascending: false }),
        ]);

        const checkError = (res: any, name: string) => {
            if (res.error) {
                 const errorCode = res.error?.code;
                 // Ignore "No rows found" for single-item fetches and "undefined table" for optional tables.
                 if (errorCode && (errorCode === 'PGRST116' || errorCode === '42P01')) {
                    // This is an expected case (e.g., no settings row found yet), so we don't throw.
                    return;
                 }
                 // For all other errors, log and throw.
                 console.error(`Error fetching ${name}:`, res.error);
                 throw res.error;
            }
        };

        checkError(tenantsRes, 'tenants');
        checkError(expensesRes, 'expenses');
        checkError(rentDataRes, 'rentData');
        checkError(propertySettingsRes, 'propertySettings');
        checkError(depositsRes, 'deposits');
        checkError(zakatRes, 'zakatTransactions');
        checkError(noticesRes, 'notices');
        checkError(workDetailsRes, 'workDetails');
        checkError(zakatBankDetailsRes, 'zakatBankDetails');
        checkError(documentsRes, 'documents');

        return {
            tenants: tenantsRes.data || [],
            expenses: expensesRes.data || [],
            rentData: rentDataRes.data || [],
            propertySettings: propertySettingsRes.data || null,
            deposits: depositsRes.data || [],
            zakatTransactions: zakatRes.data || [],
            notices: noticesRes.data || [],
            workDetails: workDetailsRes.data || [],
            zakatBankDetails: zakatBankDetailsRes.data || [],
            documents: documentsRes.data || [],
        };
    } catch (error) {
        console.error("Failed to fetch dashboard data on server:", error);
        // Return empty state on failure
        return {
            tenants: [], expenses: [], rentData: [], propertySettings: null, deposits: [],
            zakatTransactions: [], notices: [], workDetails: [], zakatBankDetails: [], documents: []
        };
    }
}

export async function getSettingsData(): Promise<{
    propertySettings: PropertySettings | null;
    zakatBankDetails: ZakatBankDetail[];
}> {
    const supabase = getSupabaseAdmin();

    try {
        const [propertySettingsRes, zakatBankDetailsRes] = await Promise.all([
            supabase.from('property_settings').select('*').eq('id', 1).maybeSingle(),
            supabase.from('zakat_bank_details').select('id, bank_name, account_number, account_holder, logo_url, location').order('bank_name', { ascending: true }),
        ]);

        const checkError = (res: any, name: string) => {
            if (res.error) {
                 const errorCode = res.error?.code;
                 if (errorCode && (errorCode === 'PGRST116' || errorCode === '42P01')) {
                    return;
                 }
                 console.error(`Error fetching ${name}:`, res.error);
                 throw res.error;
            }
        };

        checkError(propertySettingsRes, 'propertySettings');
        checkError(zakatBankDetailsRes, 'zakatBankDetails');

        return {
            propertySettings: propertySettingsRes.data || null,
            zakatBankDetails: zakatBankDetailsRes.data || [],
        };
    } catch (error) {
        console.error("Failed to fetch settings data on server:", error);
        return {
            propertySettings: null,
            zakatBankDetails: [],
        };
    }
}
