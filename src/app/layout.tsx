
import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { createClient } from '@supabase/supabase-js';
import { AppContextProvider } from '@/context/app-context';
import { ProtectionProvider } from '@/context/protection-context';

// It's safe to use service role key here as this runs on the server.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Supabase URL or service role key is not configured on the server. Please check your environment variables.');
        return null;
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabaseAdmin = getSupabaseAdmin();
  let title = "RentFlow";
  let description = "Manage your rental properties with ease.";
  let icons = {};

  if (supabaseAdmin) {
      const { data: settings, error } = await supabaseAdmin
        .from('property_settings')
        .select('metadata_title, favicon_url')
        .eq('id', 1)
        .single();
    
      if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
        console.error("Error fetching metadata:", error);
      }
      
      if (settings) {
        title = settings.metadata_title || "RentFlow";
        if (settings.favicon_url) {
            icons = { icon: settings.favicon_url };
        }
      }
  }

  return {
    title: title,
    description: description,
    icons: icons,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppContextProvider>
              <ProtectionProvider>
                  {children}
              </ProtectionProvider>
            </AppContextProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
