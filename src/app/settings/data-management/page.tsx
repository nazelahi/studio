
"use client"

import Link from "next/link"
import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { useData } from "@/context/data-context"
import { saveAs } from "file-saver"
import { useToast } from "@/hooks/use-toast"
import { useProtection } from "@/context/protection-context"

import { clearMonthlyDataAction, clearYearlyDataAction, generateSqlBackupAction } from "@/app/actions/data"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Logo } from "@/components/icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Building, KeyRound, Palette, Tag, Database, RefreshCw, HardDriveDownload, HardDriveUpload, Trash2, User, LogOut, MapPin, Menu, Settings, LoaderCircle, LogIn, UserCircle, Share2 } from "lucide-react"

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

function AccessDenied() {
  const router = useRouter();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Go to Dashboard</Button>
      </div>
    </div>
  );
}

export default function DataManagementPage() {
    const router = useRouter();
    const { isAdmin, user, signOut } = useAuth();
    const { settings } = useSettings();
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
            } else {
            throw new Error("Invalid backup file format.");
            }
        } catch (err: any) {
            toast({ title: "Restore Failed", description: err.message || "The file could not be read or is corrupted.", variant: "destructive" });
            console.error("Restore error:", err);
        } finally {
            setIsProcessing(false);
            if(event.target) event.target.value = '';
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

                if (clearMonth) {
                    formData.set('month', clearMonth);
                    const result = await clearMonthlyDataAction(formData);
                    if (result.error) {
                        toast({ title: 'Error Clearing Data', description: result.error, variant: 'destructive' });
                    } else {
                        toast({ title: 'Data Cleared', description: result.message, variant: 'destructive' });
                    }
                } else {
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

    const handleSignOut = async () => {
        await signOut();
        toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        });
        router.push('/');
    };

    const handleLogIn = (e: React.MouseEvent) => {
        withProtection(() => {}, e);
    }
    
    if (!isAdmin) {
        return <AccessDenied />;
    }

    const navigationLinks = (
    <>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <Building className="h-4 w-4" />
            Property
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <KeyRound className="h-4 w-4" />
            Account
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <Share2 className="h-4 w-4" />
            Integrations
        </Link>
        <button className="flex items-center gap-3 rounded-lg px-3 py-2 bg-muted text-primary transition-all">
            <Database className="h-4 w-4" />
            Data Management
        </button>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <Palette className="h-4 w-4" />
            Application
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <Tag className="h-4 w-4" />
            Page Labels
        </Link>
    </>
    );
    
    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="sr-only">{settings.appName}</span>
                </Link>
                <Link href="/" className="transition-colors hover:text-foreground text-muted-foreground">
                    {settings.page_dashboard.nav_dashboard}
                </Link>
                {isAdmin && (
                    <Link href="/settings" className="transition-colors hover:text-foreground text-foreground">
                    {settings.page_dashboard.nav_settings}
                    </Link>
                )}
            </nav>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <SheetHeader className="sr-only"><SheetTitle>Mobile Navigation</SheetTitle></SheetHeader>
                    <nav className="grid gap-6 text-lg font-medium p-6">
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                        <Logo className="h-6 w-6 text-primary" />
                        <span className="sr-only">{settings.appName}</span>
                    </Link>
                    <Link href="/" className="hover:text-foreground text-muted-foreground">
                        {settings.page_dashboard.nav_dashboard}
                    </Link>
                    {isAdmin && (
                        <Link href="/settings" className="hover:text-foreground text-foreground">
                        {settings.page_dashboard.nav_settings}
                        </Link>
                    )}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex-1 text-center min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-primary truncate">{settings.houseName}</h1>
                <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <p className="truncate">{settings.houseAddress}</p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person avatar" />
                        <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {isAdmin ? (
                        <>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/settings')}>
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
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">Data Management</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <nav className="grid gap-4 text-sm text-muted-foreground">
                    {navigationLinks}
                </nav>
                <div className="grid gap-6">
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
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="p-3 bg-secondary rounded-md text-sm">
                                <p className="font-medium text-secondary-foreground">Status: <span className="text-primary font-bold">Ready</span></p>
                                <p className="text-muted-foreground">Save your data to a JSON or SQL file.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button type="button" onClick={handleBackup} disabled={isProcessing} className="w-full">
                                    {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                                    {isProcessing ? "Processing..." : "JSON Backup"}
                                </Button>
                                <Button type="button" onClick={handleSqlBackup} disabled={isSqlPending} className="w-full">
                                    {isSqlPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4"/>}
                                    SQL Backup
                                </Button>
                            </div>
                            <div className="grid grid-cols-1">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button type="button" variant="outline" disabled={isProcessing} className="w-full">
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
                                <Button type="button" variant="destructive" className="w-full" disabled={isClearPending}>
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
            </main>
        </div>
    );
}
