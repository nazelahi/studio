
"use client"

import Link from "next/link"
import React, { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, Building, KeyRound, Palette, Tag, Landmark, Upload, Banknote, UserCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { updatePropertySettingsAction, updateUserCredentialsAction } from "./actions"
import { useProtection } from "@/context/protection-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SettingsTab = 'property' | 'account' | 'application' | 'labels';

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


export default function SettingsPage() {
  const { settings, setSettings, refreshSettings } = useSettings();
  const router = useRouter();
  const { isAdmin, user, signOut } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCredentialsPending, startCredentialsTransition] = useTransition();
  const { withProtection } = useProtection();
  
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [activeTab, setActiveTab] = useState<SettingsTab>('property');
  
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const [ownerPhotoPreview, setOwnerPhotoPreview] = React.useState<string | null>(null);
  const [ownerPhotoFile, setOwnerPhotoFile] = React.useState<File | null>(null);
  const ownerPhotoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  React.useEffect(() => {
    setLogoPreview(settings.bankLogoUrl || null);
    setOwnerPhotoPreview(settings.ownerPhotoUrl || null);
  }, [settings.bankLogoUrl, settings.ownerPhotoUrl]);

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
  
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleOwnerPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setOwnerPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setOwnerPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };


  const handleSavePropertyDetails = (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     const formData = new FormData(event.currentTarget);
     if (logoFile) {
        formData.append('logoFile', logoFile);
     }
     if (ownerPhotoFile) {
        formData.append('ownerPhotoFile', ownerPhotoFile);
     }

     startTransition(async () => {
        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Property Details Saved', description: 'Your property and bank details have been updated.' });
            refreshSettings(); 
        }
     });
  };

  const handleSaveAppSettings = () => {
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

  const handleLogIn = (e: React.MouseEvent) => {
     withProtection(() => {}, e);
  }
  
  const handleSaveCredentials = (formData: FormData) => {
    if (!user) {
      toast({ title: 'Unauthorized', description: 'You must be logged in to perform this action.', variant: 'destructive'});
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
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">{settings.appName}</span>
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
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Logo className="h-6 w-6 text-primary" />
                <span className="sr-only">{settings.appName}</span>
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
              
              {activeTab === 'property' && (
                <form onSubmit={handleSavePropertyDetails} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Owner Details</CardTitle>
                            <CardDescription>Set the name and photo of the property owner.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="ownerName">Owner Name</Label>
                                <Input id="ownerName" name="ownerName" defaultValue={settings.ownerName} />
                                <input type="hidden" name="oldOwnerName" value={settings.ownerName} />
                            </div>
                             <div className="space-y-2">
                                <Label>Owner Photo</Label>
                                <input type="hidden" name="owner_photo_url" value={settings.ownerPhotoUrl || ''} />
                                {settings.ownerPhotoUrl && <input type="hidden" name="oldOwnerPhotoUrl" value={settings.ownerPhotoUrl} />}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 rounded-md">
                                        <AvatarImage src={ownerPhotoPreview} data-ai-hint="person portrait"/>
                                        <AvatarFallback className="rounded-md"><UserCircle className="h-8 w-8"/></AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => ownerPhotoInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4"/>
                                        Upload Photo
                                    </Button>
                                    <Input ref={ownerPhotoInputRef} type="file" name="ownerPhotoFile" className="hidden" accept="image/*" onChange={handleOwnerPhotoFileChange} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Property Details</CardTitle>
                            <CardDescription>Set the name and address of your property.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="houseName">{settings.page_settings.property_details.house_name_label}</Label>
                                <Input id="houseName" name="houseName" defaultValue={settings.houseName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="houseAddress">{settings.page_settings.property_details.house_address_label}</Label>
                                <Input id="houseAddress" name="houseAddress" defaultValue={settings.houseAddress} onChange={handleInputChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rental Bank Details</CardTitle>
                            <CardDescription>Enter the bank details for monthly rent deposits.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                               <div className="space-y-2">
                                  <Label htmlFor="bankName">Bank Name</Label>
                                  <Input id="bankName" name="bankName" defaultValue={settings.bankName} onChange={handleInputChange} />
                               </div>
                               <div className="space-y-2">
                                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                                  <Input id="bankAccountNumber" name="bankAccountNumber" defaultValue={settings.bankAccountNumber} onChange={handleInputChange} />
                               </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Bank Logo</Label>
                                <input type="hidden" name="bank_logo_url" value={settings.bankLogoUrl || ''} />
                                {settings.bankLogoUrl && <input type="hidden" name="oldLogoUrl" value={settings.bankLogoUrl} />}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 rounded-md">
                                        <AvatarImage src={logoPreview} data-ai-hint="logo bank"/>
                                        <AvatarFallback className="rounded-md"><Banknote className="h-8 w-8"/></AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4"/>
                                        Upload Logo
                                    </Button>
                                    <Input ref={logoInputRef} type="file" name="logoFile" className="hidden" accept="image/*" onChange={handleLogoFileChange} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-start">
                      <Button type="submit" disabled={isPending}>
                         {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                         Save Property Settings
                      </Button>
                    </div>
                </form>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <form action={handleSaveCredentials}>
                      <Card>
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
                  </form>
                  <Card>
                    <CardHeader>
                      <CardTitle>Passcode</CardTitle>
                      <CardDescription>Set a secret passcode required for edit and delete actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-2">
                          <Label htmlFor="passcode">Secret Passcode</Label>
                          <Input id="passcode" name="passcode" type="password" placeholder="e.g. 1234" />
                        </div>
                    </CardContent>
                     <CardFooter>
                      <Button disabled>Save Passcode</Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {activeTab === 'application' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{settings.page_settings.app_settings.title}</CardTitle>
                        <CardDescription>{settings.page_settings.app_settings.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="appName">{settings.page_settings.app_settings.header_name_label}</Label>
                            <Input id="appName" name="appName" defaultValue={settings.appName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="footerName">{settings.page_settings.app_settings.footer_name_label}</Label>
                            <Input id="footerName" name="footerName" defaultValue={settings.footerName} onChange={handleInputChange} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveAppSettings}>Save</Button>
                    </CardFooter>
                </Card>
              )}
              
              {activeTab === 'labels' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>{settings.page_settings.overview_settings.title}</CardTitle>
                        <CardDescription>{settings.page_settings.overview_settings.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="overview-financial-title">{settings.page_settings.overview_settings.financial_title_label}</Label>
                            <Input id="overview-financial-title" name="page_overview.financial_overview_title" defaultValue={settings.page_overview.financial_overview_title} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="overview-financial-desc">{settings.page_settings.overview_settings.financial_description_label}</Label>
                            <Input id="overview-financial-desc" name="page_overview.financial_overview_description" defaultValue={settings.page_overview.financial_overview_description} onChange={handleInputChange} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveAppSettings}>Save</Button>
                    </CardFooter>
                </Card>
              )}
            </div>

          </div>
           <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
            {settings.footerName}
          </footer>
        </main>
      </div>
  )
}
