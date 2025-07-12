
"use client"

import * as React from "react"
import { MoreHorizontal, PlusCircle, Image as ImageIcon, Mail, Phone, Home, ChevronDown, Copy, X, Search, FileText, Check, UserPlus, Calendar, Briefcase, Upload, File, Trash2, LoaderCircle } from "lucide-react"
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docFileInputRef = React.useRef<HTMLInputElement>(null);
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
      property: formData.get('property') as string,
      rent: Number(formData.get('rent')),
      joinDate: formData.get('joinDate') as string,
      notes: formData.get('notes') as string,
      type: formData.get('type') as string,
      avatar: previewImage || editingTenant?.avatar || 'https://placehold.co/80x80.png',
      documents: existingDocuments, // Start with the ones we didn't remove
      status: formData.get('status') as Tenant['status'] || editingTenant?.status || 'Active',
    };

    try {
      if (editingTenant) {
        await updateTenant({ ...editingTenant, ...tenantData }, documentFiles);
        toast({
          title: 'Tenant Updated',
          description: `${tenantData.name}'s information has been successfully updated.`,
        });
      } else {
        await addTenant(tenantData, documentFiles);
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
  };
  
  const handleSelectTenantToCopy = (tenant: Tenant) => {
    if (formRef.current) {
        const elements = formRef.current.elements;
        const getEl = (name: string) => elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;

        getEl('name').value = tenant.name;
        getEl('email').value = tenant.email;
        getEl('phone').value = tenant.phone || '';
        getEl('property').value = tenant.property;
        getEl('rent').value = tenant.rent.toString();
        getEl('joinDate').value = tenant.joinDate;
        getEl('notes').value = tenant.notes || '';
        getEl('type').value = tenant.type || '';
        
        setPreviewImage(tenant.avatar);
        setExistingDocuments(tenant.documents || []);
        setDocumentFiles([]);
    }
    toast({ title: 'Tenant Info Copied', description: `Data from ${tenant.name} has been pre-filled.`});
    setIsFinderOpen(false);
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenantForSheet(tenant);
    setIsSheetOpen(true);
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setPreviewImage(tenant.avatar);
    setExistingDocuments(tenant.documents || []);
    setDocumentFiles([]);
    setOpen(true);
  };

  const handleDelete = async (tenantId: string) => {
    await deleteTenant(tenantId);
    toast({
        title: 'Tenant Deleted',
        description: "The tenant's information has been deleted.",
        variant: 'destructive'
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
        return 'bg-warning text-warning-foreground hover:bg-warning/80';
      case 'Overdue':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      default:
        return '';
    }
  };
  
  const TenantCardSkeleton = () => (
    <Card className="flex flex-col overflow-hidden">
        <Skeleton className="h-40 w-full bg-muted" />
        <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
        </CardContent>
    </Card>
  );


  return (
    <>
      <Card className="mt-4 border-0 shadow-none">
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            Manage your tenants and their information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tenants..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
               {isAdmin && 
                <Dialog open={open} onOpenChange={handleOpenChange}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingTenant(null)} className="w-full sm:w-auto">
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
                        <div className="md:col-span-2">
                          <Label>Start with existing data (optional)</Label>
                           <Popover open={isFinderOpen} onOpenChange={setIsFinderOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isFinderOpen} className="w-full justify-between mt-1">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <UserPlus className="h-4 w-4" />
                                    Copy info from an existing tenant...
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
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" defaultValue={editingTenant?.email} required />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Input id="type" name="type" placeholder="e.g. Tenant, Electrician" defaultValue={editingTenant?.type} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={editingTenant?.phone} />
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
                        <Label htmlFor="joinDate">Join Date</Label>
                        <Input id="joinDate" name="joinDate" type="date" defaultValue={editingTenant?.joinDate} required />
                      </div>
                      <div className="space-y-2">
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
                        <Button type="submit" disabled={isUploading}>
                           {isUploading && <LoaderCircle className="animate-spin mr-2"/>}
                           Save Tenant
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              }
          </div>
          
            {loading ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <TenantCardSkeleton key={i} />)}
                </div>
            ) : (
                 <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredTenants.length > 0 ? filteredTenants.map((tenant) => (
                    <Card key={tenant.id} className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
                        <div className="relative bg-muted">
                            <img src={tenant.avatar} alt={tenant.name} className="w-full h-40 object-contain" data-ai-hint="person avatar" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-4">
                                <h3 className="font-bold text-lg text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>{tenant.name}</h3>
                                <div className="flex items-center gap-2">
                                   <Home className="h-4 w-4 text-white/90" />
                                   <p className="text-sm text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{tenant.property}</p>
                                </div>
                            </div>
                             <div className="absolute top-2 right-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">More options</span>
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(tenant)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    {isAdmin && <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleEdit(tenant)}>Edit</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDelete(tenant.id)} className="text-destructive">
                                          Delete
                                      </DropdownMenuItem>
                                    </>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <CardContent className="p-4 flex-grow flex flex-col">
                            <div className="text-sm space-y-3 flex-grow">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${tenant.email}`} className="truncate text-primary hover:underline">{tenant.email}</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground"/>
                                    <a href={`tel:${tenant.phone}`} className="text-primary hover:underline">{tenant.phone || "N/A"}</a>
                                </div>
                                {tenant.type && (
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="h-4 w-4 text-muted-foreground"/>
                                        <span>{tenant.type}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                    <span>Join Date: {format(parseISO(tenant.joinDate), "MMM dd, yyyy")}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <Badge className={`${getStatusBadge(tenant.status)} w-full justify-center`}>{tenant.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No tenants found.
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
