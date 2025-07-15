
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
import { RefreshCw, HardDriveDownload, HardDriveUpload, Database, Trash2, LoaderCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useData } from "@/context/data-context";
import { saveAs } from "file-saver";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { clearMonthlyDataAction, clearYearlyDataAction, generateSqlBackupAction } from "@/app/actions/data";
import { useProtection } from "@/context/protection-context";

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

export function IntegrationsTab() {
  const { isAdmin } = useAuth();
  const { getAllData, restoreAllData } = useData();
  const { toast } = useToast();
  const { withProtection } = useProtection();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSqlPending, startSqlTransition] = React.useTransition();
  const [isClearPending, startClearTransition] = React.useTransition();

  const currentYear = new Date().getFullYear();
  const [clearYear, setClearYear] = React.useState(currentYear.toString());
  const [clearMonth, setClearMonth] = React.useState<string | undefined>(undefined);
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const handleBackup = () => {
    setIsProcessing(true);
    toast({ title: "Generating backup...", description: "This may take a few moments." });

    setTimeout(() => {
      try {
        const currentData = getAllData();
        const backupPayload = {
          timestamp: new Date().toISOString(),
          data: currentData,
        };
        const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json;charset=utf-8" });
        
        const date = new Date().toISOString().split('T')[0];
        saveAs(blob, `rentflow_backup_${date}.json`);
        
        toast({ title: "Backup Complete", description: "Your data has been downloaded as a JSON file." });
      } catch (e) {
        toast({ title: "Backup Failed", description: "Could not create backup file. Check console for errors.", variant: "destructive" });
        console.error("Backup error:", e);
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleSqlBackup = (e: React.MouseEvent) => {
    withProtection(() => {
        startSqlTransition(async () => {
            toast({ title: "Generating SQL backup...", description: "This may take a few moments." });
            const result = await generateSqlBackupAction();
            if (result.error) {
                toast({ title: "SQL Backup Failed", description: result.error, variant: "destructive" });
            } else if (result.success && result.data) {
                const blob = new Blob([result.data], { type: "application/sql;charset=utf-8" });
                const date = new Date().toISOString().split('T')[0];
                saveAs(blob, `rentflow_sql_backup_${date}.sql`);
                toast({ title: "SQL Backup Complete", description: "Your data has been downloaded as a .sql file." });
            }
        });
    }, e);
  };


  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: "Restoring data...", description: "Please wait while we process the backup file." });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backupPayload = JSON.parse(text);

        if (backupPayload && backupPayload.data && backupPayload.data.tenants && backupPayload.data.expenses && backupPayload.data.rentData) {
          restoreAllData(backupPayload.data, toast);
          // The restoreAllData function will handle toast and reload
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (err: any) {
        toast({ title: "Restore Failed", description: err.message || "The file could not be read or is corrupted.", variant: "destructive" });
        console.error("Restore error:", err);
      } finally {
        setIsProcessing(false);
        if(event.target) event.target.value = ''; // Reset file input
      }
    };
    reader.onerror = () => {
        toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
        setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleClearData = (e: React.MouseEvent) => {
    withProtection(() => {
        startClearTransition(async () => {
            const formData = new FormData();
            formData.set('year', clearYear);

            if (clearMonth) { // Clear monthly data
                formData.set('month', clearMonth);
                const result = await clearMonthlyDataAction(formData);
                if (result.error) {
                    toast({ title: 'Error Clearing Data', description: result.error, variant: 'destructive' });
                } else {
                    toast({ title: 'Data Cleared', description: result.message, variant: 'destructive' });
                }
            } else { // Clear yearly data
                const result = await clearYearlyDataAction(formData);
                if (result.error) {
                    toast({ title: 'Error Clearing Data', description: result.error, variant: 'destructive' });
                } else {
                    toast({ title: 'Data Cleared', description: result.message, variant: 'destructive' });
                }
            }
        });
    }, e)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Automation</CardTitle>
          <CardDescription>
            Configure automatic rent reminders via WhatsApp. (UI Only)
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                placeholder="e.g., Hi {tenantName}, a friendly reminder that your rent of ৳{rentAmount} for {property} is due on {dueDate}."
                defaultValue="Hi {tenantName}, just a friendly reminder that your rent of ৳{rentAmount} for your unit at {property} is due on {dueDate}. Thank you!"
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

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>File Backup & Restore</CardTitle>
                        <CardDescription>
                            Save a backup of all data to your computer, or restore it from a file.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <fieldset disabled={!isAdmin} className="group">
                <CardContent className="space-y-4 group-disabled:opacity-50">
                     <div className="space-y-4">
                        <div className="p-3 bg-secondary rounded-md text-sm">
                            <p className="font-medium text-secondary-foreground">Status: <span className="text-primary font-bold">Ready</span></p>
                            <p className="text-muted-foreground">Save your data to a JSON or SQL file.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button onClick={handleBackup} disabled={isProcessing} className="w-full">
                                {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                                {isProcessing ? "Processing..." : "JSON Backup"}
                            </Button>
                             <Button onClick={handleSqlBackup} disabled={isSqlPending} className="w-full">
                                {isSqlPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                                SQL Backup
                            </Button>
                        </div>
                        <div className="grid grid-cols-1">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" disabled={isProcessing} className="w-full">
                                    <HardDriveUpload className="mr-2 h-4 w-4" />
                                    Restore from JSON
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. Restoring from a file will overwrite all current tenant and financial data with the data from the backup.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRestoreClick} className="bg-destructive hover:bg-destructive/90">Choose File & Restore</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                        </div>
                         <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="application/json"
                            onChange={handleFileChange}
                         />
                    </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                    This feature lets you save a complete snapshot of your data. Keep your backup file in a safe place.
                </CardFooter>
            </fieldset>
          </Card>

          <Card>
             <CardHeader>
                <div className="flex items-center gap-3">
                    <Trash2 className="h-8 w-8 text-destructive" />
                    <div>
                        <CardTitle>Clear Data</CardTitle>
                        <CardDescription>
                            Permanently delete rent and expense data for a specific period.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="clear-year">Year</Label>
                        <Select value={clearYear} onValueChange={setClearYear}>
                            <SelectTrigger id="clear-year"><SelectValue /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="clear-month">Month (Optional)</Label>
                        <Select value={clearMonth} onValueChange={(val) => setClearMonth(val === 'all' ? undefined : val)}>
                            <SelectTrigger id="clear-month"><SelectValue placeholder="All Months" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months (Entire Year)</SelectItem>
                                {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full" disabled={isClearPending}>
                            {isClearPending ? <LoaderCircle className="mr-2 animate-spin"/> : <Trash2 className="mr-2"/>}
                            Clear Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete all rent and expense records for <span className="font-bold text-destructive">{clearMonth ? `${months[parseInt(clearMonth)]} ${clearYear}` : `the entire year ${clearYear}`}</span>. 
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                         <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearData} disabled={isClearPending}>
                               {isClearPending && <LoaderCircle className="mr-2 animate-spin"/>}
                                Yes, Clear Data
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                Use with caution. Deleting data is permanent and cannot be recovered without a backup file.
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
