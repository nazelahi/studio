
"use client"
import * as React from "react"
import type { Tenant } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const initialTenantsData: Tenant[] = [
  { id: "T001", name: "Alice Johnson", property: "Apt 101, Bldg A", rent: 1200, dueDate: "2024-08-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
  { id: "T002", name: "Bob Smith", property: "Apt 102, Bldg A", rent: 1250, dueDate: "2024-08-01", status: "Pending", avatar: "https://placehold.co/40x40.png" },
  { id: "T003", name: "Charlie Brown", property: "Apt 201, Bldg B", rent: 1400, dueDate: "2024-08-01", status: "Overdue", avatar: "https://placehold.co/40x40.png" },
  { id: "T004", name: "Diana Prince", property: "Apt 202, Bldg B", rent: 1450, dueDate: "2024-08-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
  { id: "T005", name: "Ethan Hunt", property: "Apt 301, Bldg C", rent: 1600, dueDate: "2024-08-01", status: "Paid", avatar: "https://placehold.co/40x40.png" },
]

export function RentRollTab() {
  const [tenantsData, setTenantsData] = React.useState<Tenant[]>(initialTenantsData)
  const { toast } = useToast()

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

  const handleRecordPayment = (tenantId: string) => {
    setTenantsData(prevTenants =>
      prevTenants.map(tenant =>
        tenant.id === tenantId ? { ...tenant, status: 'Paid' } : tenant
      )
    );
    const tenant = tenantsData.find(t => t.id === tenantId);
    if(tenant) {
        toast({
            title: "Payment Recorded",
            description: `Rent payment for ${tenant.name} has been recorded as Paid.`
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent Roll</CardTitle>
        <CardDescription>Current status of rent payments for this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead className="hidden md:table-cell">Property</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenantsData.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={tenant.avatar} alt={tenant.name} data-ai-hint="person avatar"/>
                      <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{tenant.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{tenant.property}</TableCell>
                <TableCell>${tenant.rent.toFixed(2)}</TableCell>
                <TableCell>{tenant.dueDate}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(tenant.status)}>
                    {tenant.status}
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
                      <DropdownMenuItem>Send Reminder</DropdownMenuItem>
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
      </CardContent>
    </Card>
  )
}
