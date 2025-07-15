

"use client"

import Link from "next/link"
import React, { useState, useTransition, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, Building, KeyRound, Palette, Tag, Landmark, Upload, Banknote, UserCircle, MessageSquare, Info, Phone, Mail, Database, Share2, Edit, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { updatePropertySettingsAction, updateUserCredentialsAction, updatePasscodeAction } from "./actions"
import { useProtection } from "@/context/protection-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

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

// In-place editable field component
interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  isTextarea?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ label, value, onSave, isTextarea = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = () => {
        onSave(currentValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };

    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    {isTextarea ? (
                        <Textarea
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className="flex-1"
                            rows={3}
                        />
                    ) : (
                         <Input
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className="flex-1"
                        />
                    )}
                    <Button size="icon" variant="ghost" onClick={handleSave} className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8"><Check className="h-4 w-4"/></Button>
                    <Button size="icon" variant="ghost" onClick={handleCancel} className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8"><X className="h-4 w-4"/></Button>
                </div>
            ) : (
                <div className="flex items-center justify-between group">
                    <p className={cn("text-sm h-10 flex items-center", isTextarea && "h-auto min-h-[80px] whitespace-pre-wrap py-2")}>{value || <span className="text-muted-foreground">Not set</span>}</p>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                        <Edit className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                </div>
            )}
        </div>
    );
};


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
  
   const handleWhatsappEnabledChange = (checked: boolean) => {
    setSettings(prev => ({...prev, whatsappRemindersEnabled: checked}));
   };

  const handleSavePropertySettings = useCallback((field: string, value: string) => {
    startTransition(async () => {
        const formData = new FormData();
        formData.append(field, value);

        // Ensure other settings are preserved when updating one field
        Object.entries(settings).forEach(([key, val]) => {
            if (key !== field) {
                 if (Array.isArray(val)) {
                    val.forEach(item => formData.append(key, item));
                } else if (typeof val !== 'object') {
                    formData.append(key, String(val));
                }
            }
        });
        
        // Use keys that match the server action
        const renamedFormData = new FormData();
        renamedFormData.append('houseName', settings.houseName);
        renamedFormData.append('houseAddress', settings.houseAddress);
        renamedFormData.append('bankName', settings.bankName);
        renamedFormData.append('bankAccountNumber', settings.bankAccountNumber);
        renamedFormData.append('ownerName', settings.ownerName || '');
        renamedFormData.append('aboutUs', settings.aboutUs || '');
        renamedFormData.append('contact_phone', settings.contactPhone || '');
        renamedFormData.append('contact_email', settings.contactEmail || '');
        renamedFormData.append('contact_address', settings.contactAddress || '');
        renamedFormData.append('footerName', settings.footerName || '');

        // Now, update the changed field
        const keyMap: {[key: string]: string} = {
            houseName: 'houseName',
            houseAddress: 'houseAddress',
            bankName: 'bankName',
            bankAccountNumber: 'bankAccountNumber',
            ownerName: 'ownerName',
            aboutUs: 'about_us',
            contactPhone: 'contact_phone',
            contactEmail: 'contact_email',
            contactAddress: 'contact_address',
            footerName: 'footerName',
        };

        if (keyMap[field]) {
             renamedFormData.set(keyMap[field], value);
        }

        const result = await updatePropertySettingsAction(renamedFormData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Setting Saved', description: 'Your change has been saved to the database.' });
            refreshSettings();
        }
    });
  }, [settings, refreshSettings, toast]);

  const handleImageSave = (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     const formData = new FormData();

     if (logoFile) formData.append('logoFile', logoFile);
     if (ownerPhotoFile) formData.append('ownerPhotoFile', ownerPhotoFile);

     // If no new files, don't submit
     if (!logoFile && !ownerPhotoFile) {
        toast({title: "No new images to save", description: "Select a new owner photo or bank logo to upload."});
        return;
     }

     // Add all other settings to formData to prevent them from being erased
     formData.append('houseName', settings.houseName);
     formData.append('houseAddress', settings.houseAddress);
     formData.append('bankName', settings.bankName);
     formData.append('bankAccountNumber', settings.bankAccountNumber);
     formData.append('bank_logo_url', settings.bankLogoUrl || '');
     if (settings.bankLogoUrl) formData.append('oldLogoUrl', settings.bankLogoUrl);
     formData.append('ownerName', settings.ownerName || '');
     formData.append('owner_photo_url', settings.ownerPhotoUrl || '');
     if (settings.ownerPhotoUrl) formData.append('oldOwnerPhotoUrl', settings.ownerPhotoUrl);
     formData.append('about_us', settings.aboutUs || '');
     formData.append('contact_phone', settings.contactPhone || '');
     formData.append('contact_email', settings.contactEmail || '');
     formData.append('contact_address', settings.contactAddress || '');
     formData.append('footerName', settings.footerName);
     formData.append('whatsapp_reminders_enabled', settings.whatsappRemindersEnabled ? 'on' : 'off');
     (settings.whatsappReminderSchedule || []).forEach(item => formData.append('whatsapp_reminder_schedule', item));
     formData.append('whatsapp_reminder_template', settings.whatsappReminderTemplate || '');
     
     startTransition(async () => {
        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Images', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Images Saved', description: 'Your new images have been updated.' });
            setLogoFile(null);
            setOwnerPhotoFile(null);
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
        toast({ title: 'Passcode Settings Saved', description: 'Your passcode settings have been updated.' });
        refreshSettings();
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
            <Logo className="h-6 w-6 text-primary" />
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
                <Logo className="h-6 w-6 text-primary" />
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
              
              {activeTab === 'property' && (
                <form onSubmit={handleImageSave}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Details</CardTitle>
                            <CardDescription>Manage your property, owner, and contact information. Click the edit icon to change a value.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Owner & Property Information */}
                            <div>
                                <h3 className="text-lg font-medium">Owner & Property</h3>
                                <Separator className="my-2" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <div className="md:col-span-2 space-y-4">
                                        <EditableField label="Owner Name" value={settings.ownerName || ''} onSave={(v) => handleSavePropertySettings('ownerName', v)} />
                                        <EditableField label={settings.page_settings.property_details.house_name_label} value={settings.houseName} onSave={(v) => handleSavePropertySettings('houseName', v)} />
                                        <EditableField label={settings.page_settings.property_details.house_address_label} value={settings.houseAddress} onSave={(v) => handleSavePropertySettings('houseAddress', v)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Owner Photo</Label>
                                        <input type="hidden" name="owner_photo_url" value={settings.ownerPhotoUrl || ''} />
                                        {settings.ownerPhotoUrl && <input type="hidden" name="oldOwnerPhotoUrl" value={settings.ownerPhotoUrl} />}
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-24 w-24 rounded-md">
                                                <AvatarImage src={ownerPhotoPreview} data-ai-hint="person portrait"/>
                                                <AvatarFallback className="rounded-md"><UserCircle className="h-10 w-10"/></AvatarFallback>
                                            </Avatar>
                                            <Button type="button" variant="outline" size="sm" onClick={() => ownerPhotoInputRef.current?.click()}>
                                                <Upload className="mr-2 h-4 w-4"/>
                                                Change
                                            </Button>
                                            <Input ref={ownerPhotoInputRef} type="file" name="ownerPhotoFile" className="hidden" accept="image/*" onChange={handleOwnerPhotoFileChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank & Contact Information */}
                            <div>
                                <h3 className="text-lg font-medium">Bank & Contact Information</h3>
                                <Separator className="my-2" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <div className="md:col-span-2 space-y-4">
                                        <EditableField label="Bank Name" value={settings.bankName} onSave={(v) => handleSavePropertySettings('bankName', v)} />
                                        <EditableField label="Bank Account Number" value={settings.bankAccountNumber} onSave={(v) => handleSavePropertySettings('bankAccountNumber', v)} />
                                        <EditableField label="Contact Email" value={settings.contactEmail || ''} onSave={(v) => handleSavePropertySettings('contactEmail', v)} />
                                        <EditableField label="Contact Phone" value={settings.contactPhone || ''} onSave={(v) => handleSavePropertySettings('contactPhone', v)} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Bank Logo</Label>
                                        <input type="hidden" name="bank_logo_url" value={settings.bankLogoUrl || ''} />
                                        {settings.bankLogoUrl && <input type="hidden" name="oldLogoUrl" value={settings.bankLogoUrl} />}
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-24 w-24 rounded-md">
                                                <AvatarImage src={logoPreview} data-ai-hint="logo bank"/>
                                                <AvatarFallback className="rounded-md"><Banknote className="h-10 w-10"/></AvatarFallback>
                                            </Avatar>
                                            <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                                                <Upload className="mr-2 h-4 w-4"/>
                                                Change
                                            </Button>
                                            <Input ref={logoInputRef} type="file" name="logoFile" className="hidden" accept="image/*" onChange={handleLogoFileChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* About and Footer */}
                             <div>
                                <h3 className="text-lg font-medium">About & Footer</h3>
                                <Separator className="my-2" />
                                <div className="mt-4 space-y-4">
                                     <EditableField label="About Us Section" value={settings.aboutUs || ''} onSave={(v) => handleSavePropertySettings('aboutUs', v)} isTextarea/>
                                     <EditableField label="Contact Address" value={settings.contactAddress || ''} onSave={(v) => handleSavePropertySettings('contactAddress', v)} />
                                     <EditableField label="Footer Copyright Text" value={settings.footerName} onSave={(v) => handleSavePropertySettings('footerName', v)} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button type="submit" disabled={isPending}>
                                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Save Image Changes
                            </Button>
                        </CardFooter>
                    </Card>
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
                            <CardTitle>Passcode Security</CardTitle>
                            <CardDescription>
                                Set a secret passcode required for sensitive actions like editing and deleting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                                <Label htmlFor="passcode_protection_enabled" className="flex flex-col space-y-1">
                                <span>Enable Passcode Protection</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    If enabled, a passcode will be required for all destructive actions.
                                </span>
                                </Label>
                                <Switch
                                id="passcode_protection_enabled"
                                name="passcode_protection_enabled"
                                checked={settings.passcodeProtectionEnabled}
                                onCheckedChange={(checked) => setSettings(prev => ({...prev, passcodeProtectionEnabled: checked}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="passcode">Secret Passcode</Label>
                                <Input id="passcode" name="passcode" type="password" placeholder="Leave blank to keep current" defaultValue={settings.passcode}/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPasscodePending}>
                                {isPasscodePending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Save Passcode Settings
                            </Button>
                        </CardFooter>
                    </Card>
                  </form>
                </div>
              )}

              {activeTab === 'integrations' && (
                <form onSubmit={handleImageSave} className="space-y-6">
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
                          onCheckedChange={handleWhatsappEnabledChange}
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
                  
                  <div className="flex justify-start">
                      <Button type="submit" disabled={isPending}>
                         {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                         Save Integration Settings
                      </Button>
                    </div>
                </form>
              )}


              {activeTab === 'application' && (
                <div className="space-y-6">
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
                       <CardFooter>
                         <Button onClick={handleSaveAppSettings}>Save Application Settings</Button>
                       </CardFooter>
                    </Card>
                </div>
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
