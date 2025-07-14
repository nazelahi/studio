
import { createClient } from '@supabase/supabase-js'
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or anon key is missing. Please ensure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and the Next.js development server is restarted.");
}

// Export a function to create the client to ensure a fresh instance
export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anon key is missing.");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Export a single instance for general use throughout the app
export const supabase = createSupabaseClient();
