"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { RentRollTab } from "./rent-roll-tab"
import { ExpensesTab } from "./expenses-tab"

export default function DashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="rent-roll">Rent Roll</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
    </Tabs>
  )
}
