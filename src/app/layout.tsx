
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from '@/context/settings-context';
import { DataProvider } from '@/context/data-context';
import { AuthProvider } from '@/context/auth-context';
import { ProtectionProvider } from '@/context/protection-context';

export const metadata: Metadata = {
  title: 'RentFlow',
  description: 'Manage your rental properties with ease.',
};

export default function RootLayout({
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
        <AuthProvider>
          <DataProvider>
            <SettingsProvider>
              <ProtectionProvider>
                {children}
              </ProtectionProvider>
            </SettingsProvider>
          </DataProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
