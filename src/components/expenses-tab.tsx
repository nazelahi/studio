"use client"
import type { Expense } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from "lucide-react"

const expensesData: Expense[] = [
  { id: "EXP001", date: "2024-07-15", category: "Maintenance", amount: 150.00, description: "Plumbing repair at Unit 101", status: "Reimbursed" },
  { id: "EXP002", date: "2024-07-12", category: "Utilities", amount: 75.50, description: "Common area electricity", status: "Pending" },
  { id: "EXP003", date: "2024-07-10", category: "Landscaping", amount: 200.00, description: "Monthly gardening service", status: "Reimbursed" },
  { id: "EXP004", date: "2024-07-05", category: "Supplies", amount: 45.25, description: "Cleaning supplies", status: "Pending" },
  { id: "EXP005", date: "2024-06-28", category: "Repairs", amount: 350.00, description: "Roof leak fix at Unit 204", status: "Reimbursed" },
]

export function ExpensesTab() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Expense Management</CardTitle>
          <CardDescription>Track and manage all property-related expenses.</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Expense
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expensesData.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell className="font-medium">${expense.amount.toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">{expense.description}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      expense.status === "Reimbursed" ? "bg-success text-success-foreground hover:bg-success/80"
                        : "bg-warning text-warning-foreground hover:bg-warning/80"
                    }
                  >
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
