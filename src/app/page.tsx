
import { createClient } from '@supabase/supabase-js';
import { getDashboardData } from '@/lib/data';
import * as React from "react"
import { DataProvider } from '@/context/data-context';
import DashboardPageClient from './dashboard-page-client';


// This function creates a Supabase client with admin privileges for server-side use.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
        return null;
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}


export default async function HomePage() {
  const supabaseAdmin = getSupabaseAdmin();

  // Fetch initial data on the server
  const initialData = await getDashboardData();
  
  // Fetch settings on the server
  let settings = initialData.propertySettings;
  if (!settings && supabaseAdmin) {
     const { data: dbSettings, error } = await supabaseAdmin
        .from('property_settings')
        .select('*')
        .eq('id', 1)
        .single();
    if (!error) {
        settings = dbSettings;
    }
  }


  return (
    <DataProvider initialData={initialData}>
        <DashboardPageClient serverSettings={settings} />
    </DataProvider>
  )
}

