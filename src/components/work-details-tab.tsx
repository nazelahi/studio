

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Edit, Trash2, LoaderCircle, ExternalLink } from "lucide-react"
import type { WorkDetail, Tenant } from "@/types"
import { saveWorkDetailAction, deleteWorkDetailAction } from "@/app/actions/work"
import { format, parseISO, getYear } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
};

const workCategories = ["Plumbing", "Electrical", "Painting", "Cleaning", "Appliance Repair", "General Maintenance", "Other"];


export function WorkDetailsTab({ year }: { year: number }) {
  const { workDetails, loading } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingWork, setEditingWork] = React.useState<WorkDetail | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [workCategory, setWorkCategory] = React.useState('');
  const [customWorkCategory, setCustomWorkCategory] = React.useState('');
  
  const filteredWorkDetails = React.useMemo(() => {
    return workDetails.filter(work => {
      const workDate = work.due_date ? parseISO(work.due_date) : work.created_at ? parseISO(work.created_at) : null;
      if (!workDate) {
        // Decide if items without a date should be shown for the current year or not at all.
        // Here, we include them if we are viewing the current year.
        return year === new Date().getFullYear();
      }
      return getYear(workDate) === year;
    });
  }, [workDetails, year]);

  React.useEffect(() => {
    if (editingWork) {
        const category = editingWork.category || '';
        if (workCategories.includes(category)) {
            setWorkCategory(category);
            setCustomWorkCategory('');
        } else if (category) {
            setWorkCategory('Other');
            setCustomWorkCategory(category);
        } else {
            setWorkCategory('');
            setCustomWorkCategory('');
        }
    }
  }, [editingWork]);


  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingWork(null);
      setWorkCategory('');
      setCustomWorkCategory('');
    }
    setIsDialogOpen(isOpen);
  };
  
  const handleEdit = (work: WorkDetail) => {
    setEditingWork(work);
    setIsDialogOpen(true);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const finalCategory = workCategory === 'Other' 
        ? formData.get('customCategory') as string
        : workCategory;
    formData.set('category', finalCategory);


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
  
  const yearlyTotal = React.useMemo(() => {
    return filteredWorkDetails.reduce((acc, work) => acc + (work.product_cost || 0) + (work.worker_cost || 0), 0);
  }, [filteredWorkDetails]);


  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Work Details for {year}</CardTitle>
          <CardDescription>Track maintenance, repairs, and other jobs for the property.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/work-report')}>
            View Full Report
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
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
                                      <Select value={workCategory} onValueChange={setWorkCategory}>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Select a category" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {workCategories.map(cat => (
                                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="due_date">Due Date</Label>
                                      <Input id="due_date" name="due_date" type="date" defaultValue={editingWork?.due_date ? format(parseISO(editingWork.due_date), 'yyyy-MM-dd') : new Date(year, new Date().getMonth()).toISOString().split('T')[0]} />
                                  </div>
                              </div>
                              
                              {workCategory === 'Other' && (
                                  <div className="space-y-2">
                                    <Label htmlFor="customCategory">Custom Category</Label>
                                    <Input 
                                      id="customCategory" 
                                      name="customCategory" 
                                      value={customWorkCategory}
                                      onChange={(e) => setCustomWorkCategory(e.target.value)}
                                      placeholder="Enter custom category" 
                                      required 
                                    />
                                  </div>
                              )}

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
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary/90">
              <TableHead className="text-primary-foreground">Work Category</TableHead>
              <TableHead className="text-primary-foreground hidden sm:table-cell">Product Price</TableHead>
              <TableHead className="text-primary-foreground hidden sm:table-cell">Worker Cost</TableHead>
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
            ) : filteredWorkDetails.length > 0 ? (
              filteredWorkDetails.map((work) => {
                const totalCost = (work.product_cost || 0) + (work.worker_cost || 0);
                const isCompleted = work.status === 'Completed';
                return (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatCurrency(work.product_cost)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatCurrency(work.worker_cost)}</TableCell>
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
                  No work items found for {year}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            {filteredWorkDetails.length > 0 && (
                <TableFooter>
                    <TableRow className="bg-lime-500 hover:bg-lime-500/90 font-bold">
                        <TableCell colSpan={isAdmin ? 4 : 3} className="text-white text-right sm:text-left">Total for {year}</TableCell>
                        <TableCell colSpan={isAdmin ? 2 : 2} className="text-right text-white">{formatCurrency(yearlyTotal)}</TableCell>
                    </TableRow>
                </TableFooter>
            )}
        </Table>
      </CardContent>
    </Card>
  )
}
