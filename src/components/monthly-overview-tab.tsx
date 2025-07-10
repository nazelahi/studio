"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, MoreHorizontal, Banknote, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

const initialTenants: Tenant[] = [
    { id: "T001", name: "Alice Johnson", email: "alice.j@email.com", phone: "555-1234", property: "Apt 101, Bldg A", rent: 1200, joinDate: "2023-01-15", notes: "Prefers quiet hours after 10 PM.", status: "Paid", avatar: "https://placehold.co/80x80.png" },
    { id: "T002", name: "Bob Smith", email: "bob.smith@email.com", phone: "555-5678", property: "Apt 102, Bldg A", rent: 1250, joinDate: "2022-07-20", notes: "Has a small dog named Sparky.", status: "Pending", avatar: "https://placehold.co/80x80.png" },
    { id: "T003", name: "Charlie Brown", email: "charlie.b@email.com", phone: "555-8765", property: "Apt 201, Bldg B", rent: 1400, joinDate: "2023-08-01", notes: "", status: "Overdue", avatar: "https://placehold.co/80x80.png" },
    { id: "T004", name: "Diana Prince", property: "Apt 202, Bldg B", rent: 1450, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'diana.p@email.com', joinDate: '2024-01-01' },
    { id: "T005", name: "Ethan Hunt", property: "Apt 301, Bldg C", rent: 1600, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'ethan.h@email.com', joinDate: '2024-02-01' },
    { id: "T006", name: "Frank Castle", property: "Apt 101, Bldg A", rent: 1200, dueDate: "2024-06-01", status: "Paid", avatar: "https://placehold.co/40x40.png", email: 'frank.c@email.com', joinDate: '2024-03-01' },
];

const allExpensesData: Expense[] = [
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
      variant: "default",
    });
  };

  const filteredTenants = rentData.filter(entry => entry.month === months.indexOf(selectedMonth) && entry.year === year);
  
  const totalRentCollected = filteredTenants
    .filter(t => t.status === 'Paid')
    .reduce((acc, t) => acc + t.rent, 0);

  const filteredExpenses = allExpensesData.filter(expense => {
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-2">
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
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Net cash flow for {month} {year}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className="h-6 w-6 text-success" />
                      <span className="text-muted-foreground">Rent Collected</span>
                    </div>
                    <span className="font-bold text-lg text-success">${totalRentCollected.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                      <ArrowDownCircle className="h-6 w-6 text-destructive" />
                      <span className="text-muted-foreground">Total Expenses</span>
                    </div>
                    <span className="font-bold text-lg text-destructive">${totalExpenses.toFixed(2)}</span>
                  </div>
                   <div className="flex items-center justify-between border-t pt-4 mt-4">
                     <div className="flex items-center gap-3">
                      <Banknote className="h-6 w-6 text-primary" />
                      <span className="font-bold text-primary">Bank Deposit</span>
                    </div>
                    <span className={`font-bold text-xl ${amountForDeposit >= 0 ? 'text-primary' : 'text-destructive'}`}>${amountForDeposit.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expenses - {month} {year}</CardTitle>
                   <CardDescription>Property-related expenses for {month} {year}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredExpenses.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
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
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
