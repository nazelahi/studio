

"use client"

import * as React from "react"
import { MoreHorizontal, PlusCircle, Image as ImageIcon, Mail, Phone, Home, ChevronDown, Copy, X, Search, FileText, Check, UserPlus, Calendar, Briefcase, Upload, File, Trash2, LoaderCircle, ScanLine, Eye, Edit } from "lucide-react"
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
import { useData } from "@/context/data-context"
import { Skeleton } from "./ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { TenantDetailSheet } from "./tenant-detail-sheet"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { format, parseISO } from "date-fns"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useProtection } from "@/context/protection-context"
import { extractTenantInfo } from "@/ai/flows/extract-tenant-info-flow"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { cn } from "@/lib/utils"

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.75 13.96c.25.13.43.2.5.33.08.13.12.28.12.48 0 .2-.04.38-.12.53s-.18.28-.3.4-.27.2-.42.28-.32.12-.5.12c-.2 0-.38-.03-.56-.08s-.36-.13-.55-.23c-.34-.16-.66-.36-1-.6-.33-.24-.6-.48-.84-.72s-.45-.5-.65-.77c-.2-.27-.37-.56-.48-.85s-.18-.58-.18-.88c0-.3.06-.56.18-.78.12-.22.28-.4.48-.55.2-.14.4-.22.6-.22.1 0 .2.02.3.05s.2.06.3.1c.1.04.2.1.3.18l.1.13c.04.07.1.18.17.32l.1.2c.07.15.12.3.15.43s.05.27.05.4c0 .1-.02.2-.05.3s-.07.2-.13.28l-.13.15c-.04.05-.1.1-.15.15l-.1.1c-.04.03-.07.06-.08.1s-.02.08-.02.13c0 .05.01.1.04.15s.05.1.08.14c.08.08.18.17.3.28.12.1.24.2.37.28.2.13.4.24.6.33.2.1.4.15.6.15.2 0 .4-.04.58-.12s.3-.18.4-.3c.04-.05.1-.1.14-.18s.1-.16.14-.25.1-.18.13-.26.06-.17.06-.25c0-.1-.02-.2-.04-.28s-.06-.16-.1-.23l-.1-.14c-.03-.04-.06-.1-.1-.13l-.04-.04c-.04-.02-.1-.04-.13-.07s-.06-.05-.1-.08l-.2-.14c-.04-.03-.1-.06-.1-.1s-.07-.1-.07-.16.02-.1.08-.15.1-.1.14-.14.1-.08.14-.1.1-.04.1-.04h.1c.07-.02.13-.04.2-.06s.1-.04.14-.05.1-.02.1-.02.13 0 .2.02c.1.02.2.05.3.1.1.04.2.1.3.16.1.07.2.14.3.2l.2.2c.08.1.15.2.2.3zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path>
  </svg>
);

export function ContactsTab() {
  const { tenants, addTenant, updateTenant, deleteTenant, loading } = useData();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const [open, setOpen] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null);
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = React.useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = React.useState<string[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const { withProtection } = useProtection();
  const [isScanning, setIsScanning] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docFileInputRef = React.useRef<HTMLInputElement>(null);
  const scanFileInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isFinderOpen, setIsFinderOpen] = React.useState(false);
  
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedTenantForSheet, setSelectedTenantForSheet] = React.useState<Tenant | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredTenants = React.useMemo(() => {
    if (!searchTerm) return tenants;
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);


  const allTenantsForFinder = React.useMemo(() => {
    return tenants.sort((a,b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    setIsUploading(true);
    const formData = new FormData(event.currentTarget);
    
    const tenantData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      whatsapp_number: formData.get('whatsapp_number') as string,
      property: formData.get('property') as string,
      rent: Number(formData.get('rent')),
      join_date: formData.get('join_date') as string,
      notes: formData.get('notes') as string,
      type: formData.get('type') as string,
      avatar: previewImage || editingTenant?.avatar || 'https://placehold.co/80x80.png',
      documents: existingDocuments, // Start with the ones we didn't remove
      status: formData.get('status') as Tenant['status'] || editingTenant?.status || 'Active',
      father_name: formData.get('father_name') as string,
      address: formData.get('address') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      nid_number: formData.get('nid_number') as string,
      advance_deposit: Number(formData.get('advance_deposit')),
    };

    try {
      if (editingTenant) {
        await updateTenant({ ...editingTenant, ...tenantData }, toast, documentFiles);
        toast({
          title: 'Tenant Updated',
          description: `${tenantData.name}'s information has been successfully updated.`,
        });
      } else {
        await addTenant(tenantData, toast, documentFiles);
        toast({
          title: 'Tenant Added',
          description: `${tenantData.name} has been successfully added.`,
        });
      }
      
      setOpen(false);
      resetDialogState();
    } catch (error) {
       toast({
        title: 'Save Failed',
        description: "An error occurred while saving the tenant.",
        variant: "destructive"
      });
    } finally {
        setIsUploading(false);
    }
  };

  const resetDialogState = () => {
    setEditingTenant(null);
    setPreviewImage(null);
    setDocumentFiles([]);
    setExistingDocuments([]);
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
        (getEl('whatsapp_number') as HTMLInputElement).value = tenant.whatsapp_number || '';
        getEl('property').value = tenant.property;
        getEl('rent').value = tenant.rent.toString();
        getEl('join_date').value = tenant.join_date;
        getEl('notes').value = tenant.notes || '';
        getEl('type').value = tenant.type || '';
        
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
            // Reset file input value to allow re-uploading the same file
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
    withProtection(() => {
      setEditingTenant(tenant);
      setPreviewImage(tenant.avatar);
      setExistingDocuments(tenant.documents || []);
      setDocumentFiles([]);
      setOpen(true);
    }, e);
  };

  const handleDelete = (tenantId: string, e: React.MouseEvent) => {
    withProtection(async () => {
      await deleteTenant(tenantId, toast);
    }, e);
  }
  
  const handleWhatsappMessage = (tenant: Tenant, e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     const number = tenant.whatsapp_number || tenant.phone;
     if (!number) {
        toast({ title: "No Number", description: "This tenant does not have a WhatsApp number set.", variant: "destructive" });
        return;
     }
     const cleanNumber = number.replace(/[^0-9]/g, "");
     const message = encodeURIComponent(`Hello ${tenant.name}, this is a message regarding your tenancy at ${settings.houseName}.`);
     window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  }


  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetDialogState();
    }
    setOpen(isOpen);
  };
  
  const getStatusBadgeClass = (status: Tenant['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Card className="mt-4 border-0 shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              A list of all tenants in your property.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tenants..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && 
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTenant(null)} className="shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
                      <DialogDescription>
                        {editingTenant ? "Update the tenant's information below." : "Fill in the form to add a new tenant."}
                      </DialogDescription>
                    </DialogHeader>
                    <form ref={formRef} onSubmit={handleSaveTenant} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                      
                      {!editingTenant && (
                        <div className="md:col-span-2 space-y-2">
                           <Label>Start from scratch or use an helper</Label>
                           <div className="grid grid-cols-2 gap-2">
                                <Button type="button" variant="outline" onClick={() => scanFileInputRef.current?.click()} disabled={isScanning}>
                                    {isScanning ? <LoaderCircle className="animate-spin mr-2"/> : <ScanLine className="mr-2 h-4 w-4"/>}
                                    Scan Document
                                </Button>
                                <input ref={scanFileInputRef} type="file" className="hidden" accept="image/*" onChange={handleScanDocument}/>
                               <Popover open={isFinderOpen} onOpenChange={setIsFinderOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={isFinderOpen} className="w-full justify-between">
                                      <span className="flex items-center gap-2 text-muted-foreground">
                                        <UserPlus className="h-4 w-4" />
                                        Copy info...
                                      </span>
                                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50"/>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                                              className="flex justify-between items-center"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={tenant.avatar} />
                                                        <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{tenant.name}</div>
                                                        <div className="text-xs text-muted-foreground">{tenant.property} &middot; ৳{tenant.rent}</div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                                                    <Copy className="h-3 w-3 mr-1"/>
                                                    Copy
                                                </Button>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                           </div>
                        </div>
                      )}

                      <div className="md:col-span-2 flex flex-col items-center gap-3">
                        <Avatar className="h-24 w-24 border">
                            <AvatarImage src={previewImage ?? undefined} alt="Tenant Avatar" data-ai-hint="person avatar"/>
                            <AvatarFallback><ImageIcon className="text-muted-foreground h-10 w-10"/></AvatarFallback>
                        </Avatar>
                        <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Change Photo
                        </Button>
                        <Input
                            ref={fileInputRef}
                            name="avatar"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" defaultValue={editingTenant?.name} required />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="father_name">Father's Name</Label>
                        <Input id="father_name" name="father_name" defaultValue={editingTenant?.father_name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" defaultValue={editingTenant?.email} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={editingTenant?.phone} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                        <Input id="whatsapp_number" name="whatsapp_number" type="tel" defaultValue={editingTenant?.whatsapp_number || ''} placeholder="e.g. +8801712345678" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={editingTenant?.date_of_birth} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="nid_number">NID Number</Label>
                        <Input id="nid_number" name="nid_number" defaultValue={editingTenant?.nid_number} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" defaultValue={editingTenant?.address} placeholder="Full address..."/>
                      </div>

                       <div className="space-y-2">
                        <Label htmlFor="property">Apartment / Unit</Label>
                        <Input id="property" name="property" defaultValue={editingTenant?.property} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rent">Rent Amount</Label>
                        <Input
                          id="rent"
                          name="rent"
                          type="number"
                          defaultValue={editingTenant?.rent}
                          required
                          className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advance_deposit">Advance Deposit</Label>
                        <Input
                          id="advance_deposit"
                          name="advance_deposit"
                          type="number"
                          defaultValue={editingTenant?.advance_deposit}
                          className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="join_date">Join Date</Label>
                        <Input id="join_date" name="join_date" type="date" defaultValue={editingTenant?.join_date} required />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Input id="type" name="type" placeholder="e.g. Tenant, Electrician" defaultValue={editingTenant?.type} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="status">Status</Label>
                          <Select name="status" defaultValue={editingTenant?.status || 'Active'}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                           </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" defaultValue={editingTenant?.notes} placeholder="Any relevant notes about the tenant..."/>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                         <Label>Documents</Label>
                         <div className="border border-dashed rounded-lg p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                               {existingDocuments.map((docUrl) => (
                                 <div key={docUrl} className="relative group">
                                    <a href={docUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={docUrl} alt="Document" className="w-full h-20 object-cover rounded-md" data-ai-hint="document id"/>
                                    </a>
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => handleRemoveExistingDocument(docUrl)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                 </div>
                               ))}
                               {documentFiles.map((file, index) => (
                                 <div key={index} className="relative group">
                                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-20 object-cover rounded-md" data-ai-hint="document id"/>
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => handleRemoveNewDocument(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                 </div>
                               ))}
                            </div>
                            <Button type="button" variant="outline" className="w-full" onClick={() => docFileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Documents
                            </Button>
                             <Input
                                ref={docFileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleDocumentUpload}
                            />
                         </div>
                      </div>

                      <DialogFooter className="md:col-span-2 mt-4">
                        <DialogClose asChild>
                          <Button variant="outline" disabled={isUploading}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isUploading || isScanning}>
                           {isUploading && <LoaderCircle className="animate-spin mr-2"/>}
                           {isUploading ? 'Saving...' : 'Save Tenant'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
              </Dialog>
            }
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead className="hidden md:table-cell">Property</TableHead>
                <TableHead className="hidden sm:table-cell">Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={tenant.avatar} alt={tenant.name} data-ai-hint="person avatar" />
                          <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground md:hidden">{tenant.property}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tenant.property}</TableCell>
                    <TableCell className="hidden sm:table-cell">৳{tenant.rent.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeClass(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleViewDetails(tenant)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEdit(tenant, e)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleWhatsappMessage(tenant, e)}>
                              <WhatsAppIcon className="mr-2 h-4 w-4" />
                              Send WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleDelete(tenant.id, e)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No tenants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
