
"use client"

import Link from "next/link"
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, KeyRound, MapPin, Trash2, Menu, Settings, LockKeyhole } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { useData } from "@/context/data-context"
import { useProtection } from "@/context/protection-context"


export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { updatePropertySettings } = useData();
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setSettings(prev => {
        let newState = { ...prev };
        let currentLevel: any = newState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel = currentLevel[keys[i]];
        }
        
        currentLevel[keys[keys.length - 1]] = value;
        return newState;
    });
  };

  const handleSavePropertyDetails = () => {
     withProtection(async () => {
        await updatePropertySettings({
          house_name: settings.houseName,
          house_address: settings.houseAddress
        });
        toast({
          title: 'Property Details Saved',
          description: 'Your house name and address have been updated.',
        });
     })
  };

  const handleSaveAppSettings = () => {
    withProtection(() => {
        // The settings are saved automatically by the useEffect in SettingsProvider
        toast({
            title: 'Application Settings Saved',
            description: 'Your changes have been saved to this browser.',
        });
    });
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
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
             <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation links for the application.</SheetDescription>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Logo className="h-6 w-6 text-primary" />
                <span className="sr-only">{settings.appName}</span>
              </Link>
              <Link href="/" className={`hover:text-foreground ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}>
                {settings.page_dashboard.nav_dashboard}
              </Link>
              {isAdmin && (
                <Link
                  href="/settings"
                  className={`hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {settings.page_dashboard.nav_settings}
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-center">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <p className="truncate">{settings.houseAddress}</p>
            </div>
        </div>
        <div>
           <Button variant="outline" onClick={(e) => withProtection(() => {}, e)}>
            <LockKeyhole className="mr-2 h-4 w-4" />
            {isAdmin ? "Unlocked" : "Admin"}
          </Button>
        </div>
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{settings.page_settings.title}</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <div className="group grid gap-6">
              <Card>
                <CardHeader>
                    <CardTitle>{settings.page_settings.property_details.title}</CardTitle>
                    <CardDescription>{settings.page_settings.property_details.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="houseName">{settings.page_settings.property_details.house_name_label}</Label>
                        <Input id="houseName" name="houseName" value={settings.houseName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="houseAddress">{settings.page_settings.property_details.house_address_label}</Label>
                        <Input id="houseAddress" name="houseAddress" value={settings.houseAddress} onChange={handleInputChange} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSavePropertyDetails}>Save</Button>
                </CardFooter>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle>{settings.page_settings.app_settings.title}</CardTitle>
                      <CardDescription>{settings.page_settings.app_settings.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="space-y-2">
                          <Label htmlFor="appName">{settings.page_settings.app_settings.header_name_label}</Label>
                          <Input id="appName" name="appName" value={settings.appName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="footerName">{settings.page_settings.app_settings.footer_name_label}</Label>
                          <Input id="footerName" name="footerName" value={settings.footerName} onChange={handleInputChange} />
                      </div>
                  </CardContent>
                   <CardFooter>
                    <Button onClick={handleSaveAppSettings}>Save</Button>
                </CardFooter>
              </Card>

              <Card>
                  <CardHeader>
                    <CardTitle>{settings.page_settings.overview_settings.title}</CardTitle>
                    <CardDescription>{settings.page_settings.overview_settings.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="overview-financial-title">{settings.page_settings.overview_settings.financial_title_label}</Label>
                          <Input id="overview-financial-title" name="page_overview.financial_overview_title" value={settings.page_overview.financial_overview_title} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="overview-financial-desc">{settings.page_settings.overview_settings.financial_description_label}</Label>
                          <Input id="overview-financial-desc" name="page_overview.financial_overview_description" value={settings.page_overview.financial_overview_description} onChange={handleInputChange} />
                      </div>
                  </CardContent>
                   <CardFooter>
                    <Button onClick={handleSaveAppSettings}>Save</Button>
                </CardFooter>
              </Card>

            </div>

          </div>
           <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
            {settings.footerName}
          </footer>
        </main>
      </div>
  )
}
