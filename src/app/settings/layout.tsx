
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import { ProtectionProvider } from "@/context/protection-context";
import { SettingsProvider } from "@/context/settings-context";
import { getDashboardData } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - RentFlow",
  description: "Manage your application settings.",
};

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialData = await getDashboardData();
  
  return (
    <AuthProvider>
      <DataProvider initialData={initialData}>
        <SettingsProvider serverSettings={initialData.propertySettings}>
          <ProtectionProvider>
            {children}
          </ProtectionProvider>
        </SettingsProvider>
      </DataProvider>
    </AuthProvider>
  );
}
