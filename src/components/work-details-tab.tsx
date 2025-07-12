
"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { PlusCircle, Edit, Trash2, LoaderCircle, CheckCircle, Construction, Calendar, ChevronDown, Check } from "lucide-react"
import type { WorkDetail, Tenant } from "@/types"
import { saveWorkDetailAction, deleteWorkDetailAction } from "@/app/actions/work"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
};

export function WorkDetailsTab() {
  const { workDetails, tenants, loading } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingWork, setEditingWork] = React.useState<WorkDetail | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isContactFinderOpen, setIsContactFinderOpen] = React.useState(false);
  const [assignedContact, setAssignedContact] = React.useState<Tenant | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingWork(null);
      setAssignedContact(null);
    }
    setIsDialogOpen(isOpen);
  };
  
  const handleEdit = (work: WorkDetail) => {
    setEditingWork(work);
    if (work.assigned_to_id) {
        const contact = tenants.find(t => t.id === work.assigned_to_id);
        setAssignedContact(contact || null);
    }
    setIsDialogOpen(true);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (assignedContact) {
        formData.set('assigned_to_id', assignedContact.id);
    } else {
        formData.delete('assigned_to_id');
    }

    startTransition(async () => {
      const result = await saveWorkDetailAction(formData);
      if (result.error) {
        toast({ title: 'Error saving work detail', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: editingWork ? 'Work Detail Updated' : 'Work Detail Added', description: 'The work item has been saved.' });
        handleOpenChange(false);
      }
    });
  };

  const handleDelete = (formData: FormData) => {
    startTransition(async () => {
        const result = await deleteWorkDetailAction(formData);
        if (result.error) {
            toast({ title: 'Error deleting work detail', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Work Detail Deleted', description: 'The work item has been removed.' });
        }
    });
  };
  
  const handleSelectContact = (contact: Tenant) => {
    setAssignedContact(contact);
    setIsContactFinderOpen(false);
  };
  
  const grandTotal = React.useMemo(() => {
    return workDetails.reduce((acc, work) => acc + (work.product_cost || 0) + (work.worker_cost || 0), 0);
  }, [workDetails]);


  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Work Details</CardTitle>
          <CardDescription>Track maintenance, repairs, and other jobs for the property.</CardDescription>
        </div>
        {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Work Item
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingWork ? 'Edit Work Item' : 'Add New Work Item'}</DialogTitle>
                        <DialogDescription>Fill in the details for the job below.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        {editingWork && <input type="hidden" name="workId" value={editingWork.id} />}
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" defaultValue={editingWork?.title} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={editingWork?.description || ''} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input id="category" name="category" defaultValue={editingWork?.category || ''} placeholder="e.g., Plumbing" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input id="due_date" name="due_date" type="date" defaultValue={editingWork?.due_date ? format(parseISO(editingWork.due_date), 'yyyy-MM-dd') : ''} />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="product_cost">Product Cost</Label>
                                    <Input id="product_cost" name="product_cost" type="number" step="0.01" defaultValue={editingWork?.product_cost || ''} placeholder="0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="worker_cost">Worker Cost</Label>
                                    <Input id="worker_cost" name="worker_cost" type="number" step="0.01" defaultValue={editingWork?.worker_cost || ''} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={editingWork?.status || 'To Do'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="To Do">To Do</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign To</Label>
                                <Popover open={isContactFinderOpen} onOpenChange={setIsContactFinderOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                            {assignedContact ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={assignedContact.avatar} />
                                                        <AvatarFallback>{assignedContact.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    {assignedContact.name}
                                                </div>
                                            ) : "Select a contact..."}
                                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50"/>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search contacts..." />
                                            <CommandEmpty>No contact found.</CommandEmpty>
                                            <CommandList>
                                                <CommandGroup>
                                                    {tenants.map((contact) => (
                                                        <CommandItem
                                                            key={contact.id}
                                                            value={contact.name}
                                                            onSelect={() => handleSelectContact(contact)}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", assignedContact?.id === contact.id ? "opacity-100" : "opacity-0")} />
                                                            {contact.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isPending}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isPending}>
                               {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                               Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary/90">
              <TableHead className="text-primary-foreground">Work Category</TableHead>
              <TableHead className="text-primary-foreground">Product Price</TableHead>
              <TableHead className="text-primary-foreground">Worker Cost</TableHead>
              <TableHead className="text-primary-foreground">Status</TableHead>
              <TableHead className="text-right text-primary-foreground">Total Cost</TableHead>
              {isAdmin && <TableHead className="text-primary-foreground w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={6}><div className="h-8 bg-muted rounded animate-pulse w-full"></div></TableCell>
                    </TableRow>
                ))
            ) : workDetails.length > 0 ? (
              workDetails.map((work) => {
                const totalCost = (work.product_cost || 0) + (work.worker_cost || 0);
                const isCompleted = work.status === 'Completed';
                return (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell>{formatCurrency(work.product_cost)}</TableCell>
                    <TableCell>{formatCurrency(work.worker_cost)}</TableCell>
                    <TableCell>
                        <div className={cn("p-2 rounded-md text-center", isCompleted ? 'bg-green-200' : 'bg-transparent')}>
                          {isCompleted ? 'Paid' : work.status}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totalCost)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                         <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(work)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this work item. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <form action={handleDelete}>
                                  <input type="hidden" name="workId" value={work.id} />
                                  <AlertDialogAction type="submit" disabled={isPending}>Delete</AlertDialogAction>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
            })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No work items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            {workDetails.length > 0 && (
                <tfoot>
                    <TableRow className="bg-amber-500 hover:bg-amber-500/90 font-bold">
                        <TableCell colSpan={4} className="text-white">Total</TableCell>
                        <TableCell className="text-right text-white">{formatCurrency(grandTotal)}</TableCell>
                        {isAdmin && <TableCell />}
                    </TableRow>
                </tfoot>
            )}
        </Table>
      </CardContent>
    </Card>
  )
}

    