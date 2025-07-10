"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const pathname = usePathname();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('tabNames.')) {
        const key = name.split('.')[1] as keyof typeof settings.tabNames;
        setSettings(prev => ({
            ...prev,
            tabNames: {
                ...prev.tabNames,
                [key]: value
            }
        }));
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

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
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={`transition-colors hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Settings
          </Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full border-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Settings</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>Customize the names and labels used throughout the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="appName">Header Name</Label>
                        <Input id="appName" name="appName" value={settings.appName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Tab Names</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tab-overview" className="font-normal text-muted-foreground">Overview Tab</Label>
                                <Input id="tab-overview" name="tabNames.overview" value={settings.tabNames.overview} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tab-tenants" className="font-normal text-muted-foreground">Tenants Tab</Label>
                                <Input id="tab-tenants" name="tabNames.tenants" value={settings.tabNames.tenants} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tab-whatsapp" className="font-normal text-muted-foreground">WhatsApp Tab</Label>
                                <Input id="tab-whatsapp" name="tabNames.whatsapp" value={settings.tabNames.whatsapp} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="footerName">Footer Name</Label>
                        <Input id="footerName" name="footerName" value={settings.footerName} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>
          </div>
           <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
            {settings.footerName}
          </footer>
        </main>
      </div>
  )
}
