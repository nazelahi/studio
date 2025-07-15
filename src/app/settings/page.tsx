

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
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, Building, KeyRound, Palette, Tag, Landmark, Upload, Banknote, UserCircle, MessageSquare, Info, Phone, Mail, Database, RefreshCw, HardDriveDownload, HardDriveUpload, Trash2, SlidersHorizontal, Share2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { updatePropertySettingsAction, updateUserCredentialsAction, updatePasscodeAction } from "./actions"
import { useProtection } from "@/context/protection-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/context/data-context"
import { saveAs } from "file-saver"
import { clearMonthlyDataAction, clearYearlyDataAction, generateSqlBackupAction } from "@/app/actions/data"


type SettingsTab = 'property' | 'account' | 'application' | 'labels' | 'integrations';

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

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];


export default function SettingsPage() {
  const { settings, setSettings, refreshSettings } = useSettings();
  const router = useRouter();
  const { isAdmin, user, signOut } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCredentialsPending, startCredentialsTransition] = useTransition();
  const [isPasscodePending, startPasscodeTransition] = useTransition();
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

  // States for Integrations Tab
  const { getAllData, restoreAllData } = useData();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSqlPending, startSqlTransition] = React.useTransition();
  const [isClearPending, startClearTransition] = React.useTransition();

  const currentYear = new Date().getFullYear();
  const [clearYear, setClearYear] = React.useState(currentYear.toString());
  const [clearMonth, setClearMonth] = React.useState<string | undefined>(undefined);
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  React.useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  React.useEffect(() => {
    setLogoPreview(settings.bankLogoUrl || null);
    setOwnerPhotoPreview(settings.ownerPhotoUrl || null);
  }, [settings.bankLogoUrl, settings.ownerPhotoUrl]);
  
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setSettings((prev: any) => {
        let newState = { ...prev };
        let currentLevel: any = newState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel[keys[i]] = { ...currentLevel[keys[i]] }; // Ensure nested objects are created
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

  const handleReminderScheduleChange = (checked: boolean, value: string) => {
    setSettings(prev => {
        const schedule = prev.whatsappReminderSchedule || [];
        if (checked) {
            return { ...prev, whatsappReminderSchedule: [...schedule, value] };
        } else {
            return { ...prev, whatsappReminderSchedule: schedule.filter(item => item !== value) };
        }
    });
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
     
     formData.append('whatsapp_reminders_enabled', settings.whatsappRemindersEnabled ? 'on' : 'off');
     (settings.whatsappReminderSchedule || []).forEach(item => {
        formData.append('whatsapp_reminder_schedule', item);
     });
     formData.append('whatsapp_reminder_template', settings.whatsappReminderTemplate || '');


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
    setSettings(settings); // This triggers the save-to-localStorage logic in the context
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

  const handleSavePasscode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startPasscodeTransition(async () => {
      const result = await updatePasscodeAction(formData);
      if (result?.error) {
        toast({ title: 'Error Saving Passcode', description: result.error, variant: 'destructive'});
      } else {
        toast({ title: 'Passcode Saved', description: 'Your secret passcode has been updated.' });
        refreshSettings();
      }
    });
  }

  // Integration Tab handlers
  const handleBackup = () => {
    setIsProcessing(true);
    toast({ title: "Generating backup...", description: "This may take a few moments." });

    setTimeout(() => {
      try {
        const currentData = getAllData();
        const backupPayload = {
          timestamp: new Date().toISOString(),
          data: currentData,
        };
        const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json;charset=utf-8" });
        
        const date = new Date().toISOString().split('T')[0];
        saveAs(blob, `rentflow_backup_${date}.json`);
        
        toast({ title: "Backup Complete", description: "Your data has been downloaded as a JSON file." });
      } catch (e) {
        toast({ title: "Backup Failed", description: "Could not create backup file. Check console for errors.", variant: "destructive" });
        console.error("Backup error:", e);
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleSqlBackup = (e: React.MouseEvent) => {
    withProtection(() => {
        startSqlTransition(async () => {
            toast({ title: "Generating SQL backup...", description: "This may take a few moments." });
            const result = await generateSqlBackupAction();
            if (result.error) {
                toast({ title: "SQL Backup Failed", description: result.error, variant: "destructive" });
            } else if (result.success && result.data) {
                const blob = new Blob([result.data], { type: "application/sql;charset=utf-8" });
                const date = new Date().toISOString().split('T')[0];
                saveAs(blob, `rentflow_sql_backup_${date}.sql`);
                toast({ title: "SQL Backup Complete", description: "Your data has been downloaded as a .sql file." });
            }
        });
    }, e);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: "Restoring data...", description: "Please wait while we process the backup file." });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backupPayload = JSON.parse(text);

        if (backupPayload && backupPayload.data && backupPayload.data.tenants && backupPayload.data.expenses && backupPayload.data.rentData) {
          restoreAllData(backupPayload.data, toast);
          // The restoreAllData function will handle toast and reload
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (err: any) {
        toast({ title: "Restore Failed", description: err.message || "The file could not be read or is corrupted.", variant: "destructive" });
        console.error("Restore error:", err);
      } finally {
        setIsProcessing(false);
        if(event.target) event.target.value = ''; // Reset file input
      }
    };
    reader.onerror = () => {
        toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
        setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleClearData = (e: React.MouseEvent) => {
    withProtection(() => {
        startClearTransition(async () => {
            const formData = new FormData();
            formData.set('year', clearYear);

            if (clearMonth) { // Clear monthly data
                formData.set('month', clearMonth);
                const result = await clearMonthlyDataAction(formData);
                if (result.error) {
                    toast({ title: 'Error Clearing Data', description: result.error, variant: 'destructive' });
                } else {
                    toast({ title: 'Data Cleared', description: result.message, variant: 'destructive' });
                }
            } else { // Clear yearly data
                const result = await clearYearlyDataAction(formData);
                if (result.error) {
                    toast({ title: 'Error Clearing Data', description: result.error, variant: 'destructive' });
                } else {
                    toast({ title: 'Data Cleared', description: result.message, variant: 'destructive' });
                }
            }
        });
    }, e)
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
          <SheetContent side="left" className="p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Mobile Navigation</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium p-6">
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
                                <Input id="houseName" name="houseName" defaultValue={settings.houseName} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="houseAddress">{settings.page_settings.property_details.house_address_label}</Label>
                                <Input id="houseAddress" name="houseAddress" defaultValue={settings.houseAddress} />
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
                                  <Input id="bankName" name="bankName" defaultValue={settings.bankName} />
                               </div>
                               <div className="space-y-2">
                                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                                  <Input id="bankAccountNumber" name="bankAccountNumber" defaultValue={settings.bankAccountNumber} />
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
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Footer Details</CardTitle>
                            <CardDescription>Set the "About Us" and contact information for the footer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="about_us">About Us</Label>
                                <Textarea id="about_us" name="about_us" defaultValue={settings.aboutUs} placeholder="Write a short description about your property or business..."/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="footerName">Footer Copyright Text</Label>
                                <Input id="footerName" name="footerName" defaultValue={settings.footerName} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_email">Contact Email</Label>
                                    <Input id="contact_email" name="contact_email" type="email" defaultValue={settings.contactEmail}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone">Contact Phone</Label>
                                    <Input id="contact_phone" name="contact_phone" defaultValue={settings.contactPhone}/>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_address">Contact Address</Label>
                                <Input id="contact_address" name="contact_address" defaultValue={settings.contactAddress}/>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Theme Colors</CardTitle>
                        <CardDescription>Customize the look and feel of the application.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="space-y-4">
                              <Label className="font-medium">Theme Colors</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="theme_primary">Primary</Label>
                                      <Input id="theme_primary" name="theme_primary" type="color" defaultValue={settings.theme.colors.primary} onChange={(e) => handleInputChange({ target: { name: 'theme.colors.primary', value: e.target.value } } as any)} className="p-1 h-10"/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="theme_table_header_background">Table Header</Label>
                                      <Input id="theme_table_header_background" name="theme_table_header_background" type="color" defaultValue={settings.theme.colors.table_header_background} onChange={(e) => handleInputChange({ target: { name: 'theme.colors.table_header_background', value: e.target.value } } as any)} className="p-1 h-10"/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="theme_table_header_foreground">Table Header Text</Label>
                                      <Input id="theme_table_header_foreground" name="theme_table_header_foreground" type="color" defaultValue={settings.theme.colors.table_header_foreground} onChange={(e) => handleInputChange({ target: { name: 'theme.colors.table_header_foreground', value: e.target.value } } as any)} className="p-1 h-10"/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="theme_table_footer_background">Table Footer</Label>
                                      <Input id="theme_table_footer_background" name="theme_table_footer_background" type="color" defaultValue={settings.theme.colors.table_footer_background} onChange={(e) => handleInputChange({ target: { name: 'theme.colors.table_footer_background', value: e.target.value } } as any)} className="p-1 h-10"/>
                                  </div>
                              </div>
                          </div>
                          <div className="space-y-4 mt-6">
                              <Label className="font-medium">Mobile Navigation Colors</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                   <div className="space-y-2">
                                      <Label htmlFor="theme_mobile_nav_background">Background</Label>
                                      <Input id="theme_mobile_nav_background" name="theme_mobile_nav_background" type="color" defaultValue={settings.theme.colors.mobile_nav_background} onChange={(e) => handleInputChange({ target: { name: 'theme.colors.mobile_nav_background', value: e.target.value } } as any)} className="p-1 h-10"/>
                                  </div>
                                   <div className="space-y-2">
                                      <Label htmlFor="theme_mobile_nav_foreground">Text/Icon</Label>
                                      <Input id="theme_mobile_nav_foreground" name="theme_mobile_nav_foreground" type="color" defaultValue={settings.theme.colors.mobile_nav_foreground} onChange={(e) => handleInputChange({ target: { name: 'theme.colors.mobile_nav_foreground', value: e.target.value } } as any)} className="p-1 h-10"/>
                                  </div>
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
                  <form onSubmit={handleSavePasscode}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Passcode</CardTitle>
                        <CardDescription>Set a secret passcode required for edit and delete actions.</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <div className="space-y-2">
                            <Label htmlFor="passcode">Secret Passcode</Label>
                            <Input id="passcode" name="passcode" type="password" placeholder="e.g. 1234" defaultValue={settings.passcode} required/>
                          </div>
                      </CardContent>
                       <CardFooter>
                        <Button type="submit" disabled={isPasscodePending}>
                            {isPasscodePending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Save Passcode
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </div>
              )}

              {activeTab === 'integrations' && (
                <form onSubmit={handleSavePropertyDetails} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>WhatsApp Automation</CardTitle>
                      <CardDescription>
                        Configure automatic rent reminders via WhatsApp.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <Label htmlFor="whatsapp_reminders_enabled" className="flex flex-col space-y-1">
                          <span>Enable Auto-Reminders</span>
                          <span className="font-normal leading-snug text-muted-foreground">
                            Send automated reminders to tenants with pending payments.
                          </span>
                        </Label>
                        <Switch
                          id="whatsapp_reminders_enabled"
                          name="whatsapp_reminders_enabled"
                          checked={settings.whatsappRemindersEnabled}
                          onCheckedChange={(checked) => setSettings(prev => ({...prev, whatsappRemindersEnabled: checked}))}
                        />
                      </div>
                      <div className="space-y-4 rounded-lg border p-4" >
                        <Label>Reminder Schedule</Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox id="schedule-before" value="before"
                                  checked={(settings.whatsappReminderSchedule || []).includes('before')}
                                  onCheckedChange={(checked) => handleReminderScheduleChange(Boolean(checked), 'before')}
                                />
                                <Label htmlFor="schedule-before" className="font-normal">3 days before due date</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="schedule-on" value="on"
                                  checked={(settings.whatsappReminderSchedule || []).includes('on')}
                                  onCheckedChange={(checked) => handleReminderScheduleChange(Boolean(checked), 'on')}
                                />
                                <Label htmlFor="schedule-on" className="font-normal">On due date</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="schedule-after" value="after"
                                  checked={(settings.whatsappReminderSchedule || []).includes('after')}
                                  onCheckedChange={(checked) => handleReminderScheduleChange(Boolean(checked), 'after')}
                                />
                                <Label htmlFor="schedule-after" className="font-normal">5 days after due date</Label>
                            </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="whatsapp_reminder_template">Reminder Message Template</Label>
                          <Textarea
                            id="whatsapp_reminder_template"
                            name="whatsapp_reminder_template"
                            placeholder="e.g., Hi {tenantName}, a friendly reminder that your rent of ৳{rentAmount} for {property} is due on {dueDate}."
                            value={settings.whatsappReminderTemplate || ''}
                            onChange={(e) => setSettings(prev => ({...prev, whatsappReminderTemplate: e.target.value}))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use placeholders like {"{tenantName}"}, {"{rentAmount}"}, {"{property}"}, and {"{dueDate}"}.
                          </p>
                        </div>
                    </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <div className="flex items-center gap-3">
                              <Database className="h-8 w-8 text-primary" />
                              <div>
                                  <CardTitle>File Backup & Restore</CardTitle>
                                  <CardDescription>
                                      Save a backup of all data to your computer, or restore it from a file.
                                  </CardDescription>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-4">
                              <div className="p-3 bg-secondary rounded-md text-sm">
                                  <p className="font-medium text-secondary-foreground">Status: <span className="text-primary font-bold">Ready</span></p>
                                  <p className="text-muted-foreground">Save your data to a JSON or SQL file.</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <Button type="button" onClick={handleBackup} disabled={isProcessing} className="w-full">
                                      {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                                      {isProcessing ? "Processing..." : "JSON Backup"}
                                  </Button>
                                  <Button type="button" onClick={handleSqlBackup} disabled={isSqlPending} className="w-full">
                                      {isSqlPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                                      SQL Backup
                                  </Button>
                              </div>
                              <div className="grid grid-cols-1">
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button type="button" variant="outline" disabled={isProcessing} className="w-full">
                                          <HardDriveUpload className="mr-2 h-4 w-4" />
                                          Restore from JSON
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. Restoring from a file will overwrite all current tenant and financial data with the data from the backup.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={handleRestoreClick} className="bg-destructive hover:bg-destructive/90">Choose File & Restore</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                              </div>
                              <input
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept="application/json"
                                  onChange={handleFileChange}
                              />
                          </div>
                      </CardContent>
                      <CardFooter className="text-xs text-muted-foreground">
                          This feature lets you save a complete snapshot of your data. Keep your backup file in a safe place.
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                          <div className="flex items-center gap-3">
                              <Trash2 className="h-8 w-8 text-destructive" />
                              <div>
                                  <CardTitle>Clear Data</CardTitle>
                                  <CardDescription>
                                      Permanently delete rent and expense data for a specific period.
                                  </CardDescription>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Label htmlFor="clear-year">Year</Label>
                                  <Select value={clearYear} onValueChange={setClearYear}>
                                      <SelectTrigger id="clear-year"><SelectValue /></SelectTrigger>
                                      <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                  </Select>
                              </div>
                              <div>
                                  <Label htmlFor="clear-month">Month (Optional)</Label>
                                  <Select value={clearMonth} onValueChange={(val) => setClearMonth(val === 'all' ? undefined : val)}>
                                      <SelectTrigger id="clear-month"><SelectValue placeholder="All Months" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="all">All Months (Entire Year)</SelectItem>
                                          {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button type="button" variant="destructive" className="w-full" disabled={isClearPending}>
                                      {isClearPending ? <LoaderCircle className="mr-2 animate-spin"/> : <Trash2 className="mr-2"/>}
                                      Clear Data
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This will permanently delete all rent and expense records for <span className="font-bold text-destructive">{clearMonth ? `${months[parseInt(clearMonth)]} ${clearYear}` : `the entire year ${clearYear}`}</span>. 
                                          This action cannot be undone.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleClearData} disabled={isClearPending}>
                                        {isClearPending && <LoaderCircle className="mr-2 animate-spin"/>}
                                          Yes, Clear Data
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </CardContent>
                      <CardFooter className="text-xs text-muted-foreground">
                          Use with caution. Deleting data is permanent and cannot be recovered without a backup file.
                      </CardFooter>
                    </Card>
                    <div className="flex justify-start">
                      <Button type="submit" disabled={isPending}>
                         {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                         Save All Settings
                      </Button>
                    </div>
                </form>
              )}


              {activeTab === 'application' && (
                <Card>
                  <CardHeader>
                      <CardTitle>{settings.page_settings.app_settings.title}</CardTitle>
                      <CardDescription>{settings.page_settings.app_settings.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="appName">{settings.page_settings.app_settings.header_name_label}</Label>
                              <Input id="appName" name="appName" defaultValue={settings.appName} onChange={handleInputChange} />
                          </div>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button onClick={handleSaveAppSettings}>Save Local Settings</Button>
                  </CardFooter>
                </Card>
              )}
              
              {activeTab === 'labels' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Page Labels</CardTitle>
                        <CardDescription>Customize the text for various sections and tabs. Changes are saved to your browser.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                           <h3 className="font-medium">Dashboard Navigation</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nav_dashboard">Dashboard Nav Link</Label>
                                    <Input id="nav_dashboard" name="page_dashboard.nav_dashboard" defaultValue={settings.page_dashboard.nav_dashboard} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nav_settings">Settings Nav Link</Label>
                                    <Input id="nav_settings" name="page_dashboard.nav_settings" defaultValue={settings.page_dashboard.nav_settings} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium">Dashboard Tab Names</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tab_overview">Overview Tab</Label>
                                    <Input id="tab_overview" name="tabNames.overview" defaultValue={settings.tabNames.overview} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tab_tenants">Tenants Tab</Label>
                                    <Input id="tab_tenants" name="tabNames.tenants" defaultValue={settings.tabNames.tenants} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tab_work">Work Tab</Label>
                                    <Input id="tab_work" name="tabNames.work" defaultValue={settings.tabNames.work} onChange={handleInputChange} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="tab_reports">Reports Tab</Label>
                                    <Input id="tab_reports" name="tabNames.reports" defaultValue={settings.tabNames.reports} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tab_zakat">Zakat Tab</Label>
                                    <Input id="tab_zakat" name="tabNames.zakat" defaultValue={settings.tabNames.zakat} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium">Overview Page Sections</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="overview-financial-title">{settings.page_settings.overview_settings.financial_title_label}</Label>
                                    <Input id="overview-financial-title" name="page_overview.financial_overview_title" defaultValue={settings.page_overview.financial_overview_title} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="overview-financial-desc">{settings.page_settings.overview_settings.financial_description_label}</Label>
                                    <Input id="overview-financial-desc" name="page_overview.financial_overview_description" defaultValue={settings.page_overview.financial_overview_description} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveAppSettings}>Save Local Settings</Button>
                    </CardFooter>
                </Card>
              )}
            </div>

          </div>
        </main>
      </div>
  )
}
