

import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { ProtectionProvider } from '@/context/protection-context';
import { getDashboardData, getSettingsData } from '@/lib/data';
import { hexToHsl } from '@/lib/utils';
import { AppContextProvider } from '@/context/app-context';

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

const defaultDarkTheme = {
    primary: '#2dd4bf',
    table_header_background: '#2dd4bf',
    table_header_foreground: '#000000',
    table_footer_background: '#a3e635',
    mobile_nav_background: '#0d9488',
    mobile_nav_foreground: '#ffffff',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const initialData = await getDashboardData();
  const { propertySettings } = initialData;

  const themeColors = {
    primary: propertySettings?.theme_primary || defaultTheme.primary,
    table_header_background: propertySettings?.theme_table_header_background || defaultTheme.table_header_background,
    table_header_foreground: propertySettings?.theme_table_header_foreground || defaultTheme.table_header_foreground,
    table_footer_background: propertySettings?.theme_table_footer_background || defaultTheme.table_footer_background,
    mobile_nav_background: propertySettings?.theme_mobile_nav_background || defaultTheme.mobile_nav_background,
    mobile_nav_foreground: propertySettings?.theme_mobile_nav_foreground || defaultTheme.mobile_nav_foreground,
  };
  
  const darkThemeColors = {
    primary: propertySettings?.theme_primary_dark || defaultDarkTheme.primary,
    table_header_background: propertySettings?.theme_table_header_background_dark || defaultDarkTheme.table_header_background,
    table_header_foreground: propertySettings?.theme_table_header_foreground_dark || defaultDarkTheme.table_header_foreground,
    table_footer_background: propertySettings?.theme_table_footer_background_dark || defaultDarkTheme.table_footer_background,
    mobile_nav_background: propertySettings?.theme_mobile_nav_background_dark || defaultDarkTheme.mobile_nav_background,
    mobile_nav_foreground: propertySettings?.theme_mobile_nav_foreground_dark || defaultDarkTheme.mobile_nav_foreground,
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
    .dark {
      --primary: ${hexToHsl(darkThemeColors.primary)};
      --table-header-background: ${hexToHsl(darkThemeColors.table_header_background)};
      --table-header-foreground: ${hexToHsl(darkThemeColors.table_header_foreground)};
      --table-footer-background: ${hexToHsl(darkThemeColors.table_footer_background)};
      --table-footer-foreground: ${hexToHsl('#ffffff')};
      --mobile-nav-background: ${hexToHsl(darkThemeColors.mobile_nav_background)};
      --mobile-nav-foreground: ${hexToHsl(darkThemeColors.mobile_nav_foreground)};
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
          <AppContextProvider initialData={initialData}>
            <AuthProvider>
              <ProtectionProvider>
                  {children}
              </ProtectionProvider>
            </AuthProvider>
          </AppContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
