

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
  return (
    <>{children}</>
  );
}
