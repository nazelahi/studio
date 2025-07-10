import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// IMPORTANT: Create a .env.local file in the root of your project
// and add your Supabase project URL and anon key:
// NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn("Supabase URL or anon key is missing. Supabase client not initialized.");
}


export { supabase };
