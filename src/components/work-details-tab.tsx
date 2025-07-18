

"use client"

import * as React from "react"
import { useAppContext } from "@/context/app-context"
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
import { PlusCircle, Edit, Trash2, LoaderCircle, ExternalLink, Download, Upload, CheckCircle, AlertCircle, MoreHorizontal } from "lucide-react"
import type { WorkDetail, Tenant } from "@/types"
import { saveWorkDetailAction, deleteWorkDetailAction } from "@/app/actions/work"
import { getYear } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useProtection } from "@/context/protection-context"
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

const workCategories = ["Plumbing", "Electrical", "Painting", "Cleaning", "Appliance Repair", "General Maintenance"];

const getWorkStatusIcon = (status: WorkDetail['status']) => {
    switch(status) {
        case "Completed": return <CheckCircle className="h-4 w-4 text-green-500"/>;
        case "In Progress": return <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin"/>;
        case "To Do": return <AlertCircle className="h-4 w-4 text-yellow-500"/>;
        default: return null;
    }
}

interface EditableAmountProps {
    initialAmount: number;
    onSave: (newAmount: number) => void;
    currencySymbol: string;
    isAdmin: boolean;
    withProtection: (action: () => void, event?: React.MouseEvent) => void;
}

const EditableAmount: React.FC<EditableAmountProps> = ({ initialAmount, onSave, currencySymbol, isAdmin, withProtection }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [amount, setAmount] = React.useState(initialAmount);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        const newAmount = Number(amount);
        if (newAmount !== initialAmount) {
            onSave(newAmount);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isAdmin) {
            withProtection(() => {
                setIsEditing(true);
            }, e);
        }
    };
    
    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                        setAmount(initialAmount);
                        setIsEditing(false);
                    }
                }}
                className="h-8 w-24 text-left"
            />
        );
    }

    return (
        <button 
            onClick={handleClick}
            disabled={!isAdmin}
            className={cn("text-left", isAdmin && "hover:bg-muted rounded-md px-2 py-1 transition-colors")}>
                {formatCurrency(amount, currencySymbol)}
        </button>
    );
};


export function WorkDetailsTab({ year }: { year: number }) {
  const { workDetails, loading, addWorkDetailsBatch, refreshData, settings } = useAppContext();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingWork, setEditingWork] = React.useState<WorkDetail | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isNavigating, startNavigating] = React.useTransition();
  const { withProtection } = useProtection();

  const [workCategory, setWorkCategory] = React.useState('');
  const [customWorkCategory, setCustomWorkCategory] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const filteredWorkDetails = React.useMemo(() => {
    return workDetails.filter(work => {
      const workDate = work.due_date ? new Date(work.due_date) : work.created_at ? new Date(work.created_at) : null;
      if (!workDate) {
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
  
  const handleEdit = (work: WorkDetail, e: React.MouseEvent) => {
    withProtection(() => {
      setEditingWork(work);
      setIsDialogOpen(true);
    }, e);
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

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    withProtection(() => {
      startTransition(async () => {
          const result = await deleteWorkDetailAction(formData);
          if (result.error) {
              toast({ title: 'Error deleting work detail', description: result.error, variant: 'destructive' });
          } else {
              toast({ title: 'Work Detail Deleted', description: 'The work item has been removed.' });
          }
      });
    });
  };
  
  const yearlyTotal = React.useMemo(() => {
    return filteredWorkDetails.reduce((acc, work) => acc + (work.product_cost || 0) + (work.worker_cost || 0), 0);
  }, [filteredWorkDetails]);
  
  const handleDownloadTemplate = () => {
    const headers = ["title", "description", "category", "status", "product_cost", "worker_cost", "due_date"];
    const sampleData = [
        ["Repair kitchen sink", "Leaking faucet in Apt 2B", "Plumbing", "To Do", 500, 1500, formatDate(new Date().toISOString(), 'yyyy-MM-dd')],
        ["Paint hallway", "Repaint the 3rd floor hallway", "Painting", "In Progress", 3000, 5000, formatDate(new Date().toISOString(), 'yyyy-MM-dd')]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Details Template");
    XLSX.writeFile(workbook, "WorkDetails_Template.xlsx");
    toast({ title: "Template Downloaded", description: "WorkDetails_Template.xlsx has been downloaded." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast({ title: "Processing file...", description: "Please wait while we read your spreadsheet." });
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                blankrows: false,
                defval: '',
            });

            if (json.length < 2) {
                toast({ title: "Empty or invalid sheet", description: "The sheet must have a header row and at least one data row.", variant: "destructive" });
                return;
            }

            const header: string[] = json[0].map((h: any) => String(h).toLowerCase().trim().replace(/ /g, '_'));
            const rows = json.slice(1);

            const workDetailsToCreate = rows.map(rowArray => {
                const row: { [key: string]: any } = {};
                header.forEach((h, i) => { row[h] = rowArray[i]; });
                
                const validStatuses = ["to do", "in progress", "completed"];
                const statusInput = String(row.status || 'To Do').toLowerCase();
                const status = validStatuses.find(s => s === statusInput)
                    ? statusInput.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') as WorkDetail['status']
                    : 'To Do';
                
                let dueDate: string | null = null;
                const dateInput = row.due_date;
                 if (dateInput) {
                    if (typeof dateInput === 'number') {
                        const excelDate = new Date(Date.UTC(1900, 0, dateInput - 1));
                        dueDate = formatDate(excelDate.toISOString(), 'yyyy-MM-dd');
                    } else {
                        const parsed = new Date(dateInput);
                        if (!isNaN(parsed.getTime())) {
                            dueDate = formatDate(parsed.toISOString(), 'yyyy-MM-dd');
                        }
                    }
                }

                return {
                    title: String(row.title || ''),
                    description: String(row.description || ''),
                    category: String(row.category || 'Other'),
                    status: status,
                    product_cost: Number(row.product_cost) || null,
                    worker_cost: Number(row.worker_cost) || null,
                    due_date: dueDate,
                };
            }).filter(item => item.title);
            
             if (workDetailsToCreate.length === 0) {
                toast({ title: "No Valid Data Found", description: "Ensure your file has a 'title' column.", variant: "destructive" });
                return;
            }

            await addWorkDetailsBatch(workDetailsToCreate, toast);

        } catch (error) {
             console.error("Error importing file:", error);
             toast({ title: "Import Failed", description: "There was an error processing your file.", variant: "destructive" });
        } finally {
             if (event.target) event.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleViewReport = () => {
    startNavigating(() => {
      router.push('/work-report');
    });
  };

  const handleCostUpdate = async (work: WorkDetail, field: 'product_cost' | 'worker_cost', value: number) => {
    const formData = new FormData();
    formData.set('workId', work.id);
    formData.set('title', work.title);
    formData.set('description', work.description || '');
    formData.set('category', work.category || '');
    formData.set('status', work.status);
    formData.set('due_date', work.due_date || '');
    formData.set('product_cost', String(field === 'product_cost' ? value : work.product_cost || 0));
    formData.set('worker_cost', String(field === 'worker_cost' ? value : work.worker_cost || 0));

    const result = await saveWorkDetailAction(formData);
    if (result.error) {
      toast({ title: 'Error Updating Cost', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Cost Updated', description: `The cost for "${work.title}" has been updated.` });
      refreshData();
    }
  };


  return (
    <TooltipProvider>
    <Card className="mt-4">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Work Details for {year}</CardTitle>
          <CardDescription>Track maintenance, repairs, and other jobs for the property.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleViewReport} disabled={isNavigating}>
            {isNavigating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
            View Full Report
          </Button>
          {isAdmin && (
              <div className="flex items-center gap-2">
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
                                                  <SelectItem value="Other">Other</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      </div>
                                      <div className="space-y-2">
                                          <Label htmlFor="due_date">Due Date</Label>
                                          <Input id="due_date" name="due_date" type="date" defaultValue={editingWork?.due_date ? formatDate(editingWork.due_date, 'yyyy-MM-dd') : formatDate(new Date(year, new Date().getMonth()).toISOString(), 'yyyy-MM-dd')} />
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
                  <div className="hidden sm:flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" onClick={handleDownloadTemplate}><Download className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Template</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" onClick={handleImportClick}><Upload className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Import</TooltipContent>
                    </Tooltip>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .csv" onChange={handleFileChange} />
              </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
              <TableHead className="text-inherit">Work Item</TableHead>
              <TableHead className="text-inherit hidden sm:table-cell">Product Cost</TableHead>
              <TableHead className="text-inherit hidden sm:table-cell">Worker Cost</TableHead>
              <TableHead className="text-inherit">Total Cost</TableHead>
              <TableHead className="text-inherit hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right text-inherit w-12"></TableHead>
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
              filteredWorkDetails.slice(0, showAll ? filteredWorkDetails.length : 10).map((work) => {
                const totalCost = (work.product_cost || 0) + (work.worker_cost || 0);
                const isCompleted = work.status === 'Completed';
                return (
                  <TableRow key={work.id} className="odd:bg-muted/50">
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {work.title}
                        <div className="sm:hidden">{getWorkStatusIcon(work.status)}</div>
                      </div>
                      <div className="text-sm text-muted-foreground sm:hidden">{work.description}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <EditableAmount 
                            initialAmount={work.product_cost || 0}
                            onSave={(newAmount) => handleCostUpdate(work, 'product_cost', newAmount)}
                            currencySymbol={settings.currencySymbol}
                            isAdmin={isAdmin}
                            withProtection={withProtection}
                        />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <EditableAmount 
                            initialAmount={work.worker_cost || 0}
                            onSave={(newAmount) => handleCostUpdate(work, 'worker_cost', newAmount)}
                            currencySymbol={settings.currencySymbol}
                            isAdmin={isAdmin}
                            withProtection={withProtection}
                        />
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(totalCost, settings.currencySymbol)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={isCompleted ? 'default': 'secondary'} className={cn(isCompleted && 'bg-success hover:bg-success/80')}>
                            {work.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => handleEdit(work, e)}>
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
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>This will permanently delete this work item. This action cannot be undone.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <form onSubmit={handleDelete}>
                                                  <input type="hidden" name="workId" value={work.id} />
                                                  <AlertDialogAction type="submit" disabled={isPending}>Delete</AlertDialogAction>
                                              </form>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
            })
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center h-24 text-muted-foreground">
                  No work items found for {year}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            {filteredWorkDetails.length > 0 && (
                <TableFooter>
                    <TableRow style={{ backgroundColor: 'hsl(var(--table-footer-background))', color: 'hsl(var(--table-footer-foreground))' }} className="font-bold hover:bg-[hsl(var(--table-footer-background)/0.9)]">
                        <TableCell colSpan={6} className="text-inherit p-2">
                           <div className="flex flex-col sm:flex-row items-center justify-between px-2">
                                <div className="sm:hidden text-center text-inherit font-bold">Total for {year}</div>
                                <div className="hidden sm:block text-left text-inherit font-bold">Total for {year}</div>
                                <div className="text-inherit font-bold">{formatCurrency(yearlyTotal, settings.currencySymbol)}</div>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            )}
        </Table>
        {filteredWorkDetails.length > 10 && (
            <div className="p-4 border-t text-center">
                <Button variant="link" onClick={() => setShowAll(!showAll)}>
                    {showAll ? "Show Less" : `View All ${filteredWorkDetails.length} Items`}
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}
