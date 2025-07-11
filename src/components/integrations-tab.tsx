
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, HardDriveDownload, HardDriveUpload, Database } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useData } from "@/context/data-context";
import { useRouter } from "next/navigation";

const LOCAL_BACKUP_KEY = "rentflow_local_backup";

export function IntegrationsTab() {
  const { isAdmin } = useAuth();
  const { getAllData, restoreAllData } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [lastBackedUp, setLastBackedUp] = React.useState("Never");

  React.useEffect(() => {
     const backup = localStorage.getItem(LOCAL_BACKUP_KEY);
     if (backup) {
         try {
             const backupData = JSON.parse(backup);
             if(backupData.timestamp) {
                setLastBackedUp(new Date(backupData.timestamp).toLocaleString());
             }
         } catch (e) {
            console.error("Could not parse backup data from localStorage", e);
         }
     }
  }, []);


  const handleBackup = () => {
    setIsBackingUp(true);
    toast({ title: "Backing up data...", description: "This may take a few moments."});
    
    setTimeout(() => {
        try {
            const currentData = getAllData();
            const backupPayload = {
                timestamp: new Date().toISOString(),
                data: currentData
            };
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(backupPayload));

            const now = new Date();
            setLastBackedUp(now.toLocaleString());
            setIsBackingUp(false);
            toast({ title: "Backup Complete", description: "Your data has been backed up to local storage." });
        } catch(e) {
            setIsBackingUp(false);
            toast({ title: "Backup Failed", description: "Could not back up data. Check console for errors.", variant: "destructive" });
            console.error("Backup error:", e);
        }
    }, 1500);
  }
  
  const handleRestore = () => {
    setIsRestoring(true);
    toast({ title: "Restoring data...", description: "This may take a few moments. Do not close this window."});
    
    setTimeout(() => {
        try {
            const backupJson = localStorage.getItem(LOCAL_BACKUP_KEY);
            if (!backupJson) {
                throw new Error("No backup found in local storage.");
            }
            const backupPayload = JSON.parse(backupJson);
            restoreAllData(backupPayload.data);
            
            setIsRestoring(false);
            toast({ title: "Restore Complete", description: "Your data has been restored. The application will now reload." });
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch(e: any) {
            setIsRestoring(false);
            toast({ title: "Restore Failed", description: e.message || "Could not restore data.", variant: "destructive" });
            console.error("Restore error:", e);
        }
    }, 2500);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Automation</CardTitle>
          <CardDescription>
            Configure automatic rent reminders via WhatsApp.
          </CardDescription>
        </CardHeader>
        <fieldset disabled={!isAdmin} className="group">
        <CardContent className="space-y-6 group-disabled:opacity-50">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enable-reminders" className="flex flex-col space-y-1">
              <span>Enable Auto-Reminders</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Send automated reminders to tenants with pending payments.
              </span>
            </Label>
            <Switch id="enable-reminders" />
          </div>
          <div className="space-y-2">
            <Label>Reminder Schedule</Label>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Checkbox id="schedule-before" />
                    <Label htmlFor="schedule-before" className="font-normal">3 days before due date</Label>
                </div>
                 <div className="flex items-center gap-2">
                    <Checkbox id="schedule-on" />
                    <Label htmlFor="schedule-on" className="font-normal">On due date</Label>
                </div>
                 <div className="flex items-center gap-2">
                    <Checkbox id="schedule-after" />
                    <Label htmlFor="schedule-after" className="font-normal">5 days after due date</Label>
                </div>
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="reminder-template">Reminder Message Template</Label>
              <Textarea
                id="reminder-template"
                placeholder="e.g., Hi {tenantName}, a friendly reminder that your rent of ${rentAmount} for {property} is due on {dueDate}."
                defaultValue="Hi {tenantName}, just a friendly reminder that your rent of ${rentAmount} for your unit at {property} is due on {dueDate}. Thank you!"
              />
               <p className="text-xs text-muted-foreground">
                Use placeholders like {"{tenantName}"}, {"{rentAmount}"}, {"{property}"}, and {"{dueDate}"}.
              </p>
            </div>
        </CardContent>
        <CardFooter>
            <Button disabled={!isAdmin}>Save Settings</Button>
        </CardFooter>
        </fieldset>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Local Backup & Restore</CardTitle>
                    <CardDescription>
                        Back up and restore your application data using your browser's local storage.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <fieldset disabled={!isAdmin} className="group">
            <CardContent className="space-y-4 group-disabled:opacity-50">
                 <div className="space-y-4">
                    <div className="p-3 bg-secondary rounded-md text-sm">
                        <p className="font-medium text-secondary-foreground">Status: <span className="text-primary font-bold">Ready</span></p>
                        <p className="text-muted-foreground">Last backed up: {lastBackedUp}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleBackup} disabled={isBackingUp || isRestoring} className="w-full">
                            {isBackingUp ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveUpload className="mr-2 h-4 w-4"/>}
                            {isBackingUp ? "Backing up..." : "Backup Now"}
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" disabled={isBackingUp || isRestoring || lastBackedUp === 'Never'} className="w-full">
                                {isRestoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4" />}
                                {isRestoring ? "Restoring..." : "Restore"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. Restoring from a backup will overwrite all current tenant and financial data in this application with the data from your saved backup.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRestore} className="bg-destructive hover:bg-destructive/90">Restore Backup</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                This feature saves a backup of your data directly in your browser. It is not synced to any cloud service. Clearing your browser data may remove your backup.
            </CardFooter>
        </fieldset>
      </Card>
    </div>
  );
}
