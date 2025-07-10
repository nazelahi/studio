
"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, MoreHorizontal, Banknote, ArrowUpCircle, ArrowDownCircle, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

const initialTenants: Tenant[] = [
    { id: "T001", name: "Alice Johnson", email: "alice.j@email.com", phone: "555-1234", property: "Apt 101, Bldg A", rent: 1200, joinDate: "2023-01-15", notes: "Prefers quiet hours after 10 PM.", status: "Paid", avatar: "https://placehold.co/80x80.png" },
    { id: "T002", name: "Bob Smith", email: "bob.smith@email.com", phone: "555-5678", property: "Apt 102, Bldg A", rent: 1250, joinDate: "2022-07-20", notes: "Has a small dog named Sparky.", status: "Pending", avatar: "https://placehold.co/80x80.png" },
    { id: "T003", name: "Charlie Brown", email: "charlie.b@email.com", phone: "555-8765", property: "Apt 201, Bldg B", rent: 1400, joinDate: "2023-08-01", notes: "", status: "Overdue", avatar: "https://placehold.co/80x80.png" },
    { id: "T004", name: "Diana Prince", property: "Apt 202, Bldg B", rent: 1450, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'diana.p@email.com', joinDate: '2024-01-01' },
    { id: "T005", name: "Ethan Hunt", property: "Apt 301, Bldg C", rent: 1600, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'ethan.h@email.com', joinDate: '2024-02-01' },
    { id: "T006", name: "Frank Castle", property: "Apt 101, Bldg A", rent: 1200, dueDate: "2024-06-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'frank.c@email.com', joinDate: '2024-03-01' },
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
        return "bg-success text-success-foreground hover:bg-success/80";
      case "Pending":
        return "bg-warning text-warning-foreground hover:bg-warning/80";
      case "Overdue":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/80";
      default:
        return "";
    }
};

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
  
  React.useEffect(() => {
    setRentData(generateRentDataForYear(initialTenants, year));
  }, [year]);

  const handleRecordPayment = (rentEntryId: string) => {
    setRentData(prevData =>
      prevData.map(entry =>
        entry.id === rentEntryId ? { ...entry, status: "Paid" } : entry
      )
    );
    toast({
      title: "Payment Recorded",
      description: "Rent status has been updated to Paid.",
    });
  };
  
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

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === months.indexOf(selectedMonth) && expenseDate.getFullYear() === year;
  });

  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);

  const amountForDeposit = totalRentCollected - totalExpenses;

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
                  <CardHeader>
                    <CardTitle>Rent Roll - {month} {year}</CardTitle>
                    <CardDescription>Rent payment status for {month} {year}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredTenants.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Rent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTenants.map((tenant) => (
                            <TableRow key={tenant.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={tenant.avatar} alt={tenant.name} data-ai-hint="person avatar"/>
                                    <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{tenant.name}</div>
                                    <div className="text-sm text-muted-foreground">{tenant.property}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>${tenant.rent.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadge(tenant.status)}>
                                  {tenant.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleRecordPayment(tenant.id)} disabled={tenant.status === 'Paid'}>
                                      Record Payment
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted-foreground py-10">No rent collection data for {month} {year}.</div>
                    )}
                  </CardContent>
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
                              <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredExpenses.map((expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>
                                    <div className="font-medium">{expense.category}</div>
                                    <div className="text-sm text-muted-foreground hidden sm:block">{expense.description}</div>
                                </TableCell>
                                <TableCell>${expense.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge className={getExpenseStatusBadge(expense.status)}>
                                    {expense.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditExpense(expense)}>Edit</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)} className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex justify-end items-center mt-4 pt-4 border-t">
                          <div className="text-lg font-bold flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <span>Total: ${totalExpenses.toFixed(2)}</span>
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
            
            <Card className="lg:col-span-3 mt-6">
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Net cash flow for {month} {year}.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="h-8 w-8 text-success" />
                    <div>
                      <span className="text-muted-foreground text-sm">Rent Collected</span>
                      <p className="font-bold text-2xl text-success">${totalRentCollected.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                   <div className="flex items-center gap-3">
                    <ArrowDownCircle className="h-8 w-8 text-destructive" />
                    <div>
                      <span className="text-muted-foreground text-sm">Total Expenses</span>
                      <p className="font-bold text-2xl text-destructive">${totalExpenses.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                 <div className="flex items-center justify-between p-4 bg-card rounded-lg border-2 border-primary">
                   <div className="flex items-center gap-3">
                    <Banknote className="h-8 w-8 text-primary" />
                    <div>
                      <span className="font-bold text-primary text-sm">Bank Deposit</span>
                      <p className={`font-bold text-2xl ${amountForDeposit >= 0 ? 'text-primary' : 'text-destructive'}`}>${amountForDeposit.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
