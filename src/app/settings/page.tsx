
"use client"

import Link from "next/link"
import React, { useState, Suspense } from "react"
import { Logo } from "@/components/icons"
import { useAppContext } from "@/context/app-context"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, Building, KeyRound, Palette, Tag, UserCircle, Database, Share2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useProtection } from "@/context/protection-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import dynamic from 'next/dynamic'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type SettingsTab = 'property' | 'account' | 'application' | 'labels' | 'integrations' | 'data';

function AccessDenied() {
  const router = useRouter();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Go to Dashboard</Button>
      </div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
    </CardContent>
  </Card>
);

const PropertySettingsTab = dynamic(() => import('./property-settings-tab'), { loading: () => <LoadingSkeleton /> });
const AccountSettingsTab = dynamic(() => import('./account-settings-tab'), { loading: () => <LoadingSkeleton /> });
const ApplicationSettingsTab = dynamic(() => import('./application-settings-tab'), { loading: () => <LoadingSkeleton /> });
const LabelsSettingsTab = dynamic(() => import('./labels-settings-tab'), { loading: () => <LoadingSkeleton /> });
const IntegrationsSettingsTab = dynamic(() => import('./integrations-settings-tab'), { loading: () => <LoadingSkeleton /> });

export default function SettingsPage() {
  const { settings } = useAppContext();
  const router = useRouter();
  const { isAdmin, user, signOut } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('property');

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    router.push('/');
  };

  const handleLogIn = (e: React.MouseEvent) => {
     withProtection(() => {}, e);
  }
  
  if (!isAdmin) {
      return <AccessDenied />;
  }
  
  const navigationLinks = (
    <>
      <button onClick={() => setActiveTab('property')} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {'bg-muted text-primary': activeTab === 'property'})}>
        <Building className="h-4 w-4" />
        Property
      </button>
      <button onClick={() => setActiveTab('account')} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {'bg-muted text-primary': activeTab === 'account'})}>
        <KeyRound className="h-4 w-4" />
        Account
      </button>
       <button onClick={() => setActiveTab('integrations')} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {'bg-muted text-primary': activeTab === 'integrations'})}>
        <Share2 className="h-4 w-4" />
        Integrations
      </button>
      <Link href="/settings/data-management" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Database className="h-4 w-4" />
        Data Management
      </Link>
      <button onClick={() => setActiveTab('application')} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {'bg-muted text-primary': activeTab === 'application'})}>
        <Palette className="h-4 w-4" />
        Application
      </button>
      <button onClick={() => setActiveTab('labels')} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {'bg-muted text-primary': activeTab === 'labels'})}>
        <Tag className="h-4 w-4" />
        Page Labels
      </button>
    </>
  );

  return (
     <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            {settings.appLogoUrl ? (
                <img src={settings.appLogoUrl} alt={settings.houseName} className="h-6 w-auto" />
            ) : (
                <Logo className="h-6 w-6 text-primary" />
            )}
            <span className="sr-only">{settings.houseName}</span>
          </Link>
          <Link
            href="/"
            className={`transition-colors hover:text-foreground text-muted-foreground`}
          >
            {settings.page_dashboard.nav_dashboard}
          </Link>
          {isAdmin && (
            <Link
              href="/settings"
              className={`transition-colors hover:text-foreground text-foreground`}
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
          <SheetContent side="left" className="p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Mobile Navigation</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium p-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                {settings.appLogoUrl ? (
                    <img src={settings.appLogoUrl} alt={settings.houseName} className="h-6 w-auto" />
                ) : (
                    <Logo className="h-6 w-6 text-primary" />
                )}
                <span className="sr-only">{settings.houseName}</span>
              </Link>
              <Link href="/" className={`hover:text-foreground text-muted-foreground`}>
                {settings.page_dashboard.nav_dashboard}
              </Link>
              {isAdmin && (
                <Link
                  href="/settings"
                  className={`hover:text-foreground text-foreground`}
                >
                  {settings.page_dashboard.nav_settings}
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-center min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <p className="truncate">{settings.houseAddress}</p>
            </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9">
                  <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                  <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             {isAdmin ? (
                <>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                </>
             ) : (
                <>
                    <DropdownMenuLabel>Guest</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogIn}>
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Admin Log in</span>
                    </DropdownMenuItem>
                </>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{settings.page_settings.title}</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            <nav className="grid gap-4 text-sm text-muted-foreground">
                {navigationLinks}
            </nav>
            <div className="grid gap-6">
              {activeTab === 'property' && <PropertySettingsTab />}
              {activeTab === 'account' && <AccountSettingsTab />}
              {activeTab === 'integrations' && <IntegrationsSettingsTab />}
              {activeTab === 'application' && <ApplicationSettingsTab />}
              {activeTab === 'labels' && <LabelsSettingsTab />}
            </div>
          </div>
        </main>
      </div>
  );
}
