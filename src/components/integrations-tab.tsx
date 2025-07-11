
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

function GoogleDriveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
      <path fill="#4285f4" d="M21.99 11.5H10L15.25 21l6.74-9.5z" />
      <path fill="#34a853" d="M10 11.5l-5.25 9.5h10.5z" />
      <path fill="#fbbc04" d="m15.25 21 5.25 9.5H9.5z" />
      <path fill="#ea4335" d="M15.25 1h-10.5l5.25 9.5z" />
      <path fill="#c5221f" d="M22.5 1H12.25l-2.25 4.75L22.5 15z" />
      <path fill="#1aa260" d="M4.75 21 10 11.5 1 6.25z" />
    </svg>
  );
}

export function IntegrationsTab() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSynced, setLastSynced] = React.useState("Never");

  const handleConnect = () => {
    // This is a placeholder for the actual OAuth flow
    toast({ title: "Connecting to Google Drive...", description: "Please follow the authentication steps." });
    setTimeout(() => {
        setIsConnected(true);
        toast({ title: "Success!", description: "Successfully connected to Google Drive." });
    }, 2000);
  }

  const handleSync = () => {
    setIsSyncing(true);
    toast({ title: "Syncing data...", description: "This may take a few moments."});
    setTimeout(() => {
        const now = new Date();
        setLastSynced(now.toLocaleString());
        setIsSyncing(false);
        toast({ title: "Sync Complete", description: "Your data has been synced with Google Drive." });
    }, 3000);
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
                <GoogleDriveIcon className="h-8 w-8" />
                <div>
                    <CardTitle>Google Drive Sync</CardTitle>
                    <CardDescription>
                        Back up your tenant and financial data to a Google Sheet.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <fieldset disabled={!isAdmin} className="group">
            <CardContent className="space-y-4 group-disabled:opacity-50">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                        <p className="mb-4 text-sm text-muted-foreground">Connect your Google Account to enable sync.</p>
                        <Button onClick={handleConnect}>
                            Connect to Google Drive
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-secondary rounded-md text-sm">
                            <p className="font-medium text-secondary-foreground">Status: <span className="text-success font-bold">Connected</span></p>
                            <p className="text-muted-foreground">Last synced: {lastSynced}</p>
                        </div>
                        <Button onClick={handleSync} disabled={isSyncing} className="w-full">
                            {isSyncing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            {isSyncing ? "Syncing..." : "Sync Now"}
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                Changes will be synced to a file named "RentFlow Backup" in your Google Drive root folder.
            </CardFooter>
        </fieldset>
      </Card>
    </div>
  );
}
