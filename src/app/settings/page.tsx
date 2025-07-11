"use client"

import Link from "next/link"
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/icons"
import { useSettings } from "@/context/settings-context"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, KeyRound } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { LoginDialog } from "@/components/login-dialog"

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const pathname = usePathname();
  const { user, signOut, isAdmin, changePassword } = useAuth();
  const { toast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('tabNames.')) {
        const key = name.split('.')[1] as keyof typeof settings.tabNames;
        setSettings(prev => ({
            ...prev,
            tabNames: {
                ...prev.tabNames,
                [key]: value
            }
        }));
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: "Error", description: "Password must be at least 4 characters long.", variant: "destructive" });
      return;
    }

    const { error } = await changePassword(oldPassword, newPassword);

    if (error) {
      toast({ title: "Password Change Failed", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Your password has been changed." });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
     <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="flex-1 flex items-center gap-5 text-sm font-medium">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">{settings.appName}</span>
          </Link>
          <Link
            href="/"
            className={`transition-colors hover:text-foreground ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={`transition-colors hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Settings
          </Link>
        </nav>
        {user ? (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => setIsLoginOpen(true)}>Sign In</Button>
        )}
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Settings</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>Customize the names and labels used throughout the application. { !isAdmin && "Sign in as an admin to make changes."}</CardDescription>
                </CardHeader>
                <fieldset disabled={!isAdmin} className="group">
                  <CardContent className="space-y-6 group-disabled:opacity-50">
                      <div className="space-y-2">
                          <Label htmlFor="appName">Header Name</Label>
                          <Input id="appName" name="appName" value={settings.appName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label>Tab Names</Label>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="tab-overview" className="font-normal text-muted-foreground">Overview Tab</Label>
                                  <Input id="tab-overview" name="tabNames.overview" value={settings.tabNames.overview} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="tab-tenants" className="font-normal text-muted-foreground">Tenants Tab</Label>
                                  <Input id="tab-tenants" name="tabNames.tenants" value={settings.tabNames.tenants} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="tab-whatsapp" className="font-normal text-muted-foreground">WhatsApp Tab</Label>
                                  <Input id="tab-whatsapp" name="tabNames.whatsapp" value={settings.tabNames.whatsapp} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="tab-reports" className="font-normal text-muted-foreground">Reports Tab</Label>
                                  <Input id="tab-reports" name="tabNames.reports" value={settings.tabNames.reports} onChange={handleInputChange} />
                              </div>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="footerName">Footer Name</Label>
                          <Input id="footerName" name="footerName" value={settings.footerName} onChange={handleInputChange} />
                      </div>
                  </CardContent>
                </fieldset>
            </Card>

            {isAdmin && user?.id === 'super-admin-id' && (
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Change your super admin password.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Old Password</Label>
                      <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

          </div>
           <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
            {settings.footerName}
          </footer>
        </main>
        <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
      </div>
  )
}
