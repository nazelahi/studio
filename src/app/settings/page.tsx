
"use client"

import Link from "next/link"
import React, { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { updatePropertySettingsAction, updateUserCredentialsAction } from "./actions"
import { LoginDialog } from "@/components/login-dialog"

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCredentialsPending, startCredentialsTransition] = useTransition();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  React.useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

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

  const handleSavePropertyDetails = (formData: FormData) => {
     if (!isAdmin) {
        toast({ title: 'Unauthorized', description: 'You must be logged in as an admin to perform this action.', variant: 'destructive'});
        return;
     }

     startTransition(async () => {
        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Property Details Saved', description: 'Your house name and address have been updated.' });
        }
     });
  };

  const handleSaveAppSettings = () => {
     if (!isAdmin) {
        toast({ title: 'Unauthorized', description: 'You must be logged in as an admin to perform this action.', variant: 'destructive'});
        return;
     }
    // The settings are saved automatically by the useEffect in SettingsProvider
    toast({
        title: 'Application Settings Saved',
        description: 'Your changes have been saved to this browser.',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    router.push('/');
  };
  
  const handleSaveCredentials = (formData: FormData) => {
    if (!isAdmin || !user) {
      toast({ title: 'Unauthorized', description: 'You must be logged in as an admin to perform this action.', variant: 'destructive'});
      return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive'});
      return;
    }

    startCredentialsTransition(async () => {
      const result = await updateUserCredentialsAction(formData);
      if (result?.error) {
          toast({ title: 'Error Updating Credentials', description: result.error, variant: 'destructive'});
      } else {
          toast({ title: 'Credentials Updated', description: 'Your login details have been changed. You may need to log in again.' });
          setNewPassword('');
          setConfirmPassword('');
      }
   });
  }

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
             <SheetHeader>
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
        <div className="flex-1 text-center min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <p className="truncate">{settings.houseAddress}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(true)}>
              <LogIn className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
           )}
        </div>
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{settings.page_settings.title}</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <div className="grid gap-6">
              <form action={handleSavePropertyDetails}>
                <fieldset disabled={!isAdmin} className="group">
                    <Card className="group-disabled:opacity-50">
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
                            <Button type="submit" disabled={isPending}>
                               {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                               Save
                            </Button>
                        </CardFooter>
                    </Card>
                </fieldset>
              </form>

              <form action={handleSaveCredentials}>
                <fieldset disabled={!isAdmin} className="group">
                    <Card className="group-disabled:opacity-50">
                        <CardHeader>
                            <CardTitle>Admin Credentials</CardTitle>
                            <CardDescription>Update the email and password for the admin account.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <input type="hidden" name="userId" value={user?.id || ''} />
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" name="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isCredentialsPending}>
                               {isCredentialsPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                               Save Credentials
                            </Button>
                        </CardFooter>
                    </Card>
                </fieldset>
              </form>

              <Card>
                  <fieldset disabled={!isAdmin} className="group">
                    <div className="group-disabled:opacity-50">
                        <CardHeader>
                            <CardTitle>{settings.page_settings.app_settings.title}</CardTitle>
                            <CardDescription>{settings.page_settings.app_settings.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
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
                    </div>
                  </fieldset>
              </Card>

              <Card>
                <fieldset disabled={!isAdmin} className="group">
                    <div className="group-disabled:opacity-50">
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
                    </div>
                  </fieldset>
              </Card>

            </div>

          </div>
           <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
            {settings.footerName}
          </footer>
        </main>
        <LoginDialog isOpen={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen} />
      </div>
  )
}
