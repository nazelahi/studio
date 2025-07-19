
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
