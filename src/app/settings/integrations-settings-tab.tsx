
"use client"

import React, { useTransition } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { updatePropertySettingsAction } from "./actions"
import { useAppContext } from "@/context/app-context"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { LoaderCircle } from "lucide-react"

export default function IntegrationsSettingsTab() {
  const { settings, setSettings, refreshData } = useAppContext();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleReminderScheduleChange = (checked: boolean, value: string) => {
    setSettings(prev => {
        const schedule = prev.whatsappReminderSchedule || [];
        if (checked) {
            return { ...prev, whatsappReminderSchedule: [...schedule, value] };
        } else {
            return { ...prev, whatsappReminderSchedule: schedule.filter(item => item !== value) };
        }
    });
  };
  
  const handleWhatsappEnabledChange = (checked: boolean) => {
    setSettings(prev => ({...prev, whatsappRemindersEnabled: checked}));
  };

  const handleSaveIntegrationSettings = () => {
    startTransition(async () => {
        const formData = new FormData();
        formData.append('whatsapp_reminders_enabled', settings.whatsappRemindersEnabled ? 'on' : 'off');
        (settings.whatsappReminderSchedule || []).forEach(item => formData.append('whatsapp_reminder_schedule', item));
        formData.append('whatsapp_reminder_template', settings.whatsappReminderTemplate || '');

        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Integration Settings Saved', description: 'Your changes have been saved to the database.' });
            refreshData();
        }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Automation</CardTitle>
        <CardDescription>
          Configure automatic rent reminders via WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <Label htmlFor="whatsapp_reminders_enabled" className="flex flex-col space-y-1">
            <span>Enable Auto-Reminders</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Send automated reminders to tenants with pending payments.
            </span>
          </Label>
          <Switch
            id="whatsapp_reminders_enabled"
            name="whatsapp_reminders_enabled"
            checked={settings.whatsappRemindersEnabled}
            onCheckedChange={handleWhatsappEnabledChange}
          />
        </div>
        <div className="space-y-4 rounded-lg border p-4" >
          <Label>Reminder Schedule</Label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                  <Checkbox id="schedule-before" value="before"
                    checked={(settings.whatsappReminderSchedule || []).includes('before')}
                    onCheckedChange={(checked) => handleReminderScheduleChange(Boolean(checked), 'before')}
                  />
                  <Label htmlFor="schedule-before" className="font-normal">3 days before due date</Label>
              </div>
              <div className="flex items-center gap-2">
                  <Checkbox id="schedule-on" value="on"
                    checked={(settings.whatsappReminderSchedule || []).includes('on')}
                    onCheckedChange={(checked) => handleReminderScheduleChange(Boolean(checked), 'on')}
                  />
                  <Label htmlFor="schedule-on" className="font-normal">On due date</Label>
              </div>
              <div className="flex items-center gap-2">
                  <Checkbox id="schedule-after" value="after"
                    checked={(settings.whatsappReminderSchedule || []).includes('after')}
                    onCheckedChange={(checked) => handleReminderScheduleChange(Boolean(checked), 'after')}
                  />
                  <Label htmlFor="schedule-after" className="font-normal">5 days after due date</Label>
              </div>
          </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="whatsapp_reminder_template">Reminder Message Template</Label>
            <Textarea
              id="whatsapp_reminder_template"
              name="whatsapp_reminder_template"
              placeholder="e.g., Hi {tenantName}, a friendly reminder that your rent of ৳{rentAmount} for {property} is due on {dueDate}."
              value={settings.whatsappReminderTemplate || ''}
              onChange={(e) => setSettings(prev => ({...prev, whatsappReminderTemplate: e.target.value}))}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders like {"{tenantName}"}, {"{rentAmount}"}, {"{property}"}, and {"{dueDate}"}.
            </p>
          </div>
      </CardContent>
       <CardFooter>
           <Button onClick={handleSaveIntegrationSettings} disabled={isPending}>
             {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
             Save Integration Settings
           </Button>
       </CardFooter>
    </Card>
  )
}
