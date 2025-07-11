"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                             <div className="space-y-2">
                                <Label htmlFor="tab-reports" className="font-normal text-muted-foreground">Reports Tab</Label>
                                <Input id="tab-reports" name="tabNames.reports" value={settings.tabNames.reports} onChange={handleInputChange} />
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
