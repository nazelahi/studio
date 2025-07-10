"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyOverviewTab } from "@/components/monthly-overview-tab"
import { TenantsTab } from "@/components/tenants-tab"

export default function DashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tenants">Tenants</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <MonthlyOverviewTab />
      </TabsContent>
      <TabsContent value="tenants">
        <TenantsTab />
      </TabsContent>
    </Tabs>
  )
}
