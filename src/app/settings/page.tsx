
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
    const keys = name.split('.');
    
    setSettings(prev => {
        let newState = { ...prev };
        let currentLevel: any = newState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel = currentLevel[keys[i]];
        }
        
        currentLevel[keys[keys.length - 1]] = value;
        return newState;
    });
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
            {settings.page_dashboard.nav_dashboard}
          </Link>
          <Link
            href="/settings"
            className={`transition-colors hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {settings.page_dashboard.nav_settings}
          </Link>
        </nav>
        {user ? (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">{settings.page_dashboard.user_menu_tooltip}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{settings.page_dashboard.user_menu_logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => setIsLoginOpen(true)}>{settings.page_dashboard.signin_button}</Button>
        )}
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{settings.page_settings.title}</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <fieldset disabled={!isAdmin} className="group grid gap-6">
              <Card className="group-disabled:opacity-50">
                  <CardHeader>
                      <CardTitle>{settings.page_settings.app_settings.title}</CardTitle>
                      <CardDescription>{settings.page_settings.app_settings.description}{ !isAdmin && " Sign in as an admin to make changes."}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="space-y-2">
                          <Label htmlFor="appName">{settings.page_settings.app_settings.header_name_label}</Label>
                          <Input id="appName" name="appName" value={settings.appName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label>{settings.page_settings.app_settings.tab_names_label}</Label>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="tab-overview" className="font-normal text-muted-foreground">{settings.page_settings.app_settings.overview_tab_label}</Label>
                                  <Input id="tab-overview" name="tabNames.overview" value={settings.tabNames.overview} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="tab-tenants" className="font-normal text-muted-foreground">{settings.page_settings.app_settings.tenants_tab_label}</Label>
                                  <Input id="tab-tenants" name="tabNames.tenants" value={settings.tabNames.tenants} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="tab-integrations" className="font-normal text-muted-foreground">{settings.page_settings.app_settings.integrations_tab_label}</Label>
                                  <Input id="tab-integrations" name="tabNames.integrations" value={settings.tabNames.integrations} onChange={handleInputChange} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="tab-reports" className="font-normal text-muted-foreground">{settings.page_settings.app_settings.reports_tab_label}</Label>
                                  <Input id="tab-reports" name="tabNames.reports" value={settings.tabNames.reports} onChange={handleInputChange} />
                              </div>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="footerName">{settings.page_settings.app_settings.footer_name_label}</Label>
                          <Input id="footerName" name="footerName" value={settings.footerName} onChange={handleInputChange} />
                      </div>
                  </CardContent>
              </Card>

              <Card className="group-disabled:opacity-50">
                  <CardHeader>
                    <CardTitle>{settings.page_settings.overview_settings.title}</CardTitle>
                    <CardDescription>{settings.page_settings.overview_settings.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="overview-financial-title">{settings.page_settings.overview_settings.financial_title_label}</Label>
                          <Input id="overview-financial-title" name="page_overview.financial_overview_title" value={settings.page_overview.financial_overview_title} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="overview-financial-desc">{settings.page_settings.overview_settings.financial_description_label}</Label>
                          <Input id="overview-financial-desc" name="page_overview.financial_overview_description" value={settings.page_overview.financial_overview_description} onChange={handleInputChange} />
                      </div>
                  </CardContent>
              </Card>

              <Card className="group-disabled:opacity-50">
                  <CardHeader>
                    <CardTitle>{settings.page_settings.tenant_settings.title}</CardTitle>
                    <CardDescription>{settings.page_settings.tenant_settings.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="tenant-management-title">{settings.page_settings.tenant_settings.manage_title_label}</Label>
                          <Input id="tenant-management-title" name="page_tenants.title" value={settings.page_tenants.title} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="tenant-management-desc">{settings.page_settings.tenant_settings.manage_description_label}</Label>
                          <Input id="tenant-management-desc" name="page_tenants.description" value={settings.page_tenants.description} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="tenant-search-placeholder">{settings.page_settings.tenant_settings.search_placeholder_label}</Label>
                          <Input id="tenant-search-placeholder" name="page_tenants.search_placeholder" value={settings.page_tenants.search_placeholder} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="tenant-add-button">{settings.page_settings.tenant_settings.add_tenant_button_label}</Label>
                          <Input id="tenant-add-button" name="page_tenants.add_tenant_button" value={settings.page_tenants.add_tenant_button} onChange={handleInputChange} />
                      </div>
                  </CardContent>
              </Card>

              {isAdmin && user?.id === 'super-admin-id' && (
              <Card>
                <CardHeader>
                  <CardTitle>{settings.page_settings.security_settings.title}</CardTitle>
                  <CardDescription>{settings.page_settings.security_settings.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">{settings.page_settings.security_settings.old_password_label}</Label>
                      <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{settings.page_settings.security_settings.new_password_label}</Label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{settings.page_settings.security_settings.confirm_password_label}</Label>

                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit">
                      <KeyRound className="mr-2 h-4 w-4" />
                      {settings.page_settings.security_settings.change_password_button}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              )}
            </fieldset>

          </div>
           <footer className="text-center text-sm text-muted-foreground mt-auto pt-4">
            {settings.footerName}
          </footer>
        </main>
        <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
      </div>
  )
}
