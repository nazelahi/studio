"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function WhatsappTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Automation</CardTitle>
          <CardDescription>
            Configure automatic rent reminders via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <Button>Save Settings</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Manual Message</CardTitle>
          <CardDescription>
            Send a one-off message to a specific tenant or group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Select>
                    <SelectTrigger id="recipient">
                        <SelectValue placeholder="Select a tenant or group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tenants</SelectItem>
                        <SelectItem value="pending">Tenants with Pending Rent</SelectItem>
                        <SelectItem value="overdue">Tenants with Overdue Rent</SelectItem>
                        <SelectItem value="t001">Alice Johnson</SelectItem>
                        <SelectItem value="t002">Bob Smith</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="manual-message">Message</Label>
                <Textarea id="manual-message" placeholder="Type your message here..." rows={5}/>
            </div>
        </CardContent>
        <CardFooter>
            <Button>Send Message</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
