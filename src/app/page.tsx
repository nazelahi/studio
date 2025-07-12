
"use client"

import Link from "next/link"
import * as React from "react"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/icons"
import DashboardTabs from "@/components/dashboard-tabs"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoginDialog } from "@/components/login-dialog"


export default function HomePage() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
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
            {settings.page_dashboard.nav_dashboard}
          </Link>
          {isAdmin && (
            <Link
              href="/settings"
              className={`transition-colors hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {settings.page_dashboard.nav_settings}
            </Link>
          )}
        </nav>
        <div className="flex-1 text-center">
            <h1 className="text-lg font-bold tracking-tight text-primary">{settings.houseName}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <p>{settings.houseAddress}</p>
            </div>
        </div>
        <div>
            {user ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">{settings.page_dashboard.user_menu_tooltip}</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{settings.page_dashboard.user_menu_logout}</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            ) : (
            <Button onClick={() => setIsLoginOpen(true)}>{settings.page_dashboard.signin_button}</Button>
            )}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardTabs />
        <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
          {settings.footerName}
        </footer>
      </main>
      <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  )
}
