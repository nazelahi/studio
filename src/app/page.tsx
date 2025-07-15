
"use client"

import Link from "next/link"
import * as React from "react"
import { useSettings } from "@/context/settings-context"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/icons"
import DashboardTabs from "@/components/dashboard-tabs"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin, Menu, Settings, LogIn, UserCircle, LoaderCircle, Moon, Sun, Monitor } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useProtection } from "@/context/protection-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { AppFooter } from "@/components/app-footer"
import { BackToTopButton } from "@/components/back-to-top-button"
import { useTheme } from "next-themes"

function FullPageLoader() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Property Details...</p>
    </div>
  );
}


export default function HomePage() {
  const { settings, loading: settingsLoading } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, user, signOut } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();
  const { setTheme } = useTheme();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = React.useState(false);

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    router.push('/');
  };

  const handleNavigateToSettings = (e: React.MouseEvent) => {
    withProtection(() => {
        router.push('/settings');
    }, e);
  };
  
  const handleLogIn = (e: React.MouseEvent) => {
     withProtection(() => {
        // This will not run if user is not admin,
        // but withProtection will trigger the login dialog.
     }, e);
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsSheetOpen(false); // Close sidebar on selection
  };
  
  const mainNavLinks = (
    <>
      <Link href="/" className={`hover:text-foreground ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}>
        {settings.page_dashboard.nav_dashboard}
      </Link>
      {isAdmin && (
        <button
          onClick={handleNavigateToSettings}
          className={`hover:text-foreground ${pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {settings.page_dashboard.nav_settings}
        </button>
      )}
    </>
  );

  const dashboardNavLinks = (
    <>
      <button onClick={() => handleTabChange('overview')} className={`w-full text-left hover:text-foreground ${activeTab === 'overview' ? 'text-foreground' : 'text-muted-foreground'}`}>{settings.tabNames.overview}</button>
      <button onClick={() => handleTabChange('contacts')} className={`w-full text-left hover:text-foreground ${activeTab === 'contacts' ? 'text-foreground' : 'text-muted-foreground'}`}>{settings.tabNames.tenants}</button>
      <button onClick={() => handleTabChange('work')} className={`w-full text-left hover:text-foreground ${activeTab === 'work' ? 'text-foreground' : 'text-muted-foreground'}`}>{settings.tabNames.work}</button>
      <button onClick={() => handleTabChange('reports')} className={`w-full text-left hover:text-foreground ${activeTab === 'reports' ? 'text-foreground' : 'text-muted-foreground'}`}>{settings.tabNames.reports}</button>
      <button onClick={() => handleTabChange('zakat')} className={`w-full text-left hover:text-foreground ${activeTab === 'zakat' ? 'text-foreground' : 'text-muted-foreground'}`}>{settings.tabNames.zakat}</button>
    </>
  );

  if (settingsLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">{settings.houseName}</span>
          </Link>
          {mainNavLinks}
        </nav>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 flex flex-col">
            <SheetHeader className="p-6">
              <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
              <div className="flex flex-col items-start gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <p className="truncate">{settings.houseAddress}</p>
                  </div>
              </div>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium p-6 pt-0">
               <div className="border-t pt-6 grid gap-4 text-base font-medium">
                  <h3 className="font-semibold text-primary">Main Menu</h3>
                  {mainNavLinks}
               </div>
            </nav>
            <div className="mt-auto border-t p-4">
                 <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <Avatar className="h-9 w-9">
                          <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                          <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                          <h1 className="text-sm font-bold tracking-tight text-primary truncate">{settings.ownerName}</h1>
                          <p className="text-xs text-muted-foreground">Property Owner</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                      <DialogHeader className="items-center text-center">
                        <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                          <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                          <AvatarFallback><UserCircle className="h-20 w-20 text-muted-foreground"/></AvatarFallback>
                        </Avatar>
                        <DialogTitle className="text-2xl pt-4">{settings.ownerName}</DialogTitle>
                      </DialogHeader>
                      <div className="text-center text-muted-foreground text-sm">Property Owner</div>
                      <div className="mt-4 pt-4 border-t text-center">
                          <h3 className="font-semibold text-primary">{settings.houseName}</h3>
                          <p className="text-sm text-muted-foreground">{settings.houseAddress}</p>
                      </div>
                  </DialogContent>
                </Dialog>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 text-center min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <p className="truncate">{settings.houseAddress}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
              <DialogTrigger asChild>
                <div className="hidden md:flex items-center gap-3 cursor-pointer">
                  <div className="flex flex-col items-end text-right">
                      <h1 className="text-sm font-bold tracking-tight text-primary truncate">{settings.ownerName}</h1>
                      <p className="text-xs text-muted-foreground">Property Owner</p>
                  </div>
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                      <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                  <DialogHeader className="items-center text-center">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                      <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                      <AvatarFallback><UserCircle className="h-20 w-20 text-muted-foreground"/></AvatarFallback>
                    </Avatar>
                    <DialogTitle className="text-2xl pt-4">{settings.ownerName}</DialogTitle>
                  </DialogHeader>
                  <div className="text-center text-muted-foreground text-sm">Property Owner</div>

                  <div className="mt-4 pt-4 border-t text-center">
                      <h3 className="font-semibold text-primary">{settings.houseName}</h3>
                      <p className="text-sm text-muted-foreground">{settings.houseAddress}</p>
                  </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full shrink-0 h-8 w-8 -ml-2">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 {isAdmin ? (
                    <>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleNavigateToSettings}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                         <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span>Toggle theme</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                    </>
                 ) : (
                    <>
                        <DropdownMenuLabel>Guest</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogIn}>
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Admin Log in</span>
                        </DropdownMenuItem>
                    </>
                 )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-20 md:pb-8">
        <DashboardTabs
          year={parseInt(selectedYear)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          years={years}
        />
        <AppFooter />
      </main>
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <BackToTopButton />
    </div>
  )
}
