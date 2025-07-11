"use client"

import Link from "next/link"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/icons"
import DashboardTabs from "@/components/dashboard-tabs"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function HomePage() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const { user, signOut } = useAuth();


  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="flex-1 flex items-center gap-5 text-sm font-medium">
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
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </Button>
        </div>
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
