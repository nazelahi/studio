
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import { ProtectionProvider } from "@/context/protection-context";
import { SettingsProvider } from "@/context/settings-context";
import { getSettingsData } from "@/lib/data";
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
  // Fetch only the necessary settings data, not the entire dashboard data
  const { propertySettings, zakatBankDetails } = await getSettingsData();
  
  // Provide minimal data to DataProvider to avoid breaking dependencies
  const initialData = {
    tenants: [],
    expenses: [],
    rentData: [],
    propertySettings: propertySettings,
    deposits: [],
    zakatTransactions: [],
    zakatBankDetails: zakatBankDetails,
    notices: [],
    workDetails: [],
    documents: [],
  };

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
