
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

const getStatusBadgeVariant = (status: WorkDetail['status']) => {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'To Do': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

const getStatusIcon = (status: WorkDetail['status']) => {
    switch (status) {
        case 'Completed': return <CheckCircle className="h-4 w-4 mr-2" />;
        case 'In Progress': return <Construction className="h-4 w-4 mr-2 animate-pulse" />;
        case 'To Do': return <Calendar className="h-4 w-4 mr-2" />;
        default: return null;
    }
}


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
                                    <Label htmlFor="cost">Cost</Label>
                                    <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingWork?.cost || ''} placeholder="0.00" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
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
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input id="due_date" name="due_date" type="date" defaultValue={editingWork?.due_date ? format(parseISO(editingWork.due_date), 'yyyy-MM-dd') : ''} />
                                </div>
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
            <TableRow>
              <TableHead>Work Item</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
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
                const assigned = work.assigned_to_id ? tenants.find(t => t.id === work.assigned_to_id) : null;
                return (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div className="font-medium">{work.title}</div>
                      <div className="text-sm text-muted-foreground">{work.category || 'General'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeVariant(work.status)}>
                        {getStatusIcon(work.status)}
                        {work.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {assigned ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={assigned.avatar} />
                                    <AvatarFallback>{assigned.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{assigned.name}</div>
                                    <div className="text-sm text-muted-foreground">{assigned.property}</div>
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </TableCell>
                    <TableCell>{work.due_date ? format(parseISO(work.due_date), 'dd MMM, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right">{work.cost ? `৳${work.cost.toFixed(2)}` : '-'}</TableCell>
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
        </Table>
      </CardContent>
    </Card>
  )
}

    