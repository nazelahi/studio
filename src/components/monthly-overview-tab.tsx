"use client"

import * as React from "react"
import type { Tenant, Expense } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign } from "lucide-react"

const allTenantsData: Tenant[] = [
  { id: "T001", name: "Alice Johnson", property: "Apt 101, Bldg A", rent: 1200, dueDate: "2024-08-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
  { id: "T002", name: "Bob Smith", property: "Apt 102, Bldg A", rent: 1250, dueDate: "2024-08-01", status: "Pending", avatar: "https://placehold.co/40x40.png" },
  { id: "T003", name: "Charlie Brown", property: "Apt 201, Bldg B", rent: 1400, dueDate: "2024-08-01", status: "Overdue", avatar: "https://placehold.co/40x40.png" },
  { id: "T004", name: "Diana Prince", property: "Apt 202, Bldg B", rent: 1450, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
  { id: "T005", name: "Ethan Hunt", property: "Apt 301, Bldg C", rent: 1600, dueDate: "2024-07-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
  { id: "T006", name: "Frank Castle", property: "Apt 101, Bldg A", rent: 1200, dueDate: "2024-06-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
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

const getStatusBadge = (status: Tenant["status"]) => {
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

export function MonthlyOverviewTab() {
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = React.useState(months[currentMonthIndex]);

  const filteredTenants = allTenantsData.filter(tenant => {
    const tenantMonth = new Date(tenant.dueDate).getMonth();
    return tenantMonth === months.indexOf(selectedMonth);
  });

  const filteredExpenses = allExpensesData.filter(expense => {
    const expenseMonth = new Date(expense.date).getMonth();
    return expenseMonth === months.indexOf(selectedMonth);
  });

  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <Tabs value={selectedMonth} onValueChange={setSelectedMonth} className="w-full pt-4">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
        {months.map(month => (
          <TabsTrigger key={month} value={month}>{month.substring(0,3)}</TabsTrigger>
        ))}
      </TabsList>
      {months.map(month => (
        <TabsContent key={month} value={month}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rent Roll - {month}</CardTitle>
                <CardDescription>Rent payment status for {month}.</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTenants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Status</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-10">No rent collection data for {month}.</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expenses - {month}</CardTitle>
                 <CardDescription>Property-related expenses for {month}.</CardDescription>
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
                  <div className="text-center text-muted-foreground py-10">No expense data for {month}.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
