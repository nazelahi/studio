

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
import { User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, Building, KeyRound, Palette, Tag, Landmark, Upload, Banknote, UserCircle, MessageSquare, Info, Phone, Mail, Database, Share2, Edit, Check, X, Image as ImageIcon, GripVertical, PlusCircle, Trash2, Folder, File, BookImage } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const currencyOptions = [
    { value: "৳", label: "BDT (Bangladesh)" },
    { value: "$", label: "USD (United States)" },
    { value: "€", label: "EUR (Eurozone)" },
    { value: "£", label: "GBP (United Kingdom)" },
    { value: "₹", label: "INR (India)" },
    { value: "¥", label: "JPY (Japan)" },
    { value: "¥", label: "CNY (China)" },
    { value: "C$", label: "CAD (Canada)" },
    { value: "A$", label: "AUD (Australia)" },
    { value: "CHF", label: "CHF (Switzerland)" },
    { value: "RM", label: "MYR (Malaysia)" },
    { value: "S$", label: "SGD (Singapore)" },
    { value: "AED", label: "AED (UAE)" },
    { value: "SAR", label: "SAR (Saudi Arabia)" },
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
  
  const bankLogoInputRef = React.useRef<HTMLInputElement>(null);
  const ownerPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const faviconInputRef = React.useRef<HTMLInputElement>(null);
  const appLogoInputRef = React.useRef<HTMLInputElement>(null);
  
  const [docCategories, setDocCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setDocCategories(settings.documentCategories || []);
  }, [settings.documentCategories]);

  const handleDocCategoryChange = (index: number, value: string) => {
    const newCategories = [...docCategories];
    newCategories[index] = value;
    setDocCategories(newCategories);
  };
  
  const handleAddCategory = () => {
    if (newCategory && !docCategories.includes(newCategory)) {
        setDocCategories([...docCategories, newCategory]);
        setNewCategory('');
    }
  };

  const handleRemoveCategory = (index: number) => {
    const newCategories = docCategories.filter((_, i) => i !== index);
    setDocCategories(newCategories);
  };

  const handleSaveCategories = () => {
    startTransition(async () => {
        const formData = new FormData();
        docCategories.forEach(cat => formData.append('document_categories[]', cat));
        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Categories', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Categories Saved', description: 'Your document categories have been saved to the database.' });
            refreshSettings();
        }
    });
  };

  React.useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'bankLogoFile' | 'ownerPhotoFile' | 'faviconFile' | 'appLogoFile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append(fileType, file);
      
      const result = await updatePropertySettingsAction(formData);
      if (result?.error) {
        toast({ title: `Error Saving Image`, description: result.error, variant: 'destructive'});
      } else {
        toast({ title: 'Image Saved', description: `Your new image has been updated.` });
        refreshSettings();
      }
    });
     // Reset file input to allow re-uploading the same file
    if (e.target) {
        e.target.value = '';
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

  const handleSavePropertySettings = useCallback((field: string, value: string | string[]) => {
    startTransition(async () => {
        const formData = new FormData();
        
        const keyMap: {[key: string]: string} = {
            houseName: 'house_name',
            houseAddress: 'house_address',
            bankName: 'bank_name',
            bankAccountNumber: 'bank_account_number',
            ownerName: 'owner_name',
            aboutUs: 'about_us',
            contactPhone: 'contact_phone',
            contactEmail: 'contact_email',
            contactAddress: 'contact_address',
            footerName: 'footer_name',
            metadataTitle: 'metadata_title',
            dateFormat: 'date_format',
            currencySymbol: 'currency_symbol',
        };

        const mappedKey = keyMap[field] || field;
        
        if (Array.isArray(value)) {
            value.forEach(v => formData.append(mappedKey, v));
        } else {
            formData.set(mappedKey, value);
        }

        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Setting Saved', description: 'Your change has been saved to the database.' });
            refreshSettings();
        }
    });
  }, [refreshSettings, toast]);

  const handleSaveIntegrationSettings = () => {
    startTransition(async () => {
        const formData = new FormData();
        formData.append('whatsapp_reminders_enabled', settings.whatsappRemindersEnabled ? 'on' : 'off');
        (settings.whatsappReminderSchedule || []).forEach(item => formData.append('whatsapp_reminder_schedule', item));
        formData.append('whatsapp_reminder_template', settings.whatsappReminderTemplate || '');

        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Integration Settings Saved', description: 'Your changes have been saved to the database.' });
            refreshSettings();
        }
    });
  }


  const handleSaveAppSettings = () => {
    // This function now only saves to local storage, as DB saving is handled by onSave handlers
    setSettings(prev => ({...prev, documentCategories: docCategories}));
    toast({
        title: 'Local Settings Saved',
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
              
              {activeTab === 'property' && (
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
                                      <div className="flex items-center gap-4 group">
                                          <Avatar className="h-24 w-24 rounded-md">
                                              <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person portrait"/>
                                              <AvatarFallback className="rounded-md"><UserCircle className="h-10 w-10"/></AvatarFallback>
                                          </Avatar>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => ownerPhotoInputRef.current?.click()} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                              <Edit className="h-4 w-4 text-muted-foreground"/>
                                          </Button>
                                          <Input ref={ownerPhotoInputRef} type="file" name="ownerPhotoFile" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ownerPhotoFile')} />
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
                                      <EditableField label="Bank Name" value={settings.bankName || ''} onSave={(v) => handleSavePropertySettings('bankName', v)} />
                                      <EditableField label="Bank Account Number" value={settings.bankAccountNumber || ''} onSave={(v) => handleSavePropertySettings('bankAccountNumber', v)} />
                                      <EditableField label="Contact Email" value={settings.contactEmail || ''} onSave={(v) => handleSavePropertySettings('contactEmail', v)} />
                                      <EditableField label="Contact Phone" value={settings.contactPhone || ''} onSave={(v) => handleSavePropertySettings('contactPhone', v)} />
                                  </div>
                                   <div className="space-y-2">
                                      <Label>Bank Logo</Label>
                                      <div className="flex items-center gap-4 group">
                                          <Avatar className="h-24 w-24 rounded-md">
                                              <AvatarImage src={settings.bankLogoUrl} data-ai-hint="logo bank"/>
                                              <AvatarFallback className="rounded-md"><Banknote className="h-10 w-10"/></AvatarFallback>
                                          </Avatar>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => bankLogoInputRef.current?.click()} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                            <Edit className="h-4 w-4 text-muted-foreground"/>
                                          </Button>
                                          <Input ref={bankLogoInputRef} type="file" name="bankLogoFile" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'bankLogoFile')} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* App Branding */}
                          <div>
                              <h3 className="text-lg font-medium">Branding & Metadata</h3>
                              <Separator className="my-2" />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div className="md:col-span-1 space-y-2">
                                    <Label>Application Logo</Label>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-24 w-24 rounded-md border flex items-center justify-center bg-muted p-2">
                                            {settings.appLogoUrl ? (
                                                <img src={settings.appLogoUrl} alt="App Logo" className="h-full w-auto object-contain"/>
                                            ) : (
                                                <Logo className="h-10 w-10 text-muted-foreground" />
                                            )}
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => appLogoInputRef.current?.click()} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                            <Edit className="h-4 w-4 text-muted-foreground"/>
                                        </Button>
                                        <Input ref={appLogoInputRef} type="file" name="appLogoFile" className="hidden" accept="image/png, image/svg+xml" onChange={(e) => handleFileChange(e, 'appLogoFile')} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Upload a .png or .svg file.</p>
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                  <EditableField label="Browser Tab Title" value={settings.metadataTitle || ''} onSave={(v) => handleSavePropertySettings('metadataTitle', v)} />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label>Favicon</Label>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-24 w-24 rounded-md border flex items-center justify-center bg-muted">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={settings.faviconUrl} data-ai-hint="logo icon"/>
                                                <AvatarFallback><ImageIcon className="h-10 w-10 text-muted-foreground"/></AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => faviconInputRef.current?.click()} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                                            <Edit className="h-4 w-4 text-muted-foreground"/>
                                        </Button>
                                        <Input ref={faviconInputRef} type="file" name="faviconFile" className="hidden" accept="image/png, image/x-icon, image/svg+xml" onChange={(e) => handleFileChange(e, 'faviconFile')} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Upload a .png, .ico, or .svg file.</p>
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
                                   <EditableField label="Footer Copyright Text" value={settings.footerName || ''} onSave={(v) => handleSavePropertySettings('footerName', v)} />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
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
                                <Input id="passcode" name="passcode" type="password" placeholder="Leave blank to keep current" defaultValue={settings.passcode || ''}/>
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
                <div className="space-y-6">
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
                     <CardFooter>
                         <Button onClick={handleSaveIntegrationSettings} disabled={isPending}>
                           {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                           Save Integration Settings
                         </Button>
                     </CardFooter>
                  </Card>
                </div>
              )}


              {activeTab === 'application' && (
                <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Localization & Theme</CardTitle>
                        <CardDescription>Customize date formats, currency, and the look and feel of the application.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <Label htmlFor="date-format">Date Format</Label>
                                  <Select
                                      value={settings.dateFormat}
                                      onValueChange={(value) => handleSavePropertySettings('dateFormat', value)}
                                  >
                                      <SelectTrigger id="date-format">
                                          <SelectValue placeholder="Select a format" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="dd MMM, yyyy">17 Jul, 2024</SelectItem>
                                          <SelectItem value="MM/dd/yyyy">07/17/2024</SelectItem>
                                          <SelectItem value="yyyy-MM-dd">2024-07-17</SelectItem>
                                          <SelectItem value="MMMM dd, yyyy">July 17, 2024</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="currency-symbol">Currency Symbol</Label>
                                <Select
                                  value={settings.currencySymbol}
                                  onValueChange={(value) => handleSavePropertySettings('currencySymbol', value)}
                                >
                                  <SelectTrigger id="currency-symbol">
                                    <SelectValue placeholder="Select a currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currencyOptions.map((option) => (
                                      <SelectItem key={option.label} value={option.value}>
                                        {option.label} ({option.value})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                          </div>
                          <Separator className="my-6" />
                          <div className="space-y-4">
                              <Label className="font-medium">Theme Colors (Saved Locally)</Label>
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
                              <Label className="font-medium">Mobile Navigation Colors (Saved Locally)</Label>
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
                         <Button onClick={handleSaveAppSettings}>Save Local Settings</Button>
                       </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Document Categories</CardTitle>
                            <CardDescription>Manage the list of categories used for organizing documents. This is saved to the database.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {(docCategories || []).map((category, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={category}
                                            onChange={(e) => handleDocCategoryChange(index, e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveCategory(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="New category name..."
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                                <Button type="button" onClick={handleAddCategory}><PlusCircle className="mr-2" />Add</Button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveCategories} disabled={isPending}>
                                {isPending && <LoaderCircle className="animate-spin mr-2" />}
                                Save Categories to Database
                            </Button>
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
                                 <div className="space-y-2">
                                    <Label htmlFor="tab_documents">Documents Tab</Label>
                                    <Input id="tab_documents" name="tabNames.documents" defaultValue={settings.tabNames.documents} onChange={handleInputChange} />
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
  );
}
