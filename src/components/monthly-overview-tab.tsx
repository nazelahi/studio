
"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Banknote, ArrowUpCircle, ArrowDownCircle, PlusCircle, Trash2, Pencil, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, Copy, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { format, parseISO } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { useData } from "@/context/data-context"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { Checkbox } from "./ui/checkbox"

type HistoricalTenant = {
    uniqueId: string;
    name: string;
    property: string;
    rent: number;
    avatar: string;
    lastSeen: { month: number, year: number };
}

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const getStatusBadge = (status: RentEntry["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getStatusIcon = (status: RentEntry["status"]) => {
    switch(status) {
        case "Paid": return <CheckCircle className="h-4 w-4 mr-1"/>;
        case "Overdue": return <XCircle className="h-4 w-4 mr-1"/>;
        case "Pending": return <AlertCircle className="h-4 w-4 mr-1"/>
        default: return null;
    }
}


const getExpenseStatusBadge = (status: Expense["status"]) => {
    return status === "Reimbursed" ? "bg-success text-success-foreground hover:bg-success/80"
      : "bg-warning text-warning-foreground hover:bg-warning/80";
};

export function MonthlyOverviewTab({ year }: { year: number }) {
  const currentMonthIndex = year === new Date().getFullYear() ? new Date().getMonth() : 0;
  const [selectedMonth, setSelectedMonth] = React.useState(months[currentMonthIndex]);
  const { toast } = useToast();

  const { tenants, expenses, rentData, addRentEntry, updateRentEntry, deleteRentEntry, addExpense, updateExpense, deleteExpense, syncTenantsForMonth, loading, deleteMultipleRentEntries, deleteMultipleExpenses } = useData();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  const [isRentDialogOpen, setIsRentDialogOpen] = React.useState(false);
  const [editingRentEntry, setEditingRentEntry] = React.useState<RentEntry | null>(null);
  
  const [isTenantFinderOpen, setIsTenantFinderOpen] = React.useState(false);
  const [selectedHistoricalTenant, setSelectedHistoricalTenant] = React.useState<HistoricalTenant | null>(null);
  
  const [selectedRentEntryIds, setSelectedRentEntryIds] = React.useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<string[]>([]);

  const formRef = React.useRef<HTMLFormElement>(null);


  const filteredTenantsForMonth = React.useMemo(() => {
    return rentData.filter(entry => entry.month === months.indexOf(selectedMonth) && entry.year === year);
  }, [rentData, selectedMonth, year]);

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(expense => {
        if (!expense.date) return false;
        try {
            const expenseDate = parseISO(expense.date);
            return expenseDate.getMonth() === months.indexOf(selectedMonth) && expenseDate.getFullYear() === year;
        } catch {
            return false;
        }
      });
  }, [expenses, selectedMonth, year]);
  
  // Clear selections when month or year changes
  React.useEffect(() => {
    setSelectedRentEntryIds([]);
    setSelectedExpenseIds([]);
  }, [selectedMonth, year]);


  const historicalTenants = React.useMemo(() => {
    const allTenantsMap = new Map<string, HistoricalTenant>();

    const processEntry = (entry: RentEntry | Tenant, type: 'rent' | 'tenant') => {
        const uniqueId = `${entry.name.toLowerCase()}-${entry.property.toLowerCase()}`;
        const existing = allTenantsMap.get(uniqueId);

        let entryDate, entryMonth, entryYear;

        if(type === 'rent' && 'year' in entry && 'month' in entry) {
            entryYear = entry.year;
            entryMonth = entry.month;
        } else if ('joinDate' in entry && entry.joinDate) {
            try {
                const parsedDate = parseISO(entry.joinDate);
                entryYear = parsedDate.getFullYear();
                entryMonth = parsedDate.getMonth();
            } catch (e) {
                console.error("Invalid joinDate:", entry.joinDate);
                return;
            }
        } else {
            return; 
        }

        const isMoreRecent = !existing || entryYear > existing.lastSeen.year || (entryYear === existing.lastSeen.year && entryMonth > existing.lastSeen.month);

        if (isMoreRecent) {
            allTenantsMap.set(uniqueId, {
                uniqueId,
                name: entry.name,
                property: entry.property,
                rent: entry.rent,
                avatar: entry.avatar,
                lastSeen: { month: entryMonth, year: entryYear }
            });
        }
    };
    
    rentData.forEach(entry => processEntry(entry, 'rent'));
    tenants.forEach(tenant => processEntry(tenant, 'tenant'));

    const currentMonthTenantIds = new Set(filteredTenantsForMonth.map(t => `${t.name.toLowerCase()}-${t.property.toLowerCase()}`));
    
    return Array.from(allTenantsMap.values())
        .filter(t => !currentMonthTenantIds.has(t.uniqueId))
        .sort((a, b) => a.name.localeCompare(b.name));

  }, [rentData, tenants, filteredTenantsForMonth]);


  // Rent Entry Handlers
  const handleRentOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setEditingRentEntry(null);
        setSelectedHistoricalTenant(null);
    }
    setIsRentDialogOpen(isOpen);
  };
  
  const handleEditRentEntry = (entry: RentEntry) => {
    setEditingRentEntry(entry);
    setSelectedHistoricalTenant(null);
    setIsRentDialogOpen(true);
  };
  
  const handleSelectHistoricalTenant = (tenant: HistoricalTenant) => {
      setSelectedHistoricalTenant(tenant);
      setIsTenantFinderOpen(false);

      if(formRef.current) {
          (formRef.current.elements.namedItem('name') as HTMLInputElement).value = tenant.name;
          (formRef.current.elements.namedItem('property') as HTMLInputElement).value = tenant.property;
          (formRef.current.elements.namedItem('amount') as HTMLInputElement).value = tenant.rent.toString();
      }
  };

  const handleClearSelectedTenant = () => {
    setSelectedHistoricalTenant(null);
    if(formRef.current) {
      formRef.current.reset();
    }
  }

  const handleDeleteRentEntry = async (entryId: string) => {
    await deleteRentEntry(entryId);
    toast({ title: "Rent Entry Deleted", description: "The rent entry for this month has been deleted.", variant: "destructive" });
  };
  
  const handleSaveRentEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rentEntryData = {
        name: formData.get('name') as string,
        property: formData.get('property') as string,
        rent: Number(formData.get('amount')),
        paymentDate: formData.get('paymentDate') as string,
        collectedBy: formData.get('collectedBy') as string,
        status: formData.get('status') as RentEntry['status'],
        avatar: selectedHistoricalTenant?.avatar,
    };

    if(editingRentEntry) {
        await updateRentEntry({ ...editingRentEntry, ...rentEntryData });
        toast({ title: "Rent Entry Updated", description: "The entry has been successfully updated." });
    } else {
        const selectedMonthIndex = months.indexOf(selectedMonth);
        const newEntry: Omit<RentEntry, 'id' | 'tenantId' | 'year' | 'month' | 'dueDate'> = rentEntryData;
        await addRentEntry(newEntry, year, selectedMonthIndex);
        toast({ title: "Rent Entry Added", description: "The new entry has been successfully added." });
    }

    setIsRentDialogOpen(false);
    setEditingRentEntry(null);
    setSelectedHistoricalTenant(null);
  };

    const handleSyncTenants = async () => {
        const selectedMonthIndex = months.indexOf(selectedMonth);
        const syncedCount = await syncTenantsForMonth(year, selectedMonthIndex);

        if (syncedCount > 0) {
            toast({
                title: "Sync Complete",
                description: `${syncedCount} tenant(s) have been added to the rent roll for ${months[selectedMonthIndex]}.`,
            });
        } else {
             toast({
                title: "Already up to date",
                description: "All active tenants are already in the rent roll for this month.",
            });
        }
    };
    
  const handleMassDeleteRentEntries = async () => {
    await deleteMultipleRentEntries(selectedRentEntryIds);
    toast({
      title: `${selectedRentEntryIds.length} Rent Entries Deleted`,
      description: "The selected entries have been permanently removed.",
      variant: "destructive"
    });
    setSelectedRentEntryIds([]);
  }

  // Expense Handlers
  const handleSaveExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const expenseData = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      status: formData.get('status') as "Pending" | "Reimbursed",
    };

    if (editingExpense) {
      await updateExpense({ ...editingExpense, ...expenseData });
      toast({ title: "Expense Updated", description: "The expense has been successfully updated." });
    } else {
      await addExpense(expenseData);
      toast({ title: "Expense Added", description: "The new expense has been successfully added." });
    }

    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
    toast({ title: "Expense Deleted", description: "The expense has been deleted.", variant: "destructive" });
  };
  
  const handleExpenseOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingExpense(null);
    }
    setIsExpenseDialogOpen(isOpen);
  };
  
  const handleMassDeleteExpenses = async () => {
    await deleteMultipleExpenses(selectedExpenseIds);
    toast({
      title: `${selectedExpenseIds.length} Expenses Deleted`,
      description: "The selected expenses have been permanently removed.",
      variant: "destructive"
    });
    setSelectedExpenseIds([]);
  }

  const totalRentCollected = filteredTenantsForMonth
    .filter(t => t.status === 'Paid')
    .reduce((acc, t) => acc + t.rent, 0);
  
  const totalRentExpected = filteredTenantsForMonth.reduce((acc, t) => acc + t.rent, 0);
  const collectionRate = totalRentExpected > 0 ? (totalRentCollected / totalRentExpected) * 100 : 0;

  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  const netResult = totalRentCollected - totalExpenses;
  const amountForDeposit = netResult > 0 ? netResult : 0;

  if (loading) {
    return (
      <div className="pt-4 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Tabs value={selectedMonth} onValueChange={setSelectedMonth} className="w-full pt-4">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
        {months.map(month => (
          <TabsTrigger key={month} value={month}>{month.substring(0,3)}</TabsTrigger>
        ))}
      </TabsList>
      {months.map(month => (
        <TabsContent key={month} value={month}>
          <div className="mt-6">
            <Tabs defaultValue="rent-roll" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rent-roll">Rent Roll</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value="rent-roll">
                 <Card className="mt-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle>Rent Roll - {month} {year}</CardTitle>
                        <CardDescription>Rent payment status for {month} {year}.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedRentEntryIds.length > 0 && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Selected ({selectedRentEntryIds.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {selectedRentEntryIds.length} selected rent entries.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMassDeleteRentEntries}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button size="sm" variant="outline" className="gap-2" onClick={handleSyncTenants}>
                            <RefreshCw className="h-4 w-4" />
                            Sync Tenants
                        </Button>
                        <Dialog open={isRentDialogOpen} onOpenChange={handleRentOpenChange}>
                            <DialogTrigger asChild>
                               <Button size="sm" className="gap-2" onClick={() => setEditingRentEntry(null)}>
                                    <PlusCircle className="h-4 w-4" />
                                    Add Rent
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingRentEntry ? 'Edit Rent Entry' : 'Add New Rent Entry'}</DialogTitle>
                                    <DialogDescription>
                                        {editingRentEntry ? 'Update the entry below.' : 'Fill in the form or find a saved tenant to add a new entry.'}
                                    </DialogDescription>
                                </DialogHeader>
                                 <form ref={formRef} onSubmit={handleSaveRentEntry} className="grid gap-4 py-4">
                                   {!editingRentEntry && (
                                     <>
                                      <div className="space-y-2">
                                        <Label>Find Saved Tenant</Label>
                                        <Popover open={isTenantFinderOpen} onOpenChange={setIsTenantFinderOpen}>
                                          <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={isTenantFinderOpen} className="w-full justify-between">
                                              {selectedHistoricalTenant ? `Selected: ${selectedHistoricalTenant.name}` : "Select a past tenant..."}
                                              <div className="flex items-center">
                                                <Badge variant="secondary" className="mr-2">{historicalTenants.length}</Badge>
                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50"/>
                                              </div>
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                              <CommandInput placeholder="Search tenant..." />
                                              <CommandEmpty>No tenant found.</CommandEmpty>
                                              <CommandList>
                                                <CommandGroup>
                                                  {historicalTenants.map((tenant) => (
                                                    <CommandItem
                                                      key={tenant.uniqueId}
                                                      value={`${tenant.name} ${tenant.property}`}
                                                      onSelect={() => handleSelectHistoricalTenant(tenant)}
                                                      className="flex justify-between items-center"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={tenant.avatar} />
                                                                <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{tenant.name} - <span className="text-muted-foreground">{tenant.property}</span></div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Last seen: {months[tenant.lastSeen.month].substring(0,3)} {tenant.lastSeen.year} &middot; {tenant.rent.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).replace('BDT', '৳')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                  ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      {selectedHistoricalTenant && (
                                        <Card className="bg-secondary/50 relative">
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={handleClearSelectedTenant}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Clear selection</span>
                                            </Button>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">Tenant Preview</CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-1">
                                                <p><strong>Name:</strong> {selectedHistoricalTenant.name}</p>
                                                <p><strong>Apartment:</strong> {selectedHistoricalTenant.property}</p>
                                                <p><strong>Rent:</strong> {selectedHistoricalTenant.rent.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}</p>
                                            </CardContent>
                                        </Card>
                                      )}
                                     </>
                                   )}
                                   <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" name="name" defaultValue={editingRentEntry?.name} placeholder="e.g., John Doe" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="property">Flat</Label>
                                        <Input id="property" name="property" defaultValue={editingRentEntry?.property} placeholder="e.g., Flat-1" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentDate">Date</Label>
                                        <Input id="paymentDate" name="paymentDate" type="date" defaultValue={editingRentEntry?.paymentDate ? format(parseISO(editingRentEntry.paymentDate), 'yyyy-MM-dd') : ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="collectedBy">Collect by</Label>
                                        <Input id="collectedBy" name="collectedBy" defaultValue={editingRentEntry?.collectedBy} placeholder="e.g., Admin" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount</Label>
                                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingRentEntry?.rent} placeholder="0.00" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" defaultValue={editingRentEntry?.status || 'Pending'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Overdue">Overdue</SelectItem>
                                        </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit">Save Entry</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredTenantsForMonth.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={selectedRentEntryIds.length === filteredTenantsForMonth.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedRentEntryIds(filteredTenantsForMonth.map(t => t.id));
                                        } else {
                                            setSelectedRentEntryIds([]);
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Flat</TableHead>
                            <TableHead className="hidden sm:table-cell">Month</TableHead>
                            <TableHead className="hidden sm:table-cell">Year</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Collect by</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTenantsForMonth.map((entry) => (
                            <TableRow key={entry.id} data-state={selectedRentEntryIds.includes(entry.id) && "selected"}>
                              <TableCell>
                                  <Checkbox
                                      checked={selectedRentEntryIds.includes(entry.id)}
                                      onCheckedChange={(checked) => {
                                          setSelectedRentEntryIds(prev => 
                                              checked ? [...prev, entry.id] : prev.filter(id => id !== entry.id)
                                          );
                                      }}
                                  />
                              </TableCell>
                              <TableCell className="font-medium">{entry.name}</TableCell>
                              <TableCell><Badge variant="outline">{entry.property}</Badge></TableCell>
                              <TableCell className="hidden sm:table-cell">{months[entry.month]}</TableCell>
                              <TableCell className="hidden sm:table-cell">{entry.year}</TableCell>
                              <TableCell>{entry.paymentDate ? format(parseISO(entry.paymentDate), "dd MMM yyyy") : '-'}</TableCell>
                              <TableCell>{entry.collectedBy || '-'}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadge(entry.status)} variant="outline">
                                  {getStatusIcon(entry.status)}
                                  {entry.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.rent.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditRentEntry(entry)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                   <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the rent entry for this tenant for {months[entry.month]} {entry.year}.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteRentEntry(entry.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted-foreground p-10">No rent collection data for {month} {year}.</div>
                    )}
                  </CardContent>
                  {filteredTenantsForMonth.length > 0 && (
                     <CardFooter className="bg-primary/90 text-primary-foreground font-bold text-lg p-4 mt-4 rounded-b-lg flex justify-between">
                        <span>Total for {month} {year}</span>
                        <span>{totalRentCollected.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}</span>
                     </CardFooter>
                  )}
                </Card>
              </TabsContent>
              <TabsContent value="expenses">
                <Card className="mt-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Expenses - {month} {year}</CardTitle>
                      <CardDescription>Property-related expenses for {month} {year}.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                       {selectedExpenseIds.length > 0 && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Selected ({selectedExpenseIds.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {selectedExpenseIds.length} selected expenses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMassDeleteExpenses}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                         <Dialog open={isExpenseDialogOpen} onOpenChange={handleExpenseOpenChange}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2" onClick={() => setEditingExpense(null)}>
                              <PlusCircle className="h-4 w-4" />
                              Add Expense
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                              <DialogDescription>
                                Fill in the form below to {editingExpense ? 'update the' : 'add a new'} expense.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveExpense} className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" name="category" defaultValue={editingExpense?.category} placeholder="e.g., Maintenance" required />
                              </div>
                               <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0.00" required />
                              </div>
                               <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={editingExpense?.status || 'Pending'}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Reimbursed">Reimbursed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={editingExpense?.description} placeholder="Describe the expense..." />
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                   <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save Expense</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredExpenses.length > 0 ? (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                               <TableHead className="w-10">
                                    <Checkbox
                                        checked={selectedExpenseIds.length === filteredExpenses.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedExpenseIds(filteredExpenses.map(e => e.id));
                                            } else {
                                                setSelectedExpenseIds([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredExpenses.map((expense) => (
                              <TableRow key={expense.id} data-state={selectedExpenseIds.includes(expense.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedExpenseIds.includes(expense.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedExpenseIds(prev => 
                                                checked ? [...prev, expense.id] : prev.filter(id => id !== expense.id)
                                            );
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{expense.category}</div>
                                    <div className="text-sm text-muted-foreground hidden sm:block">{expense.description}</div>
                                </TableCell>
                                <TableCell>{expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}</TableCell>
                                <TableCell>
                                  <Badge className={getExpenseStatusBadge(expense.status)}>
                                    {expense.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                     <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditExpense(expense)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                     </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This action cannot be undone. This will permanently delete the expense.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex justify-end items-center mt-4 pt-4 border-t">
                          <div className="text-lg font-bold flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <span>Total: {totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-10">No expense data for {month} {year}.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 space-y-6">
                <div className="text-center">
                    <h3 className="text-2xl font-bold tracking-tight">Financial Overview - {month} {year}</h3>
                    <p className="text-muted-foreground">A summary of your income and expenses for the month.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Rent Expected</CardTitle>
                            <Banknote className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
                                {totalRentExpected.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">
                                {totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Result</CardTitle>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${netResult >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {netResult >= 0 ? '+' : ''}{netResult.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card className="bg-secondary">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-around items-center text-center sm:text-left">
                        <div className="p-2">
                            <p className="text-sm text-secondary-foreground font-semibold">Collection Rate</p>
                            <p className="text-2xl font-bold text-primary">{collectionRate.toFixed(1)}%</p>
                        </div>
                        <div className="border-t sm:border-t-0 sm:border-l border-border w-full sm:w-auto h-auto sm:h-12 my-2 sm:my-0"></div>
                        <div className="p-2">
                            <p className="text-sm text-secondary-foreground font-semibold">Available for Deposit</p>
                            <p className="text-2xl font-bold text-success">{amountForDeposit.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).replace('BDT', '৳')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

    