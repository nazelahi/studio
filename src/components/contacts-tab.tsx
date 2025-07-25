

"use client"

import * as React from "react"
import { MoreHorizontal, PlusCircle, Image as ImageIcon, Mail, Phone, Home, ChevronDown, Copy, X, Search, FileText, Check, UserPlus, Calendar, Briefcase, Upload, File, Trash2, LoaderCircle, ScanLine, Wallet, MessageSquare, LayoutGrid, List, Edit, CheckIcon, User as UserIcon, Building, ShieldCheck, View } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Tenant } from "@/types"
import { useAppContext } from "@/context/app-context"
import { Skeleton } from "./ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { TenantDetailSheet } from "./tenant-detail-sheet"
import { useAuth } from "@/context/auth-context"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useProtection } from "@/context/protection-context"
import { extractTenantInfo } from "@/ai/flows/extract-tenant-info-flow"
import { cn } from "@/lib/utils"
import { Separator } from "./ui/separator"
import { updatePropertySettingsAction } from "@/app/settings/actions"
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "./ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/lib/utils"
import { Checkbox } from "./ui/checkbox"
import { deleteTenantAction, deleteMultipleTenantsAction } from "@/app/actions/tenants"

const predefinedApartments = [
  'Flat-1A', 'Flat-1B', 'Flat-2A', 'Flat-2B', 'Flat-3A', 'Flat-3B',
  'Flat-4A', 'Flat-4B', 'Flat-5A', 'Flat-5B', 'Shop-01', 'Shop-02'
].map(val => ({ value: val.toLowerCase(), label: val }));

const predefinedTenantTypes = [
  'Family', 'Bachelor', 'Commercial', 'Office', 'Student'
].map(val => ({ value: val.toLowerCase(), label: val }));


interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
}

const Combobox: React.FC<ComboboxProps> = ({ options, value, onValueChange, placeholder, searchPlaceholder }) => {
  const [open, setOpen] = React.useState(false);
  const displayValue = options.find(option => option.value === value.toLowerCase())?.label || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? displayValue : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            onInput={(e) => onValueChange(e.currentTarget.value)}
          />
          <CommandEmpty>
            <div className="p-2 text-sm text-muted-foreground">
              No results. You can type a custom value.
            </div>
          </CommandEmpty>
          <CommandGroup>
            <CommandList>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


export function ContactsTab() {
  const { tenants, addTenant, updateTenant, loading, settings, setSettings, refreshData } = useAppContext();
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null);
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = React.useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = React.useState<string[]>([]);
  const { withProtection } = useProtection();
  const [isScanning, setIsScanning] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [propertyValue, setPropertyValue] = React.useState('');
  const [typeValue, setTypeValue] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docFileInputRef = React.useRef<HTMLInputElement>(null);
  const scanFileInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isFinderOpen, setIsFinderOpen] = React.useState(false);
  
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedTenantForSheet, setSelectedTenantForSheet] = React.useState<Tenant | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [selectedTenantIds, setSelectedTenantIds] = React.useState<string[]>([]);


  React.useEffect(() => {
    if (editingTenant) {
      setPropertyValue(editingTenant.property);
      setTypeValue(editingTenant.type || '');
    }
  }, [editingTenant]);

  const filteredTenants = React.useMemo(() => {
    if (!searchTerm) return tenants;
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.email && tenant.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tenant.property.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);


  const allTenantsForFinder = React.useMemo(() => {
    return tenants.sort((a,b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setDocumentFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveNewDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemoveExistingDocument = (docUrl: string) => {
    setExistingDocuments(prev => prev.filter(url => url !== docUrl));
  };
  
  const handleSaveTenant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
        const formData = new FormData(event.currentTarget);
        formData.set('property', propertyValue);
        formData.set('type', typeValue);

        if (avatarFile) {
            formData.append('avatarFile', avatarFile);
        } else {
            formData.set('avatar', previewImage || 'https://placehold.co/80x80.png');
        }
        
        existingDocuments.forEach(doc => formData.append('documents[]', doc));
        documentFiles.forEach(file => formData.append('documentFiles', file));
        
        if (editingTenant) {
            formData.set('tenantId', editingTenant.id);
            await updateTenant(formData);
        } else {
            await addTenant(formData);
        }
        setOpen(false);
        resetDialogState();
    });
  };

  const resetDialogState = () => {
    setEditingTenant(null);
    setPreviewImage(null);
    setAvatarFile(null);
    setDocumentFiles([]);
    setExistingDocuments([]);
    setPropertyValue('');
    setTypeValue('');
    if (formRef.current) {
        formRef.current.reset();
    }
  };
  
  const handleSelectTenantToCopy = (tenant: Tenant) => {
    if (formRef.current) {
        const elements = formRef.current.elements;
        const getEl = (name: string) => elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;

        getEl('name').value = tenant.name;
        getEl('email').value = tenant.email;
        getEl('phone').value = tenant.phone || '';
        setPropertyValue(tenant.property);
        getEl('rent').value = tenant.rent.toString();
        getEl('join_date').value = tenant.join_date;
        getEl('notes').value = tenant.notes || '';
        setTypeValue(tenant.type || '');
        
        setPreviewImage(tenant.avatar);
        setExistingDocuments(tenant.documents || []);
        setDocumentFiles([]);
    }
    toast({ title: 'Tenant Info Copied', description: `Data from ${tenant.name} has been pre-filled.`});
    setIsFinderOpen(false);
  };

  const handleScanDocument = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const photoDataUri = reader.result as string;
        setIsScanning(true);
        toast({ title: 'Scanning Document...', description: 'The AI is extracting information. Please wait.'});
        try {
            const result = await extractTenantInfo({ photoDataUri });
            if (formRef.current) {
                const getEl = (name: string) => formRef.current!.elements.namedItem(name) as HTMLInputElement;
                if (result.name) getEl('name').value = result.name;
                if (result.email) getEl('email').value = result.email;
                if (result.phone) getEl('phone').value = result.phone;
                if (result.father_name) getEl('father_name').value = result.father_name;
                if (result.address) getEl('address').value = result.address;
                if (result.date_of_birth) getEl('date_of_birth').value = result.date_of_birth;
                if (result.nid_number) getEl('nid_number').value = result.nid_number;
                if (result.advance_deposit) getEl('advance_deposit').value = result.advance_deposit.toString();

                toast({ title: 'Scan Complete!', description: 'Tenant information has been filled into the form.'});
            }
        } catch (error) {
             toast({ title: 'Scan Failed', description: 'Could not extract information from the document.', variant: 'destructive'});
             console.error("AI scan failed:", error);
        } finally {
            setIsScanning(false);
            if(event.target) event.target.value = '';
        }
    };
    reader.readAsDataURL(file);
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenantForSheet(tenant);
    setIsSheetOpen(true);
  }

  const handleEdit = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    withProtection(() => {
      setEditingTenant(tenant);
      setPreviewImage(tenant.avatar);
      setAvatarFile(null);
      setExistingDocuments(tenant.documents || []);
      setDocumentFiles([]);
      setOpen(true);
    }, e);
  };

  const handleDelete = (tenantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    withProtection(() => {
      const formData = new FormData();
      formData.append('tenantId', tenantId);
      startTransition(async () => {
        await deleteTenantAction(formData);
        refreshData();
      });
    }, e);
  }

  const handleMassDelete = () => {
    withProtection(() => {
        startTransition(async () => {
            await deleteMultipleTenantsAction(selectedTenantIds);
            setSelectedTenantIds([]);
            refreshData();
        });
    });
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetDialogState();
    }
    setOpen(isOpen);
  };
  
  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-success text-success-foreground hover:bg-success/80';
      case 'Active':
        return 'bg-primary text-primary-foreground hover:bg-primary/80';
      case 'Overdue':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const TenantCardSkeleton = () => (
    <Card className="flex flex-col overflow-hidden">
        <Skeleton className="h-40 w-full bg-muted" />
        <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
        </CardContent>
    </Card>
  );

  const openWhatsApp = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneToUse = tenant.phone;
    if (phoneToUse) {
      const phoneNumber = phoneToUse.replace(/\D/g, ''); // Remove non-numeric characters
      const message = `Hello ${tenant.name}, regarding your tenancy at ${tenant.property}...`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No Phone Number",
        description: "This tenant does not have a phone number saved.",
        variant: "destructive"
      })
    }
  };

  const handleSetViewStyle = async (style: 'grid' | 'list') => {
    if (settings.tenantViewStyle === style) return;

    setSettings(prev => ({...prev, tenantViewStyle: style}));
    
    const formData = new FormData();
    formData.append('tenant_view_style', style);
    const result = await updatePropertySettingsAction(formData);

    if (result?.error) {
      toast({ title: 'Error Saving View Preference', description: result.error, variant: 'destructive'});
      setSettings(prev => ({...prev, tenantViewStyle: style === 'grid' ? 'list' : 'grid'}));
    }
  }
  
  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantIds(prev =>
        prev.includes(tenantId)
            ? prev.filter(id => id !== tenantId)
            : [...prev, tenantId]
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
        setSelectedTenantIds(filteredTenants.map(t => t.id));
    } else {
        setSelectedTenantIds([]);
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div className="flex-1 text-left">
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Manage your tenants and their information.</CardDescription>
            </div>
            {isAdmin && 
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTenant(null)} className="w-full sm:w-auto shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0">
                  <form ref={formRef} onSubmit={handleSaveTenant}>
                      <DialogHeader className="p-6 bg-muted">
                      <DialogTitle className="text-2xl text-primary">{editingTenant ? 'Edit Tenant Profile' : 'Add New Tenant'}</DialogTitle>
                        {!editingTenant && (
                          <div className="flex items-center gap-2 pt-4">
                              <Button type="button" variant="outline" size="sm" onClick={() => scanFileInputRef.current?.click()} disabled={isScanning}>
                                  {isScanning ? <LoaderCircle className="animate-spin mr-2"/> : <ScanLine className="mr-2 h-4 w-4"/>}
                                  Scan Document
                              </Button>
                              <input ref={scanFileInputRef} type="file" className="hidden" accept="image/*" onChange={handleScanDocument}/>
                              <Popover open={isFinderOpen} onOpenChange={setIsFinderOpen}>
                                <PopoverTrigger asChild>
                                  <Button type="button" size="sm" variant="outline" role="combobox" aria-expanded={isFinderOpen} className="justify-between sm:w-auto">
                                    <span className="flex items-center gap-2">
                                      <UserPlus className="h-4 w-4" />
                                      Copy info...
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50"/>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" style={{width: "var(--radix-popover-trigger-width)"}}>
                                  <Command>
                                    <CommandInput placeholder="Search tenant..." />
                                    <CommandEmpty>No tenant found.</CommandEmpty>
                                    <CommandList>
                                      <CommandGroup>
                                        {allTenantsForFinder.map((tenant) => (
                                            <CommandItem
                                            key={tenant.id}
                                            value={`${tenant.name} ${tenant.property} ${tenant.email}`}
                                            onSelect={() => handleSelectTenantToCopy(tenant)}
                                            className="flex items-center justify-between cursor-pointer w-full"
                                          >
                                            <div className="flex items-center gap-3 pointer-events-none">
                                              <Avatar className="h-8 w-8">
                                                <AvatarImage src={tenant.avatar} />
                                                <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1">
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-xs text-muted-foreground">{tenant.property} &middot; {formatCurrency(tenant.rent, settings.currencySymbol)}</div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4 pointer-events-none">
                                              <Copy className="h-3 w-3" />
                                              Copy
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                          </div>
                      )}
                    </DialogHeader>
                    <div className="p-6 max-h-[65vh] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                          {/* Avatar */}
                          <div className="flex flex-col items-center gap-3">
                            <Avatar className="h-32 w-32 border-4 border-muted">
                                <AvatarImage src={previewImage ?? undefined} alt="Tenant Avatar" data-ai-hint="person avatar"/>
                                <AvatarFallback><ImageIcon className="text-muted-foreground h-12 w-12"/></AvatarFallback>
                            </Avatar>
                            <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Change Photo
                            </Button>
                            <Input ref={fileInputRef} name="avatarFile" type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                          </div>
                          {/* Personal and Tenancy Details */}
                          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="name">Full Name</Label>
                                  <Input id="name" name="name" defaultValue={editingTenant?.name} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="father_name">Father's Name</Label>
                                  <Input id="father_name" name="father_name" defaultValue={editingTenant?.father_name} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                                  <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={editingTenant?.date_of_birth} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="nid_number">NID Number</Label>
                                  <Input id="nid_number" name="nid_number" defaultValue={editingTenant?.nid_number} />
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="address">Address</Label>
                                  <Textarea id="address" name="address" rows={2} defaultValue={editingTenant?.address} placeholder="Full address..."/>
                              </div>
                                <div className="space-y-2">
                                  <Label htmlFor="property">Apartment / Unit</Label>
                                  <Combobox options={predefinedApartments} value={propertyValue} onValueChange={setPropertyValue} placeholder="Select or type unit..." searchPlaceholder="Search unit..." />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="rent">Rent Amount</Label>
                                  <Input id="rent" name="rent" type="number" defaultValue={editingTenant?.rent} required className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"/>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="advance_deposit">Advance Deposit</Label>
                                  <Input id="advance_deposit" name="advance_deposit" type="number" defaultValue={editingTenant?.advance_deposit || ''} className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"/>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="join_date">Join Date</Label>
                                  <Input id="join_date" name="join_date" type="date" defaultValue={editingTenant?.join_date} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="type">Tenant Type</Label>
                                  <Combobox options={predefinedTenantTypes} value={typeValue} onValueChange={setTypeValue} placeholder="Select or type..." searchPlaceholder="Search type..." />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="status">Status</Label>
                                  <Select name="status" defaultValue={editingTenant?.status || 'Active'}>
                                      <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="Active">Active</SelectItem>
                                          <SelectItem value="Paid">Paid</SelectItem>
                                          <SelectItem value="Overdue">Overdue</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="email">Email Address</Label>
                                  <Input id="email" name="email" type="email" defaultValue={editingTenant?.email} required />
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="phone">Phone Number</Label>
                                  <Input id="phone" name="phone" type="tel" defaultValue={editingTenant?.phone} placeholder="e.g. 880..." />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="gas_meter_number">Gas Meter Number</Label>
                                  <Input id="gas_meter_number" name="gas_meter_number" defaultValue={editingTenant?.gas_meter_number} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="electric_meter_number">Electric Meter Number</Label>
                                  <Input id="electric_meter_number" name="electric_meter_number" defaultValue={editingTenant?.electric_meter_number} />
                              </div>
                          </div>
                      </div>

                      {/* Notes and Documents at the bottom */}
                      <div className="space-y-6 pt-6 border-t mt-6">
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" defaultValue={editingTenant?.notes} placeholder="Any relevant notes about the tenant..."/>
                          </div>
                          <div className="space-y-2">
                            <Label>Documents</Label>
                            <div className="space-y-3">
                              <div 
                                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => docFileInputRef.current?.click()}
                              >
                                  <Upload className="mx-auto h-8 w-8 text-muted-foreground/50"/>
                                  <p className="mt-1 text-sm font-medium">Click to upload or drag & drop documents</p>
                                  <p className="text-xs text-muted-foreground">You can select multiple files</p>
                                  <Input ref={docFileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleDocumentUpload} />
                              </div>
                              {(existingDocuments.length > 0 || documentFiles.length > 0) && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {existingDocuments.map((docUrl, index) => (
                                    <div key={`${docUrl}-${index}`} className="relative group aspect-square">
                                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                            <img src={docUrl} alt="Document" className="w-full h-full object-cover rounded-md" data-ai-hint="document id"/>
                                        </a>
                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100" onClick={() => handleRemoveExistingDocument(docUrl)}>
                                            <X className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                  ))}
                                  {documentFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="relative group aspect-square">
                                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded-md" data-ai-hint="document id"/>
                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100" onClick={() => handleRemoveNewDocument(index)}>
                                            <X className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                      </div>
                      </div>
                      <DialogFooter className="p-4 border-t">
                        <DialogClose asChild>
                          <Button variant="outline" disabled={isPending}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending || isScanning}>
                          {isPending && <LoaderCircle className="animate-spin mr-2"/>}
                          {isPending ? 'Saving...' : 'Save Tenant'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              }
          </div>
           <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tenants..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedTenantIds.length > 0 ? (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete ({selectedTenantIds.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will archive {selectedTenantIds.length} tenant(s), removing them from the active list but preserving their history. This action can be undone in the database.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleMassDelete} className="bg-destructive hover:bg-destructive/90">Yes, Archive</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : (
                <div className="flex items-center gap-1 rounded-md bg-muted p-1 self-end">
                <Button variant={settings.tenantViewStyle === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleSetViewStyle('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={settings.tenantViewStyle === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleSetViewStyle('list')}>
                    <List className="h-4 w-4" />
                </Button>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className={cn(settings.tenantViewStyle === 'list' ? "p-0" : "p-0 sm:p-6")}>
            {loading ? (
                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(4)].map((_, i) => <TenantCardSkeleton key={i} />)}
                </div>
            ) : filteredTenants.length === 0 ? (
                 <div className="col-span-full text-center text-muted-foreground py-10">
                    No tenants found.
                </div>
            ) : settings.tenantViewStyle === 'grid' ? (
                 <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTenants.map((tenant) => (
                     <Card key={tenant.id} className={cn("overflow-hidden shadow-md transition-all w-full relative", selectedTenantIds.includes(tenant.id) && "ring-2 ring-primary ring-offset-2")}>
                        <div className="absolute top-2 left-2 z-10">
                            <Checkbox 
                                id={`select-tenant-grid-${tenant.id}`} 
                                onCheckedChange={() => handleSelectTenant(tenant.id)}
                                checked={selectedTenantIds.includes(tenant.id)}
                                className="bg-background/80"
                            />
                        </div>
                        <div className="flex items-start gap-4 p-4">
                            <Avatar className="h-16 w-16 border">
                                <AvatarImage src={tenant.avatar} alt={tenant.name} data-ai-hint="person avatar" />
                                <AvatarFallback>{tenant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <button onClick={() => handleViewDetails(tenant)} className="text-left w-full">
                                    <h3 className="font-bold text-lg text-primary hover:underline">{tenant.name}</h3>
                                </button>
                                <p className="text-sm text-muted-foreground">{tenant.type || 'Tenant'}</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 -ml-2 mt-1">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleViewDetails(tenant)}>
                                            <View className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => openWhatsApp(tenant, e)}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            WhatsApp
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => handleEdit(tenant, e)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will archive {tenant.name}, removing them from the active list. Their historical data will be preserved.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={(e) => handleDelete(tenant.id, e)} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, Archive Tenant
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="border-t px-4 py-3 space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{tenant.property}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatCurrency(tenant.rent, settings.currencySymbol)} <span className="text-muted-foreground">/ month</span></span>
                            </div>
                             <div className="flex items-center gap-3">
                                <Badge variant="secondary" className={cn("mt-2", getStatusBadge(tenant.status))}>{tenant.status}</Badge>
                            </div>
                        </div>
                    </Card>

                  ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                                <TableHead className="p-2 text-inherit w-12">
                                    <Checkbox
                                        checked={selectedTenantIds.length > 0 && selectedTenantIds.length === filteredTenants.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all tenants"
                                     />
                                </TableHead>
                                <TableHead className="w-[300px] p-2 text-inherit">Tenant</TableHead>
                                <TableHead className="p-2 text-inherit">Details</TableHead>
                                <TableHead className="p-2 text-inherit">Status</TableHead>
                                <TableHead className="text-right p-2 text-inherit"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.slice(0, showAll ? filteredTenants.length : 10).map(tenant => (
                                <TableRow key={tenant.id} className="odd:bg-muted/50" data-state={selectedTenantIds.includes(tenant.id) ? "selected" : "unselected"}>
                                    <TableCell className="p-2">
                                        <Checkbox
                                            checked={selectedTenantIds.includes(tenant.id)}
                                            onCheckedChange={() => handleSelectTenant(tenant.id)}
                                            aria-label={`Select tenant ${tenant.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={tenant.avatar} />
                                                <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <button onClick={() => handleViewDetails(tenant)} className="font-medium text-left hover:underline">{tenant.name}</button>
                                                <div className="text-xs text-muted-foreground">{tenant.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <div className="font-medium">{tenant.property}</div>
                                        <div className="text-xs text-muted-foreground">{formatCurrency(tenant.rent, settings.currencySymbol)}</div>
                                    </TableCell>
                                     <TableCell className="p-2">
                                        <Badge variant="secondary" className={getStatusBadge(tenant.status)}>{tenant.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right p-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewDetails(tenant)}>
                                                    <View className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => openWhatsApp(tenant, e)}>
                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                    WhatsApp
                                                </DropdownMenuItem>
                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => handleEdit(tenant, e)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will archive {tenant.name}, removing them from the active list. Their historical data will be preserved.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={(e) => handleDelete(tenant.id, e)} className="bg-destructive hover:bg-destructive/90">
                                                                        Yes, Archive Tenant
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {filteredTenants.length > 10 && (
                        <div className="p-4 border-t text-center">
                            <Button variant="link" onClick={() => setShowAll(!showAll)}>
                                {showAll ? 'Show Less' : `View All ${filteredTenants.length} Tenants`}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
      {selectedTenantForSheet && (
        <TenantDetailSheet 
            tenant={selectedTenantForSheet}
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
        />
      )}
    </>
  );
}
