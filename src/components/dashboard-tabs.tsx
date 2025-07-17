
"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyOverviewTab } from "@/components/monthly-overview-tab"
import { ContactsTab } from "@/components/contacts-tab"
import { ReportsTab } from "@/components/reports-tab"
import { ZakatTab } from "@/components/zakat-tab"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/context/settings-context"
import { WorkDetailsTab } from "./work-details-tab"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { DocumentsTab } from "./documents-tab"

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
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="hidden md:grid w-full grid-cols-6">
            <TabsTrigger value="overview">{settings.tabNames.overview}</TabsTrigger>
            <TabsTrigger value="contacts">{settings.tabNames.tenants}</TabsTrigger>
            <TabsTrigger value="work">{settings.tabNames.work}</TabsTrigger>
            <TabsTrigger value="documents">{settings.tabNames.documents}</TabsTrigger>
            <TabsTrigger value="reports">{settings.tabNames.reports}</TabsTrigger>
            <TabsTrigger value="zakat">{settings.tabNames.zakat}</TabsTrigger>
          </TabsList>
          <div className="hidden md:flex items-center gap-2 ml-4">
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

        <div className="md:hidden flex gap-2 mb-4">
            <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
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


        <TabsContent value="overview">
          <MonthlyOverviewTab year={year} mobileSelectedMonth={selectedMonth} />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>
        <TabsContent value="work">
          <WorkDetailsTab year={year} />
        </TabsContent>
        <TabsContent value="documents">
            <DocumentsTab />
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
