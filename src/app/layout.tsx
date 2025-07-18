
import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { AppContextProvider } from '@/context/app-context';
import { ProtectionProvider } from '@/context/protection-context';
import type { PropertySettings, ZakatBankDetail } from '@/types';
import { getSettingsData } from '@/lib/data';


export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { propertySettings } = await getSettingsData();
  let title = "RentFlow";
  let description = "Manage your rental properties with ease.";
  let icons = {};
      
  if (propertySettings) {
    title = propertySettings.metadata_title || "RentFlow";
    if (propertySettings.favicon_url) {
        icons = { icon: propertySettings.favicon_url };
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
  
  const initialSettings = await getSettingsData();

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
            <AppContextProvider initialSettings={initialSettings}>
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
