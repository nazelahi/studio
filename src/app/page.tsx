"use client"

import Link from "next/link"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/icons"
import DashboardTabs from "@/components/dashboard-tabs"

export default function HomePage() {
  const { settings } = useSettings();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="flex flex-1 flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">{settings.appName}</span>
          </Link>
          <Link
            href="/"
            className={`transition-colors hover:text-foreground ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={`transition-colors hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Settings
          </Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardTabs />
        <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
          {settings.footerName}
        </footer>
      </main>
    </div>
  )
}
