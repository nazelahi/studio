

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
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, Upload, Trash2, ImageIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { updatePropertySettingsAction, updateUserCredentialsAction } from "./actions"
import { useProtection } from "@/context/protection-context"

export default function SettingsPage() {
  const { settings, setSettings, refreshSettings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCredentialsPending, startCredentialsTransition] = useTransition();
  const { withProtection } = useProtection();
  
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State for images currently displayed (mix of existing URLs and new file blobs)
  const [houseImages, setHouseImages] = useState<string[]>(settings.houseImages || []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  
  // State to track the original list of image URLs on page load
  const [initialHouseImages, setInitialHouseImages] = useState<string[]>([]);
  
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  React.useEffect(() => {
    const images = settings.houseImages || [];
    setHouseImages(images);
    // Set the initial list only once when settings are loaded
    if (initialHouseImages.length === 0) {
      setInitialHouseImages(images);
    }
  }, [settings.houseImages, initialHouseImages.length]);

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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeExistingImage = (index: number) => {
    setHouseImages(prev => prev.filter((_, i) => i !== index));
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleSavePropertyDetails = (formData: FormData) => {
     startTransition(async () => {
        // Append existing images that weren't removed
        houseImages.forEach(imgUrl => formData.append('existing_house_images', imgUrl));
        
        // Append new files
        newImageFiles.forEach(file => formData.append('new_house_images', file));
        
        // Append initial list of images for comparison on the server
        formData.append('initial_house_images', JSON.stringify(initialHouseImages));

        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Property Details Saved', description: 'Your property and bank details have been updated.' });
            setNewImageFiles([]);
            refreshSettings(); // This will pull the new image URLs from DB and reset initialHouseImages
        }
     });
  };

  const handleSaveAppSettings = () => {
    // The settings are saved automatically by the useEffect in SettingsProvider
    toast({
        title: 'Application Settings Saved',
        description: 'Your changes have been saved to this browser.',
    });
  };

  const handleSignOut = async () => {
    const { signOut } = await import('@/context/auth-context').then(mod => mod.useAuth());
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    router.push('/');
  };

  const handleLogIn = (e: React.MouseEvent) => {
     withProtection(() => {
        // This will not run if user is not admin,
        // but withProtection will trigger the login dialog.
     }, e);
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
      return (
          <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
              <div className="text-center">
                  <h1 className="text-3xl font-bold">Access Denied</h1>
                  <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
                  <Button onClick={() => router.push('/')} className="mt-6">Go to Dashboard</Button>
              </div>
          </div>
      )
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
          <Link
            href="/settings"
            className={`transition-colors hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {settings.page_dashboard.nav_settings}
          </Link>
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
              <Link
                href="/settings"
                className={`hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {settings.page_dashboard.nav_settings}
              </Link>
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
              <User className="h-5 w-5" />
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
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <div className="grid gap-6">
              <form action={handleSavePropertyDetails}>
                  <Card>
                      <CardHeader>
                          <CardTitle>{settings.page_settings.property_details.title}</CardTitle>
                          <CardDescription>{settings.page_settings.property_details.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="houseName">{settings.page_settings.property_details.house_name_label}</Label>
                                  <Input id="houseName" name="houseName" value={settings.houseName} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="houseAddress">{settings.page_settings.property_details.house_address_label}</Label>
                                  <Input id="houseAddress" name="houseAddress" value={settings.houseAddress} onChange={handleInputChange} />
                              </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium leading-6 text-card-foreground mb-1">Rental Bank Details</h3>
                            <p className="text-sm text-muted-foreground mb-4">Enter the bank details for monthly rent deposits.</p>
                             <div className="grid md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input id="bankName" name="bankName" value={settings.bankName} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                                    <Input id="bankAccountNumber" name="bankAccountNumber" value={settings.bankAccountNumber} onChange={handleInputChange} />
                                </div>
                            </div>
                          </div>

                          <div>
                             <h3 className="text-lg font-medium leading-6 text-card-foreground mb-1">House Pictures</h3>
                             <p className="text-sm text-muted-foreground mb-4">Upload pictures for the slideshow on the homepage.</p>
                             <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {houseImages.map((url, index) => (
                                        <div key={index} className="relative group aspect-video">
                                            <img src={url} alt={`House image ${index + 1}`} className="w-full h-full object-cover rounded-md" data-ai-hint="house exterior" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingImage(index)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {newImageFiles.map((file, index) => (
                                        <div key={index} className="relative group aspect-video">
                                            <img src={URL.createObjectURL(file)} alt={`New image ${index + 1}`} className="w-full h-full object-cover rounded-md" data-ai-hint="house exterior" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewImage(index)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" className="flex flex-col items-center justify-center aspect-video" onClick={() => imageInputRef.current?.click()}>
                                        <Upload className="h-6 w-6 mb-2" />
                                        <span>Upload More</span>
                                    </Button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageFileChange}
                                    />
                                </div>
                             </div>
                          </div>
                      </CardContent>
                      <CardFooter>
                          <Button type="submit" disabled={isPending}>
                             {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                             Save Property & Bank Details
                          </Button>
                      </CardFooter>
                  </Card>
              </form>

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
