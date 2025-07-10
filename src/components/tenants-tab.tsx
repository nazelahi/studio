
"use client"

import * as React from "react"
import { MoreHorizontal, PlusCircle, Image as ImageIcon, Mail, Phone, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Tenant } from "@/types"
import { useData } from "@/context/data-context"

export function TenantsTab() {
  const { tenants, addTenant, updateTenant, deleteTenant } = useData();
  const [open, setOpen] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null);
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
  
  const handleSaveTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const tenantData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      property: formData.get('property') as string,
      rent: Number(formData.get('rent')),
      joinDate: formData.get('joinDate') as string,
      notes: formData.get('notes') as string,
      avatar: previewImage || editingTenant?.avatar || 'https://placehold.co/80x80.png',
    };

    if (editingTenant) {
      updateTenant({ ...editingTenant, ...tenantData });
      toast({
        title: 'Tenant Updated',
        description: `${tenantData.name}'s information has been successfully updated.`,
      });
    } else {
      addTenant({ status: 'Pending', ...tenantData });
      toast({
        title: 'Tenant Added',
        description: `${tenantData.name} has been successfully added.`,
      });
    }

    setOpen(false);
    setEditingTenant(null);
    setPreviewImage(null);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setPreviewImage(tenant.avatar);
    setOpen(true);
  };

  const handleDelete = (tenantId: string) => {
    deleteTenant(tenantId);
    toast({
        title: 'Tenant Deleted',
        description: "The tenant's information has been deleted.",
        variant: 'destructive'
    });
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingTenant(null);
      setPreviewImage(null);
    }
    setOpen(isOpen);
  };


  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-success text-success-foreground hover:bg-success/80';
      case 'Pending':
        return 'bg-warning text-warning-foreground hover:bg-warning/80';
      case 'Overdue':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      default:
        return '';
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            Manage your tenants and their information.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditingTenant(null)}>
              <PlusCircle className="h-4 w-4" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
              <DialogDescription>
                Fill in the form below to {editingTenant ? 'update the' : 'add a new'} tenant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTenant} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="md:col-span-2 flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                      <AvatarImage src={previewImage ?? "https://placehold.co/96x96.png"} alt="Tenant Avatar" data-ai-hint="person avatar"/>
                      <AvatarFallback><ImageIcon className="text-muted-foreground h-12 w-12"/></AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Upload Image
                  </Button>
                  <Input
                      ref={fileInputRef}
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={editingTenant?.notes} placeholder="Any relevant notes about the tenant..."/>
              </div>
              <DialogFooter className="md:col-span-2">
                <DialogClose asChild>
                   <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Tenant</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead className="hidden md:table-cell">Apartment</TableHead>
              <TableHead className="hidden md:table-cell">Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={tenant.avatar}
                        alt={tenant.name}
                        data-ai-hint="person avatar"
                      />
                      <AvatarFallback>
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{tenant.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground"/>
                            <span>{tenant.email}</span>
                        </div>
                        {tenant.phone && (
                             <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground"/>
                                <span>{tenant.phone}</span>
                            </div>
                        )}
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{tenant.property}</TableCell>
                <TableCell className="hidden md:table-cell">${tenant.rent.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(tenant.status)}>
                    {tenant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(tenant)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(tenant.id)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
