
"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Banknote, ArrowUpCircle, ArrowDownCircle, PlusCircle, Trash2, Pencil, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { format, parseISO } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"

const initialTenants: Tenant[] = [
    { id: "T001", name: "Alice Johnson", email: "alice.j@email.com", phone: "555-1234", property: "Apt 101", rent: 1200, joinDate: "2023-01-15", notes: "Prefers quiet hours after 10 PM.", status: "Paid", avatar: "https://placehold.co/80x80.png" },
    { id: "T002", name: "Bob Smith", email: "bob.smith@email.com", phone: "555-5678", property: "Apt 102", rent: 1250, joinDate: "2022-07-20", notes: "Has a small dog named Sparky.", status: "Pending", avatar: "https://placehold.co/80x80.png" },
    { id: "T003", name: "Charlie Brown", email: "charlie.b@email.com", phone: "555-8765", property: "Apt 201", rent: 1400, joinDate: "2023-08-01", notes: "", status: "Overdue", avatar: "https://placehold.co/80x80.png" },
    { id: "T004", name: "Diana Prince", property: "Apt 202", rent: 1450, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'diana.p@email.com', joinDate: '2024-01-01' },
    { id: "T005", name: "Ethan Hunt", property: "Apt 301", rent: 1600, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'ethan.h@email.com', joinDate: '2024-02-01' },
    { id: "T006", name: "Frank Castle", property: "Apt 101", rent: 1200, dueDate: "2024-06-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'frank.c@email.com', joinDate: '2024-03-01' },
];

const initialExpenses: Expense[] = [
  { id: "EXP001", date: "2024-07-15", category: "Maintenance", amount: 150.00, description: "Plumbing repair at Unit 101", status: "Reimbursed" },
  { id: "EXP002", date: "2024-07-12", category: "Utilities", amount: 75.50, description: "Common area electricity", status: "Pending" },
  { id: "EXP003", date: "2024-08-10", category: "Landscaping", amount: 200.00, description: "Monthly gardening service", status: "Reimbursed" },
  { id: "EXP004", date: "2024-08-05", category: "Supplies", amount: 45.25, description: "Cleaning supplies", status: "Pending" },
  { id: "EXP005", date: "2024-06-28", category: "Repairs", amount: 350.00, description: "Roof leak fix at Unit 204", status: "Reimbursed" },
];

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const generateRentDataForYear = (tenants: Tenant[], year: number): RentEntry[] => {
  const rentData: RentEntry[] = [];
  tenants.forEach(tenant => {
    const joinDate = new Date(tenant.joinDate);
    const startMonth = joinDate.getFullYear() < year ? 0 : joinDate.getMonth();
    
    for (let monthIndex = startMonth; monthIndex < 12; monthIndex++) {
        if (new Date(year, monthIndex, 1) < joinDate) continue;

        const dueDate = new Date(year, monthIndex, 1);
        rentData.push({
            id: `${tenant.id}-${year}-${monthIndex}`,
            tenantId: tenant.id,
            name: tenant.name,
            property: tenant.property,
            rent: tenant.rent,
            dueDate: dueDate.toISOString().split("T")[0],
            status: "Pending", // Default status
            avatar: tenant.avatar,
            year: year,
            month: monthIndex
        });
    }
  });
  return rentData;
};

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

  const [rentData, setRentData] = React.useState<RentEntry[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  const [isRentDialogOpen, setIsRentDialogOpen] = React.useState(false);
  const [editingRentEntry, setEditingRentEntry] = React.useState<RentEntry | null>(null);
  
  React.useEffect(() => {
    setRentData(generateRentDataForYear(initialTenants, year));
  }, [year]);

  // Rent Entry Handlers
  const handleRentOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setEditingRentEntry(null);
    }
    setIsRentDialogOpen(isOpen);
  };
  
  const handleEditRentEntry = (entry: RentEntry) => {
    setEditingRentEntry(entry);
    setIsRentDialogOpen(true);
  };

  const handleDeleteRentEntry = (entryId: string) => {
    setRentData(prevData => prevData.filter(entry => entry.id !== entryId));
    toast({ title: "Rent Entry Deleted", description: "The rent entry has been deleted.", variant: "destructive" });
  };
  
  const handleSaveRentEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rentEntryData = {
        name: formData.get('name') as string,
        property: formData.get('property') as string,
        rent: Number(formData.get('amount')),
        paymentDate: formData.get('paymentDate') as string,
        collectedBy: formData.get('collectedBy') as string,
        status: formData.get('status') as RentEntry['status'],
    };

    if(editingRentEntry) {
        const updatedEntry = { ...editingRentEntry, ...rentEntryData };
        setRentData(rentData.map(e => e.id === editingRentEntry.id ? updatedEntry : e));
        toast({ title: "Rent Entry Updated", description: "The entry has been successfully updated." });
    } else {
        const selectedMonthIndex = months.indexOf(selectedMonth);
        const newEntry: RentEntry = {
            id: `RENT-${Date.now()}`,
            tenantId: `T${String(initialTenants.length + 1).padStart(3, '0')}`,
            avatar: 'https://placehold.co/80x80.png',
            dueDate: new Date(year, selectedMonthIndex, 1).toISOString().split('T')[0],
            year,
            month: selectedMonthIndex,
            ...rentEntryData,
        };
        setRentData([...rentData, newEntry]);
        toast({ title: "Rent Entry Added", description: "The new entry has been successfully added." });
    }

    setIsRentDialogOpen(false);
    setEditingRentEntry(null);
  };

    const handleSyncTenants = () => {
    const selectedMonthIndex = months.indexOf(selectedMonth);
    const tenantsInMonth = rentData.filter(
        (entry) => entry.month === selectedMonthIndex && entry.year === year
    ).map((entry) => entry.tenantId);

    const tenantsToSync = initialTenants.filter(
        (tenant) => !tenantsInMonth.includes(tenant.id)
    );

    if (tenantsToSync.length === 0) {
        toast({
            title: "Already up to date",
            description: "All tenants are already in the rent roll for this month.",
        });
        return;
    }

    const newRentEntries: RentEntry[] = tenantsToSync.map((tenant) => {
        const dueDate = new Date(year, selectedMonthIndex, 1);
        return {
            id: `${tenant.id}-${year}-${selectedMonthIndex}`,
            tenantId: tenant.id,
            name: tenant.name,
            property: tenant.property,
            rent: tenant.rent,
            dueDate: dueDate.toISOString().split("T")[0],
            status: "Pending",
            avatar: tenant.avatar,
            year: year,
            month: selectedMonthIndex,
        };
    });

    setRentData((prevData) => [...prevData, ...newRentEntries]);
    toast({
        title: "Sync Complete",
        description: `${tenantsToSync.length} tenant(s) have been added to the rent roll.`,
    });
};

  // Expense Handlers
  const handleSaveExpense = (event: React.FormEvent<HTMLFormElement>) => {
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
      const updatedExpense = { ...editingExpense, ...expenseData };
      setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
      toast({ title: "Expense Updated", description: "The expense has been successfully updated." });
    } else {
      const newExpense: Expense = {
        id: `EXP${String(expenses.length + 1).padStart(3, '0')}`,
        ...expenseData
      };
      setExpenses([...expenses, newExpense]);
      toast({ title: "Expense Added", description: "The new expense has been successfully added." });
    }

    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };
  
  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast({ title: "Expense Deleted", description: "The expense has been deleted.", variant: "destructive" });
  };
  
  const handleExpenseOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingExpense(null);
    }
    setIsExpenseDialogOpen(isOpen);
  };

  const filteredTenants = rentData.filter(entry => entry.month === months.indexOf(selectedMonth) && entry.year === year);
  
  const totalRentCollected = filteredTenants
    .filter(t => t.status === 'Paid')
    .reduce((acc, t) => acc + t.rent, 0);
  
  const totalRentExpected = filteredTenants.reduce((acc, t) => acc + t.rent, 0);
  const collectionRate = totalRentExpected > 0 ? (totalRentCollected / totalRentExpected) * 100 : 0;

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === months.indexOf(selectedMonth) && expenseDate.getFullYear() === year;
  });

  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  const netResult = totalRentCollected - totalExpenses;
  const amountForDeposit = netResult > 0 ? netResult : 0;

  return (
    <Tabs value={selectedMonth} onValueChange={setSelectedMonth} className="w-full pt-4">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
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
                                        Fill in the form below to {editingRentEntry ? 'update the' : 'add a new'} rent entry.
                                    </DialogDescription>
                                </DialogHeader>
                                 <form onSubmit={handleSaveRentEntry} className="grid gap-4 py-4">
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
                                        <Input id="paymentDate" name="paymentDate" type="date" defaultValue={editingRentEntry?.paymentDate || ''} />
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
                    {filteredTenants.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
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
                          {filteredTenants.map((entry) => (
                            <TableRow key={entry.id}>
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
                              <TableCell>{entry.rent.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}</TableCell>
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
                                            This action cannot be undone. This will permanently delete the rent entry.
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
                  {filteredTenants.length > 0 && (
                     <CardFooter className="bg-primary/90 text-primary-foreground font-bold text-lg p-4 mt-4 rounded-b-lg flex justify-between">
                        <span>Total for {month} {year}</span>
                        <span>{totalRentCollected.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}</span>
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
                     <Dialog open={isExpenseDialogOpen} onOpenChange={handleExpenseOpenChange}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
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
                  </CardHeader>
                  <CardContent>
                    {filteredExpenses.length > 0 ? (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Details</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredExpenses.map((expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>
                                    <div className="font-medium">{expense.category}</div>
                                    <div className="text-sm text-muted-foreground hidden sm:block">{expense.description}</div>
                                </TableCell>
                                <TableCell>{expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}</TableCell>
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
                            <span>Total: {totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}</span>
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
                                {totalRentExpected.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}
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
                                {totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}
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
                                {netResult >= 0 ? '+' : ''}{netResult.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}
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
                            <p className="text-2xl font-bold text-success">{amountForDeposit.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳')}</p>
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

    

    
