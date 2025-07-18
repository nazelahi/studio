
"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from "@/context/app-context"

export default function LabelsSettingsTab() {
  const { settings, setSettings } = useAppContext();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setSettings((prev: any) => {
        let newState = { ...prev };
        let currentLevel: any = newState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel[keys[i]] = { ...currentLevel[keys[i]] };
            currentLevel = currentLevel[keys[i]];
        }
        
        currentLevel[keys[keys.length - 1]] = value;
        return newState;
    });
  };

  const handleSaveAppSettings = () => {
    toast({
        title: 'Local Settings Saved',
        description: 'Your changes have been saved to this browser.',
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Page Labels</CardTitle>
            <CardDescription>Customize the text for various sections and tabs. Changes are saved to your browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
               <h3 className="font-medium">Dashboard Navigation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nav_dashboard">Dashboard Nav Link</Label>
                        <Input id="nav_dashboard" name="page_dashboard.nav_dashboard" defaultValue={settings.page_dashboard.nav_dashboard} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nav_settings">Settings Nav Link</Label>
                        <Input id="nav_settings" name="page_dashboard.nav_settings" defaultValue={settings.page_dashboard.nav_settings} onChange={handleInputChange} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium">Dashboard Tab Names</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tab_overview">Overview Tab</Label>
                        <Input id="tab_overview" name="tabNames.overview" defaultValue={settings.tabNames.overview} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tab_tenants">Tenants Tab</Label>
                        <Input id="tab_tenants" name="tabNames.tenants" defaultValue={settings.tabNames.tenants} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tab_work">Work Tab</Label>
                        <Input id="tab_work" name="tabNames.work" defaultValue={settings.tabNames.work} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tab_reports">Reports Tab</Label>
                        <Input id="tab_reports" name="tabNames.reports" defaultValue={settings.tabNames.reports} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tab_zakat">Zakat Tab</Label>
                        <Input id="tab_zakat" name="tabNames.zakat" defaultValue={settings.tabNames.zakat} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tab_documents">Documents Tab</Label>
                        <Input id="tab_documents" name="tabNames.documents" defaultValue={settings.tabNames.documents} onChange={handleInputChange} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium">Overview Page Sections</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="overview-financial-title">{settings.page_settings.overview_settings.financial_title_label}</Label>
                        <Input id="overview-financial-title" name="page_overview.financial_overview_title" defaultValue={settings.page_overview.financial_overview_title} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="overview-financial-desc">{settings.page_settings.overview_settings.financial_description_label}</Label>
                        <Input id="overview-financial-desc" name="page_overview.financial_overview_description" defaultValue={settings.page_overview.financial_overview_description} onChange={handleInputChange} />
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveAppSettings}>Save Local Settings</Button>
        </CardFooter>
    </Card>
  )
}
