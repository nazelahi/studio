

"use client"

import React, { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from "@/context/app-context"
import { updatePropertySettingsAction } from "./actions"
import { LoaderCircle } from "lucide-react"

export default function LabelsSettingsTab() {
  const { settings, setSettings, refreshData } = useAppContext();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setSettings(prev => {
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

  const handleSaveLabels = () => {
    startTransition(async () => {
        const formData = new FormData();
        const labelsToSave = {
            page_dashboard: settings.page_dashboard,
            tabNames: settings.tabNames,
        };
        formData.append('page_labels', JSON.stringify(labelsToSave));
        
        const result = await updatePropertySettingsAction(formData);
        if (result.error) {
            toast({ title: 'Error Saving Labels', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Labels Saved', description: 'Your custom labels have been saved to the database.' });
            refreshData();
        }
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Page Labels</CardTitle>
            <CardDescription>Customize the text for various sections and tabs. Changes are saved to the database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
               <h3 className="font-medium">Dashboard Navigation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nav_dashboard">Dashboard Nav Link</Label>
                        <Input id="nav_dashboard" name="page_dashboard.nav_dashboard" value={settings.page_dashboard.nav_dashboard} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nav_settings">Settings Nav Link</Label>
                        <Input id="nav_settings" name="page_dashboard.nav_settings" value={settings.page_dashboard.nav_settings} onChange={handleInputChange} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium">Dashboard Tab Names</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tab_overview">Overview Tab</Label>
                        <Input id="tab_overview" name="tabNames.overview" value={settings.tabNames.overview} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tab_tenants">Tenants Tab</Label>
                        <Input id="tab_tenants" name="tabNames.tenants" value={settings.tabNames.tenants} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tab_work">Work Tab</Label>
                        <Input id="tab_work" name="tabNames.work" value={settings.tabNames.work} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tab_reports">Reports Tab</Label>
                        <Input id="tab_reports" name="tabNames.reports" value={settings.tabNames.reports} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tab_zakat">Zakat Tab</Label>
                        <Input id="tab_zakat" name="tabNames.zakat" value={settings.tabNames.zakat} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tab_documents">Documents Tab</Label>
                        <Input id="tab_documents" name="tabNames.documents" value={settings.tabNames.documents} onChange={handleInputChange} />
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveLabels} disabled={isPending}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
              Save Labels to Database
            </Button>
        </CardFooter>
    </Card>
  )
}
