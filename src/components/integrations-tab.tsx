
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, HardDriveDownload, HardDriveUpload, Database } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useData } from "@/context/data-context";
import { saveAs } from "file-saver";

export function IntegrationsTab() {
  const { isAdmin } = useAuth();
  const { getAllData, restoreAllData } = useData();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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
                        <p className="text-muted-foreground">This will save a JSON file to your computer.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button onClick={handleBackup} disabled={isProcessing} className="w-full">
                            {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                            {isProcessing ? "Processing..." : "Backup to File"}
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" disabled={isProcessing} className="w-full">
                                <HardDriveUpload className="mr-2 h-4 w-4" />
                                Restore from File
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
    </div>
  );
}
