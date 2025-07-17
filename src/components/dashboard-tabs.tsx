
"use client"

import * as React from "react"
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/context/settings-context"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardHeader } from "./ui/card"

interface DashboardTabsProps {
  year: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  years: string[];
}

const LoadingSkeleton = () => (
  <Card className="mt-4">
    <CardHeader>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-40 w-full" />
    </CardContent>
  </Card>
)

const MonthlyOverviewTab = dynamic(() => import('@/components/monthly-overview-tab').then(mod => mod.MonthlyOverviewTab), {
  loading: () => <LoadingSkeleton />,
});
const ContactsTab = dynamic(() => import('@/components/contacts-tab').then(mod => mod.ContactsTab), {
  loading: () => <LoadingSkeleton />,
});
const WorkDetailsTab = dynamic(() => import('@/components/work-details-tab').then(mod => mod.WorkDetailsTab), {
  loading: () => <LoadingSkeleton />,
});
const DocumentsTab = dynamic(() => import('@/components/documents-tab').then(mod => mod.DocumentsTab), {
  loading: () => <LoadingSkeleton />,
});
const ReportsTab = dynamic(() => import('@/components/reports-tab').then(mod => mod.ReportsTab), {
  loading: () => <LoadingSkeleton />,
});
const ZakatTab = dynamic(() => import('@/components/zakat-tab').then(mod => mod.ZakatTab), {
  loading: () => <LoadingSkeleton />,
});


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
          {activeTab === 'overview' && <MonthlyOverviewTab year={year} mobileSelectedMonth={selectedMonth} />}
        </TabsContent>
        <TabsContent value="contacts">
          {activeTab === 'contacts' && <ContactsTab />}
        </TabsContent>
        <TabsContent value="work">
          {activeTab === 'work' && <WorkDetailsTab year={year} />}
        </TabsContent>
        <TabsContent value="documents">
            {activeTab === 'documents' && <DocumentsTab />}
        </TabsContent>
         <TabsContent value="reports">
            {activeTab === 'reports' && <ReportsTab year={year} />}
        </TabsContent>
         <TabsContent value="zakat">
            {activeTab === 'zakat' && <ZakatTab />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
