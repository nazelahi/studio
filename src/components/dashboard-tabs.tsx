

"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyOverviewTab } from "@/components/monthly-overview-tab"
import { ContactsTab } from "@/components/contacts-tab"
import { IntegrationsTab } from "@/components/integrations-tab"
import { ReportsTab } from "@/components/reports-tab"
import { ZakatTab } from "@/components/zakat-tab"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/context/settings-context"
import { WorkDetailsTab } from "./work-details-tab"

interface DashboardTabsProps {
  year: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  years: string[];
}


export default function DashboardTabs({ year, activeTab, onTabChange, selectedYear, onYearChange, years }: DashboardTabsProps) {
  const { settings } = useSettings();

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="hidden md:flex justify-between items-center mb-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">{settings.tabNames.overview}</TabsTrigger>
            <TabsTrigger value="contacts">{settings.tabNames.tenants}</TabsTrigger>
            <TabsTrigger value="work">{settings.tabNames.work}</TabsTrigger>
            <TabsTrigger value="integrations">{settings.tabNames.integrations}</TabsTrigger>
            <TabsTrigger value="reports">{settings.tabNames.reports}</TabsTrigger>
            <TabsTrigger value="zakat">{settings.tabNames.zakat}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm font-medium text-muted-foreground">Year:</span>
            <Select value={selectedYear} onValueChange={onYearChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>

        <TabsContent value="overview">
          <MonthlyOverviewTab year={year} />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>
        <TabsContent value="work">
          <WorkDetailsTab year={year} />
        </TabsContent>
        <TabsContent value="integrations">
            <IntegrationsTab />
        </TabsContent>
         <TabsContent value="reports">
            <ReportsTab year={year} />
        </TabsContent>
         <TabsContent value="zakat">
            <ZakatTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
