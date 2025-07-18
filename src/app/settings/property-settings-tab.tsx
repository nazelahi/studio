
"use client"

import React, { useState, useTransition, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useAppContext } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Landmark, Upload, Banknote, UserCircle, Edit, Check, X, Image as ImageIcon, MessageSquare, Info, Phone, Mail, } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updatePropertySettingsAction } from "./actions"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  isTextarea?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ label, value, onSave, isTextarea = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    React.useEffect(() => {
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

export default function PropertySettingsTab() {
  const { settings, refreshData } = useAppContext();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const bankLogoInputRef = useRef<HTMLInputElement>(null);
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const appLogoInputRef = useRef<HTMLInputElement>(null);

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
        refreshData();
      }
    });
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleSavePropertySettings = useCallback((field: string, value: string) => {
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
        };
        const mappedKey = keyMap[field] || field;
        formData.set(mappedKey, value);

        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Setting Saved', description: 'Your change has been saved to the database.' });
            refreshData();
        }
    });
  }, [refreshData, toast]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Manage your property, owner, and contact information. Click the edit icon to change a value.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
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
  )
}
