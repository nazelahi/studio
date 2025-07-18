
import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { AppContextProvider } from '@/context/app-context';
import { ProtectionProvider } from '@/context/protection-context';
import type { PropertySettings, ZakatBankDetail } from '@/types';
import { getSettingsData } from '@/lib/data';
import { hexToHsl } from '@/lib/utils';

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

const defaultTheme = {
    primary: '#14b8a6',
    table_header_background: '#14b8a6',
    table_header_foreground: '#ffffff',
    table_footer_background: '#84cc16',
    mobile_nav_background: '#008080',
    mobile_nav_foreground: '#ffffff',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { propertySettings, zakatBankDetails } = await getSettingsData();

  const themeColors = {
    primary: propertySettings?.theme_primary || defaultTheme.primary,
    table_header_background: propertySettings?.theme_table_header_background || defaultTheme.table_header_background,
    table_header_foreground: propertySettings?.theme_table_header_foreground || defaultTheme.table_header_foreground,
    table_footer_background: propertySettings?.theme_table_footer_background || defaultTheme.table_footer_background,
    mobile_nav_background: propertySettings?.theme_mobile_nav_background || defaultTheme.mobile_nav_background,
    mobile_nav_foreground: propertySettings?.theme_mobile_nav_foreground || defaultTheme.mobile_nav_foreground,
  };

  const themeStyle = `
    :root {
      --primary: ${hexToHsl(themeColors.primary)};
      --table-header-background: ${hexToHsl(themeColors.table_header_background)};
      --table-header-foreground: ${hexToHsl(themeColors.table_header_foreground)};
      --table-footer-background: ${hexToHsl(themeColors.table_footer_background)};
      --table-footer-foreground: ${hexToHsl('#ffffff')};
      --mobile-nav-background: ${hexToHsl(themeColors.mobile_nav_background)};
      --mobile-nav-foreground: ${hexToHsl(themeColors.mobile_nav_foreground)};
    }
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppContextProvider initialSettings={{ propertySettings, zakatBankDetails }}>
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
