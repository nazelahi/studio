
"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyOverviewTab } from "@/components/monthly-overview-tab"
import { TenantsTab } from "@/components/tenants-tab"
import { IntegrationsTab } from "@/components/integrations-tab"
import { ReportsTab } from "@/components/reports-tab"
import { ZakatTab } from "@/components/zakat-tab"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/context/settings-context"

export default function DashboardTabs() {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
  
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-muted-foreground">Year:</span>
           <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="overview">{settings.tabNames.overview}</TabsTrigger>
          <TabsTrigger value="tenants">{settings.tabNames.tenants}</TabsTrigger>
          <TabsTrigger value="integrations">{settings.tabNames.integrations}</TabsTrigger>
          <TabsTrigger value="reports">{settings.tabNames.reports}</TabsTrigger>
          <TabsTrigger value="zakat">{settings.tabNames.zakat}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <MonthlyOverviewTab year={parseInt(selectedYear)} />
        </TabsContent>
        <TabsContent value="tenants">
          <TenantsTab />
        </TabsContent>
        <TabsContent value="integrations">
            <IntegrationsTab />
        </TabsContent>
         <TabsContent value="reports">
            <ReportsTab year={parseInt(selectedYear)} />
        </TabsContent>
         <TabsContent value="zakat">
            <ZakatTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
