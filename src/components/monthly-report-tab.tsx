"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DollarSign, AlertTriangle, Users, TrendingUp } from "lucide-react"

const monthlyData = {
  "2024-07": {
    revenue: 14240,
    expenses: 750.75,
    netProfit: 13489.25,
    occupancy: 95,
    overdueTenants: 1,
    overdueAmount: 1400
  },
  "2024-06": {
    revenue: 13800,
    expenses: 1200.50,
    netProfit: 12599.50,
    occupancy: 92,
    overdueTenants: 2,
    overdueAmount: 2650
  },
  "2024-05": {
    revenue: 14000,
    expenses: 980,
    netProfit: 13020,
    occupancy: 93,
    overdueTenants: 0,
    overdueAmount: 0
  },
}

const months = [
  { value: "2024-07", label: "July 2024" },
  { value: "2024-06", label: "June 2024" },
  { value: "2024-05", label: "May 2024" },
]

export function MonthlyReportTab() {
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const data = monthlyData[selectedMonth as keyof typeof monthlyData];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Report</CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data.revenue.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.occupancy}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data.netProfit.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data.overdueAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{data.overdueTenants} tenant(s) overdue</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
