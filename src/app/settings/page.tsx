"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Home as HomeIcon, DollarSign, Users, LineChart, Settings, Building2 } from "lucide-react"
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
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
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold text-primary">{settings.appName}</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/'}>
                <Link href="/">
                  <HomeIcon />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Properties">
                <Building2 />
                Properties
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Payments">
                <DollarSign />
                Payments
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Reports">
                <LineChart />
                Reports
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === '/settings'}>
                <Link href="/settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
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
        </header>
        <main className="flex-1 flex flex-col p-4 md:p-6">
          <div className="flex-grow">
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
           <footer className="text-center text-sm text-muted-foreground mt-8">
            {settings.footerName}
          </footer>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
