
"use client"

import * as React from "react"
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSettings } from "@/context/settings-context"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardHeader } from "./ui/card"

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
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


export default function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const { settings } = useSettings();
  const { isAdmin } = useAuth();
  const [currentYear] = React.useState(new Date().getFullYear());

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
        </div>

        <TabsContent value="overview">
          {activeTab === 'overview' && <MonthlyOverviewTab />}
        </TabsContent>
        <TabsContent value="contacts">
          {activeTab === 'contacts' && <ContactsTab />}
        </TabsContent>
        <TabsContent value="work">
          {activeTab === 'work' && <WorkDetailsTab year={currentYear} />}
        </TabsContent>
        <TabsContent value="documents">
            {activeTab === 'documents' && <DocumentsTab />}
        </TabsContent>
         <TabsContent value="reports">
            {activeTab === 'reports' && <ReportsTab year={currentYear} />}
        </TabsContent>
         <TabsContent value="zakat">
            {activeTab === 'zakat' && <ZakatTab />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
