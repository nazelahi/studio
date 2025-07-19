
"use client"

import Link from "next/link"
import * as React from "react"
import { useAppContext } from "@/context/app-context"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/icons"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, MapPin, Menu, Settings, LogIn, UserCircle, LoaderCircle, Moon, Sun, Monitor, Archive, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useProtection } from "@/context/protection-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { AppFooter } from "@/components/app-footer"
import { BackToTopButton } from "@/components/back-to-top-button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, Skeleton, Progress } from "@/components/ui"
import { ThemeToggle } from "@/components/theme-toggle"


const LoadingSkeleton = () => (
  <Card className="mt-4">
    <CardHeader>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-40 w-full" />
    </CardContent>
  </Card>
)

const MonthlyOverviewTab = dynamic(() => import('@/components/monthly-overview-tab').then(mod => mod.MonthlyOverviewTab), {
  loading: () => <LoadingSkeleton />,
});
const ContactsTab = dynamic(() => import('@/components/contacts-tab').then(mod => mod.ContactsTab), {
  loading: () => <LoadingSkeleton />,
});
const WorkDetailsTab = dynamic(() => import('@/components/work-details-tab').then(mod => mod.WorkDetailsTab), {
  loading: () => <LoadingSkeleton />,
});
const DocumentsTab = dynamic(() => import('@/components/documents-tab').then(mod => mod.DocumentsTab), {
  loading: () => <LoadingSkeleton />,
});
const ReportsTab = dynamic(() => import('@/components/reports-tab').then(mod => mod.ReportsTab), {
  loading: () => <LoadingSkeleton />,
});
const ZakatTab = dynamic(() => import('@/components/zakat-tab').then(mod => mod.ZakatTab), {
  loading: () => <LoadingSkeleton />,
});


function FullPageLoader() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
            <Logo className="mx-auto h-12 w-12 text-primary animate-pulse" />
            <p className="text-muted-foreground">Loading Property Details...</p>
        </div>
    </div>
  );
}

export default function DashboardPageClient() {
  const { settings, loading: dataLoading } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, user, signOut } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();
  const { setTheme } = useTheme();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [currentYear] = React.useState(new Date().getFullYear());


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
      <Link href="/" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname === '/' && "text-primary bg-muted")}>
        <Logo className="h-4 w-4"/>
        {isSidebarOpen && settings.page_dashboard.nav_dashboard}
      </Link>
      {isAdmin && (
        <button
          onClick={handleNavigateToSettings}
          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname === '/settings' && "text-primary bg-muted")}
        >
          <Settings className="h-4 w-4"/>
          {isSidebarOpen && settings.page_dashboard.nav_settings}
        </button>
      )}
    </>
  );

  const mobileNavLinks = (
     <>
      <Link href="/" className={cn("flex items-center gap-4 hover:text-foreground", pathname === '/' ? 'text-foreground' : 'text-muted-foreground')}>
        <Logo className="h-5 w-5"/>
        {settings.page_dashboard.nav_dashboard}
      </Link>
      {isAdmin && (
        <button
          onClick={handleNavigateToSettings}
          className={cn("flex items-center gap-4 hover:text-foreground", pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground')}
        >
          <Settings className="h-5 w-5"/>
          {settings.page_dashboard.nav_settings}
        </button>
      )}
    </>
  )

  if (dataLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className={cn("min-h-screen w-full", isSidebarOpen ? "md:grid md:grid-cols-[280px_1fr]" : "md:grid md:grid-cols-[72px_1fr]")}>
      <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    {settings.appLogoUrl ? (
                        <img src={settings.appLogoUrl} alt={settings.houseName} className="h-6 w-auto" />
                    ) : (
                        <Logo className="h-6 w-6 text-primary" />
                    )}
                   {isSidebarOpen && <span className="">{settings.houseName}</span>}
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {mainNavLinks}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t">
                 {isSidebarOpen && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground mb-4 p-2 rounded-lg bg-background/50">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>{settings.houseAddress}</p>
                    </div>
                )}
                 <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <Avatar className="h-9 w-9">
                          <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                          <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                      </Avatar>
                      {isSidebarOpen && (
                          <div className="flex flex-col items-start overflow-hidden">
                              <h1 className="text-sm font-bold tracking-tight text-primary truncate">{settings.ownerName}</h1>
                              <p className="text-xs text-muted-foreground">Property Owner</p>
                          </div>
                      )}
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
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="ghost" size="icon" className="flex-1 justify-center" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                      {isSidebarOpen ? <PanelLeftClose className="h-4 w-4"/> : <PanelLeftOpen className="h-4 w-4"/> }
                  </Button>
                  <ThemeToggle />
                </div>
            </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40">
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
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col items-start gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <p className="truncate">{settings.houseAddress}</p>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                    </SheetHeader>
                    <nav className="grid gap-6 text-lg font-medium p-6 pt-0">
                    <div className="border-t pt-6 grid gap-4 text-base font-medium">
                        <h3 className="font-semibold text-primary">Main Menu</h3>
                        {mobileNavLinks}
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
                
                 <div className="md:hidden flex-1 text-center">
                    <h1 className="text-base font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
                    <div className="flex items-center justify-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <p className="truncate">{settings.houseAddress}</p>
                    </div>
                </div>

                <div className="hidden md:flex flex-1">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">{settings.tabNames.overview}</TabsTrigger>
                        <TabsTrigger value="contacts">{settings.tabNames.tenants}</TabsTrigger>
                        <TabsTrigger value="work">{settings.tabNames.work}</TabsTrigger>
                        <TabsTrigger value="documents">{settings.tabNames.documents}</TabsTrigger>
                        <TabsTrigger value="reports">{settings.tabNames.reports}</TabsTrigger>
                        <TabsTrigger value="zakat">{settings.tabNames.zakat}</TabsTrigger>
                    </TabsList>
                </div>
                
                <div className="flex w-auto items-center gap-4 md:ml-auto md:w-auto md:gap-2 lg:gap-4 justify-end">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full shrink-0 h-8 w-8">
                        <Settings className="h-4 w-4" />
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
                <TabsContent value="overview">
                    {activeTab === 'overview' && <MonthlyOverviewTab />}
                </TabsContent>
                <TabsContent value="contacts">
                    {activeTab === 'contacts' && <ContactsTab />}
                </TabsContent>
                <TabsContent value="work">
                    {activeTab === 'work' && <WorkDetailsTab year={currentYear} />}
                </TabsContent>
                <TabsContent value="documents">
                    {activeTab === 'documents' && <DocumentsTab />}
                </TabsContent>
                <TabsContent value="reports">
                    {activeTab === 'reports' && <ReportsTab year={currentYear} />}
                </TabsContent>
                <TabsContent value="zakat">
                    {activeTab === 'zakat' && <ZakatTab />}
                </TabsContent>
                <AppFooter />
            </main>
        </Tabs>
      </div>
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <BackToTopButton />
    </div>
  )
}
