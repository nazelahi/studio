
"use client"

import React, { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateUserCredentialsAction, updatePasscodeAction } from "./actions"
import { useAppContext } from "@/context/app-context"
import { Switch } from "@/components/ui/switch"

export default function AccountSettingsTab() {
  const { user } = useAuth();
  const { settings, setSettings, refreshData } = useAppContext();
  const { toast } = useToast();
  const [isCredentialsPending, startCredentialsTransition] = useTransition();
  const [isPasscodePending, startPasscodeTransition] = useTransition();

  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  React.useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  const handleSaveCredentials = (formData: FormData) => {
    if (!user) {
      toast({ title: 'Unauthorized', description: 'You must be logged in to perform this action.', variant: 'destructive'});
      return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive'});
      return;
    }

    startCredentialsTransition(async () => {
      const result = await updateUserCredentialsAction(formData);
      if (result?.error) {
          toast({ title: 'Error Updating Credentials', description: result.error, variant: 'destructive'});
      } else {
          toast({ title: 'Credentials Updated', description: 'Your login details have been changed. You may need to log in again.' });
          setNewPassword('');
          setConfirmPassword('');
      }
   });
  }

  const handleSavePasscode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startPasscodeTransition(async () => {
      const result = await updatePasscodeAction(formData);
      if (result?.error) {
        toast({ title: 'Error Saving Passcode', description: result.error, variant: 'destructive'});
      } else {
        toast({ title: 'Passcode Settings Saved', description: 'Your passcode settings have been updated.' });
        refreshData();
      }
    });
  }

  return (
    <div className="space-y-6">
      <form action={handleSaveCredentials}>
          <Card>
              <CardHeader>
                  <CardTitle>Admin Credentials</CardTitle>
                  <CardDescription>Update the email and password for the admin account.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                  <input type="hidden" name="userId" value={user?.id || ''} />
                  <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input id="password" name="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  </div>
              </CardContent>
              <CardFooter>
                  <Button type="submit" disabled={isCredentialsPending}>
                    {isCredentialsPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save Credentials
                  </Button>
              </CardFooter>
          </Card>
      </form>
      <form onSubmit={handleSavePasscode}>
        <Card>
            <CardHeader>
                <CardTitle>Passcode Security</CardTitle>
                <CardDescription>
                    Set a secret passcode required for sensitive actions like editing and deleting.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <Label htmlFor="passcode_protection_enabled" className="flex flex-col space-y-1">
                    <span>Enable Passcode Protection</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        If enabled, a passcode will be required for all destructive actions.
                    </span>
                    </Label>
                    <Switch
                    id="passcode_protection_enabled"
                    name="passcode_protection_enabled"
                    checked={settings.passcodeProtectionEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, passcodeProtectionEnabled: checked}))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="passcode">Secret Passcode</Label>
                    <Input id="passcode" name="passcode" type="password" placeholder="Leave blank to keep current" defaultValue={settings.passcode || ''}/>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isPasscodePending}>
                    {isPasscodePending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save Passcode Settings
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  )
}
