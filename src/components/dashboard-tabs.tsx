"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { RentRollTab } from "./rent-roll-tab"
import { ExpensesTab } from "./expenses-tab"
import { MonthlyReportTab } from "./monthly-report-tab"

export default function DashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="rent-roll">Rent Roll</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="monthly-report">Monthly Report</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewTab />
      </TabsContent>
      <TabsContent value="rent-roll">
        <RentRollTab />
      </TabsContent>
      <TabsContent value="expenses">
        <ExpensesTab />
      </TabsContent>
      <TabsContent value="monthly-report">
        <MonthlyReportTab />
      </TabsContent>
    </Tabs>
  )
}
