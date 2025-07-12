

"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry, Deposit, Notice } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Banknote, ArrowUpCircle, ArrowDownCircle, PlusCircle, Trash2, Pencil, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, Copy, X, FileText, Upload, Building, Landmark, CalendarCheck, Edit, Eye, Image as ImageIcon, Megaphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { format, parseISO } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { useData } from "@/context/data-context"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { Checkbox } from "./ui/checkbox"
import { TenantDetailSheet } from "./tenant-detail-sheet"
import * as XLSX from 'xlsx';
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import Link from "next/link"
import { logDepositAction, deleteDepositAction } from "@/app/actions/deposits"
import { saveNoticeAction, deleteNoticeAction } from "@/app/actions/notices"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"


type HistoricalTenant = {
    id: string;
    uniqueId: string;
    name: string;
    property: string;
    rent: number;
    avatar: string;
    lastSeen: { month: number, year: number };
}

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const expenseCategories = ["Maintenance", "Repairs", "Utilities", "Insurance", "Taxes", "Management Fee", "Other"];

const getStatusBadge = (status: RentEntry["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getStatusRowClass = (status: RentEntry["status"]) => {
    switch(status) {
        case "Paid": return "bg-green-50/50";
        case "Overdue": return "bg-red-50/50";
        default: return "";
    }
};


const getStatusIcon = (status: RentEntry["status"]) => {
    switch(status) {
        case "Paid": return <CheckCircle className="h-4 w-4 mr-1"/>;
        case "Overdue": return <XCircle className="h-4 w-4 mr-1"/>;
        case "Pending": return <AlertCircle className="h-4 w-4 mr-1"/>
        default: return null;
    }
}


const getExpenseStatusBadge = (status: Expense["status"]) => {
    return status === "Paid" ? "bg-success text-success-foreground hover:bg-success/80"
      : "bg-warning text-warning-foreground hover:bg-warning/80";
};

export function MonthlyOverviewTab({ year }: { year: number }) {
  const currentMonthIndex = year === new Date().getFullYear() ? new Date().getMonth() : 0;
  const [selectedMonth, setSelectedMonth] = React.useState(months[currentMonthIndex]);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();

  const { tenants, expenses, rentData, deposits, notices, addRentEntry, addRentEntriesBatch, updateRentEntry, deleteRentEntry, addExpense, updateExpense, deleteExpense, syncTenantsForMonth, loading, deleteMultipleRentEntries, deleteMultipleExpenses, refreshData } = useData();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [expenseCategory, setExpenseCategory] = React.useState('');
  const [customCategory, setCustomCategory] = React.useState('');


  const [isRentDialogOpen, setIsRentDialogOpen] = React.useState(false);
  const [editingRentEntry, setEditingRentEntry] = React.useState<RentEntry | null>(null);
  
  const [isTenantFinderOpen, setIsTenantFinderOpen] = React.useState(false);
  const [selectedHistoricalTenant, setSelectedHistoricalTenant] = React.useState<HistoricalTenant | null>(null);
  
  const [selectedRentEntryIds, setSelectedRentEntryIds] = React.useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<string[]>([]);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedTenantForSheet, setSelectedTenantForSheet] = React.useState<Tenant | null>(null);
  
  const [isDepositDialogOpen, setIsDepositDialogOpen] = React.useState(false);
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState('');
  
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = React.useState(false);
  const [isNoticePending, startNoticeTransition] = React.useTransition();


  const formRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);


  const filteredTenantsForMonth = React.useMemo(() => {
    return rentData.filter(entry => entry.month === months.indexOf(selectedMonth) && entry.year === year);
  }, [rentData, selectedMonth, year]);

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(expense => {
        if (!expense.date) return false;
        try {
            const expenseDate = parseISO(expense.date);
            return expenseDate.getMonth() === months.indexOf(selectedMonth) && expenseDate.getFullYear() === year;
        } catch {
            return false;
        }
      });
  }, [expenses, selectedMonth, year]);
  
  const loggedDeposit = React.useMemo(() => {
    return deposits.find(d => d.year === year && d.month === months.indexOf(selectedMonth));
  }, [deposits, year, selectedMonth]);

  const monthlyNotice = React.useMemo(() => {
    return notices.find(n => n.year === year && n.month === months.indexOf(selectedMonth));
  }, [notices, year, selectedMonth]);


  // Clear selections when month or year changes
  React.useEffect(() => {
    setSelectedRentEntryIds([]);
    setSelectedExpenseIds([]);
  }, [selectedMonth, year]);

  const totalRentCollected = filteredTenantsForMonth
    .filter(t => t.status === 'Paid')
    .reduce((acc, t) => acc + t.rent, 0);
  
  const totalRentExpected = filteredTenantsForMonth.reduce((acc, t) => acc + t.rent, 0);
  const collectionRate = totalRentExpected > 0 ? (totalRentCollected / totalRentExpected) * 100 : 0;

  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  const netResult = totalRentCollected - totalExpenses;
  const amountForDeposit = netResult > 0 ? netResult : 0;

  React.useEffect(() => {
    if (loggedDeposit) {
        setDepositAmount(loggedDeposit.amount.toString());
    } else {
        setDepositAmount(amountForDeposit > 0 ? amountForDeposit.toFixed(2) : '');
    }
  }, [loggedDeposit, amountForDeposit]);



  const historicalTenants = React.useMemo(() => {
    const allTenantsMap = new Map<string, HistoricalTenant>();

    const processEntry = (entry: RentEntry | Tenant, type: 'rent' | 'tenant') => {
        const uniqueId = `${entry.name.toLowerCase()}-${entry.property.toLowerCase()}`;
        const existing = allTenantsMap.get(uniqueId);

        let entryDate, entryMonth, entryYear;

        if(type === 'rent' && 'year' in entry && 'month' in entry) {
            entryYear = entry.year;
            entryMonth = entry.month;
        } else if ('joinDate' in entry && entry.joinDate) {
            try {
                const parsedDate = parseISO(entry.joinDate);
                entryYear = parsedDate.getFullYear();
                entryMonth = parsedDate.getMonth();
            } catch (e) {
                console.error("Invalid joinDate:", entry.joinDate);
                return;
            }
        } else {
            return; 
        }

        const isMoreRecent = !existing || entryYear > existing.lastSeen.year || (entryYear === existing.lastSeen.year && entryMonth > existing.lastSeen.month);

        if (isMoreRecent) {
            allTenantsMap.set(uniqueId, {
                id: (entry as any).tenantId || (entry as any).id,
                uniqueId,
                name: entry.name,
                property: entry.property,
                rent: entry.rent,
                avatar: entry.avatar,
                lastSeen: { month: entryMonth, year: entryYear }
            });
        }
    };
    
    rentData.forEach(entry => processEntry(entry, 'rent'));
    tenants.forEach(tenant => processEntry(tenant, 'tenant'));

    const currentMonthTenantIds = new Set(filteredTenantsForMonth.map(t => `${t.name.toLowerCase()}-${t.property.toLowerCase()}`));
    
    return Array.from(allTenantsMap.values())
        .filter(t => !currentMonthTenantIds.has(t.uniqueId))
        .sort((a, b) => a.name.localeCompare(b.name));

  }, [rentData, tenants, filteredTenantsForMonth]);


  // Rent Entry Handlers
  const handleRentOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setEditingRentEntry(null);
        setSelectedHistoricalTenant(null);
    }
    setIsRentDialogOpen(isOpen);
  };
  
  const handleEditRentEntry = (entry: RentEntry) => {
    setEditingRentEntry(entry);
    setSelectedHistoricalTenant(null);
    setIsRentDialogOpen(true);
  };
  
  const handleSelectHistoricalTenant = (tenant: HistoricalTenant) => {
      setSelectedHistoricalTenant(tenant);
      setIsTenantFinderOpen(false);

      if(formRef.current) {
          const nameInput = formRef.current.elements.namedItem('name') as HTMLInputElement;
          const propertyInput = formRef.current.elements.namedItem('property') as HTMLInputElement;
          const amountInput = formRef.current.elements.namedItem('amount') as HTMLInputElement;

          if (nameInput) nameInput.value = tenant.name;
          if (propertyInput) propertyInput.value = tenant.property;
          if (amountInput) amountInput.value = tenant.rent.toString();
      }
  };

  const handleClearSelectedTenant = () => {
    setSelectedHistoricalTenant(null);
    if(formRef.current) {
      formRef.current.reset();
    }
  }

  const handleDeleteRentEntry = async (entryId: string) => {
    await deleteRentEntry(entryId);
    toast({ title: "Rent Entry Deleted", description: "The rent entry for this month has been deleted.", variant: "destructive" });
  };
  
  const handleSaveRentEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const rentEntryData = {
        name: selectedHistoricalTenant?.name || formData.get('name') as string,
        property: selectedHistoricalTenant?.property || formData.get('property') as string,
        rent: Number(formData.get('amount')),
        paymentDate: formData.get('paymentDate') as string || undefined,
        collectedBy: formData.get('collectedBy') as string,
        status: formData.get('status') as RentEntry['status'],
        avatar: selectedHistoricalTenant?.avatar || editingRentEntry?.avatar || 'https://placehold.co/80x80.png',
        tenantId: selectedHistoricalTenant?.id || editingRentEntry?.tenantId
    };

    if(editingRentEntry) {
        await updateRentEntry({ ...editingRentEntry, ...rentEntryData });
        toast({ title: "Rent Entry Updated", description: "The entry has been successfully updated." });
    } else {
        const selectedMonthIndex = months.indexOf(selectedMonth);
        await addRentEntry(rentEntryData, year, selectedMonthIndex);
        toast({ title: "Rent Entry Added", description: "The new entry has been successfully added." });
    }

    setIsRentDialogOpen(false);
    setEditingRentEntry(null);
    setSelectedHistoricalTenant(null);
  };

    const handleSyncTenants = async () => {
        const selectedMonthIndex = months.indexOf(selectedMonth);
        const syncedCount = await syncTenantsForMonth(year, selectedMonthIndex);

        if (syncedCount > 0) {
            toast({
                title: "Sync Complete",
                description: `${syncedCount} tenant(s) have been added to the rent roll for ${months[selectedMonthIndex]}.`,
            });
        } else {
             toast({
                title: "Already up to date",
                description: "All active tenants are already in the rent roll for this month.",
            });
        }
    };
    
  const handleMassDeleteRentEntries = async () => {
    await deleteMultipleRentEntries(selectedRentEntryIds);
    toast({
      title: `${selectedRentEntryIds.length} Rent Entries Deleted`,
      description: "The selected entries have been permanently removed.",
      variant: "destructive"
    });
    setSelectedRentEntryIds([]);
  }

  const handleViewDetails = (entry: RentEntry) => {
    const tenant = tenants.find(t => t.id === entry.tenantId);
    if (tenant) {
      setSelectedTenantForSheet(tenant);
      setIsSheetOpen(true);
    } else {
      toast({
        title: "Tenant Not Found",
        description: "Could not find the full details for this tenant.",
        variant: "destructive",
      });
    }
  };

  // Expense Handlers
  const handleSaveExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const finalCategory = expenseCategory === 'Other' 
        ? formData.get('customCategory') as string
        : expenseCategory;

    const expenseData = {
      date: formData.get('date') as string,
      category: finalCategory,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      status: formData.get('status') as "Paid" | "Due",
    };

    if (editingExpense) {
      await updateExpense({ ...editingExpense, ...expenseData });
      toast({ title: "Expense Updated", description: "The expense has been successfully updated." });
    } else {
      await addExpense(expenseData);
      toast({ title: "Expense Added", description: "The new expense has been successfully added." });
    }

    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
    setExpenseCategory('');
    setCustomCategory('');
  };
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    const categoryIsPredefined = expenseCategories.includes(expense.category);
    if (categoryIsPredefined) {
        setExpenseCategory(expense.category);
        setCustomCategory('');
    } else {
        setExpenseCategory('Other');
        setCustomCategory(expense.category);
    }
    setIsExpenseDialogOpen(true);
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
    toast({ title: "Expense Deleted", description: "The expense has been deleted.", variant: "destructive" });
  };
  
  const handleExpenseOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingExpense(null);
      setExpenseCategory('');
      setCustomCategory('');
    }
    setIsExpenseDialogOpen(isOpen);
  };
  
  const handleMassDeleteExpenses = async () => {
    await deleteMultipleExpenses(selectedExpenseIds);
    toast({
      title: `${selectedExpenseIds.length} Expenses Deleted`,
      description: "The selected expenses have been permanently removed.",
      variant: "destructive"
    });
    setSelectedExpenseIds([]);
  }

  // Import Handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast({ title: "Processing file...", description: "Please wait while we read your spreadsheet." });
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if(json.length === 0) {
            toast({ title: "Empty Sheet", description: "The selected file is empty or in an unsupported format.", variant: "destructive" });
            return;
        }

        const rentEntriesToCreate = json.map(row => {
            const validStatuses = ["Paid", "Pending", "Overdue"];
            const status = validStatuses.includes(row.Status) ? row.Status : "Pending";
            
            let paymentDate: string | undefined = undefined;
            if (row.PaymentDate) {
              // Handle Excel date serial numbers
              if (typeof row.PaymentDate === 'number') {
                  const utc_days  = Math.floor(row.PaymentDate - 25569);
                  const utc_value = utc_days * 86400;                                        
                  const date_info = new Date(utc_value * 1000);
                  paymentDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate()).toISOString().split('T')[0];
              } else if (row.PaymentDate) {
                  const parsed = new Date(row.PaymentDate);
                  if (!isNaN(parsed.getTime())) {
                      paymentDate = parsed.toISOString().split('T')[0];
                  }
              }
            }
            
            return {
                name: String(row.Name || ''),
                property: String(row.Property || ''),
                rent: Number(row.Rent || 0),
                status: status as RentEntry['status'],
                paymentDate: paymentDate,
                collectedBy: String(row.CollectedBy || ''),
            };
        }).filter(entry => entry.name && entry.property && entry.rent > 0);

        if(rentEntriesToCreate.length === 0) {
            toast({ title: "No Valid Data Found", description: "Ensure your sheet has columns: Name, Property, Rent.", variant: "destructive" });
            return;
        }
        
        const selectedMonthIndex = months.indexOf(selectedMonth);
        await addRentEntriesBatch(rentEntriesToCreate, year, selectedMonthIndex);

        toast({ title: "Import Successful", description: `${rentEntriesToCreate.length} entries have been added to ${selectedMonth}, ${year}.` });

      } catch (error) {
        console.error("Error importing file:", error);
        toast({ title: "Import Failed", description: "There was an error processing your file. Please check the console for details.", variant: "destructive" });
      } finally {
        // Reset file input
        if(event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
        toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
    };
    reader.readAsArrayBuffer(file);
  };
  
    const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
  const handleSaveDeposit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);

    const formData = new FormData(event.currentTarget);
    formData.set('amount', depositAmount); // Ensure the state value is used
    let receiptUrl: string | null = loggedDeposit?.receipt_url || null;

    if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `${year}-${months.indexOf(selectedMonth)}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('deposit-receipts')
            .upload(filePath, receiptFile);

        if (uploadError) {
            toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
            setIsUploading(false);
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from('deposit-receipts')
            .getPublicUrl(filePath);
        
        receiptUrl = publicUrlData.publicUrl;

        // Pass the old URL to the action if it exists, for deletion
        if (loggedDeposit?.receipt_url) {
            formData.set('oldReceiptUrl', loggedDeposit.receipt_url);
        }
    }

    formData.set('receipt_url', receiptUrl || '');

    const result = await logDepositAction(formData);
    
    if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        // If the DB operation fails, try to clean up the newly uploaded file.
        if (receiptFile && receiptUrl) {
            try {
                const pathToDelete = new URL(receiptUrl).pathname.split('/deposit-receipts/')[1];
                await supabase.storage.from('deposit-receipts').remove([pathToDelete]);
                 toast({ title: "Cleanup", description: "Rolling back receipt upload due to database error." });
            } catch (e) {
                console.error("Error removing new receipt after failed DB update:", e);
            }
        }
    } else {
        toast({ title: "Success", description: "Bank deposit has been logged." });
        setIsDepositDialogOpen(false);
        refreshData();
    }
    setIsUploading(false);
  };

  const handleDeleteDeposit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await deleteDepositAction(formData);
    
    if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
        toast({ title: "Success", description: "Bank deposit has been removed.", variant: "destructive" });
        setIsDepositDialogOpen(false);
        refreshData();
    }
  };


  
  const handleDepositOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setReceiptFile(null);
        setReceiptPreview(null);
        setIsUploading(false);
    }
    setIsDepositDialogOpen(isOpen);
  };
  
  const handleSaveNotice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startNoticeTransition(async () => {
        const result = await saveNoticeAction(formData);
        if (result.error) {
            toast({ title: 'Error saving notice', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Notice Saved', description: 'The monthly notice has been updated.' });
            setIsNoticeDialogOpen(false);
        }
    });
  }
  
  const handleDeleteNotice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startNoticeTransition(async () => {
        const result = await deleteNoticeAction(formData);
        if (result.error) {
            toast({ title: 'Error deleting notice', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Notice Deleted', description: 'The monthly notice has been removed.', variant: 'destructive' });
        }
    });
  }

  if (loading) {
    return (
      <div className="pt-4 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
    <Tabs value={selectedMonth} onValueChange={setSelectedMonth} className="w-full pt-4">
      {/* Mobile View: Dropdown */}
      <div className="md:hidden mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger>
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(month => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop View: Tabs */}
      <div className="hidden md:block">
        <TabsList className="grid w-full grid-cols-12">
            {months.map(month => (
            <TabsTrigger key={month} value={month}>{month}</TabsTrigger>
            ))}
        </TabsList>
      </div>
      
      {months.map(month => (
        <TabsContent key={month} value={month}>
          <div className="mt-6 space-y-6">
            <Tabs defaultValue="rent-roll" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rent-roll">Rent Roll</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value="rent-roll">
                 <Card className="mt-4">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     <div>
                        <CardTitle>Rent Roll - {month} {year}</CardTitle>
                        <CardDescription>Rent payment status for {month} {year}.</CardDescription>
                    </div>
                     {isAdmin && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {selectedRentEntryIds.length > 0 && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2 w-full sm:w-auto">
                                <Trash2 className="h-4 w-4" />
                                Delete ({selectedRentEntryIds.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {selectedRentEntryIds.length} selected rent entries.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMassDeleteRentEntries}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" onClick={handleImportClick}>
                                    <Upload className="h-4 w-4" />
                                    <span className="sr-only">Import from file</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Import</TooltipContent>
                        </Tooltip>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".xlsx, .csv"
                            onChange={handleFileChange}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" onClick={handleSyncTenants}>
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">Sync tenants</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sync</TooltipContent>
                        </Tooltip>

                        <Dialog open={isRentDialogOpen} onOpenChange={handleRentOpenChange}>
                          <DialogTrigger asChild>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" onClick={() => {
                                        setEditingRentEntry(null);
                                        setSelectedHistoricalTenant(null);
                                        }}>
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only">Add new entry</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add Entry</TooltipContent>
                            </Tooltip>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>{editingRentEntry ? 'Edit Rent Entry' : 'Add New Rent Entry'}</DialogTitle>
                                  <DialogDescription>
                                      {editingRentEntry ? 'Update the entry below.' : 'Fill in the form or find a saved tenant to add a new entry.'}
                                  </DialogDescription>
                              </DialogHeader>
                                  <form ref={formRef} onSubmit={handleSaveRentEntry} className="grid gap-4 py-4">
                                  {!editingRentEntry && (
                                      <>
                                      <div className="space-y-2">
                                      <Label>Find Saved Tenant</Label>
                                      <Popover open={isTenantFinderOpen} onOpenChange={setIsTenantFinderOpen}>
                                          <PopoverTrigger asChild>
                                          <Button variant="outline" role="combobox" aria-expanded={isTenantFinderOpen} className="w-full justify-between">
                                              {selectedHistoricalTenant ? `Selected: ${selectedHistoricalTenant.name}` : "Select a past tenant..."}
                                              <div className="flex items-center">
                                              <Badge variant="secondary" className="mr-2">{historicalTenants.length}</Badge>
                                              <ChevronDown className="h-4 w-4 shrink-0 opacity-50"/>
                                              </div>
                                          </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                          <Command>
                                              <CommandInput placeholder="Search tenant..." />
                                              <CommandEmpty>No tenant found.</CommandEmpty>
                                              <CommandList>
                                              <CommandGroup>
                                                  {historicalTenants.map((tenant) => (
                                                  <CommandItem
                                                      key={tenant.uniqueId}
                                                      value={`${tenant.name} ${tenant.property}`}
                                                      onSelect={() => handleSelectHistoricalTenant(tenant)}
                                                      className="flex justify-between items-center"
                                                  >
                                                      <div className="flex items-center gap-3">
                                                          <Avatar className="h-8 w-8">
                                                              <AvatarImage src={tenant.avatar} />
                                                              <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                                          </Avatar>
                                                          <div>
                                                              <div className="font-medium">{tenant.name} - <span className="text-muted-foreground">{tenant.property}</span></div>
                                                              <div className="text-xs text-muted-foreground">
                                                                  Last seen: {months[tenant.lastSeen.month].substring(0,3)} {tenant.lastSeen.year} &middot; {tenant.rent.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).replace('BDT', '৳')}
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                              </CommandList>
                                          </Command>
                                          </PopoverContent>
                                      </Popover>
                                      </div>

                                      {selectedHistoricalTenant && (
                                      <Card className="bg-secondary/50 relative">
                                          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={handleClearSelectedTenant}>
                                              <X className="h-4 w-4" />
                                              <span className="sr-only">Clear selection</span>
                                          </Button>
                                          <CardHeader className="pb-2">
                                              <CardTitle className="text-base">Tenant Preview</CardTitle>
                                          </CardHeader>
                                          <CardContent className="text-sm space-y-1">
                                              <p><strong>Name:</strong> {selectedHistoricalTenant.name}</p>
                                              <p><strong>Apartment:</strong> {selectedHistoricalTenant.property}</p>
                                              <p><strong>Rent:</strong> {selectedHistoricalTenant.rent.toLocaleString('en-US', { style: 'currency', currency: 'BDT' }).replace('BDT', '৳')}</p>
                                          </CardContent>
                                      </Card>
                                      )}
                                      </>
                                  )}
                                  <div className="space-y-2">
                                      <Label htmlFor="name">Name</Label>
                                      <Input id="name" name="name" defaultValue={editingRentEntry?.name} placeholder="e.g., John Doe" required disabled={!!selectedHistoricalTenant} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="property">Flat</Label>
                                      <Input id="property" name="property" defaultValue={editingRentEntry?.property} placeholder="e.g., Flat-1" required disabled={!!selectedHistoricalTenant}/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="paymentDate">Date</Label>
                                      <Input id="paymentDate" name="paymentDate" type="date" defaultValue={editingRentEntry?.paymentDate ? format(parseISO(editingRentEntry.paymentDate), 'yyyy-MM-dd') : ''} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="collectedBy">Collect by</Label>
                                      <Input id="collectedBy" name="collectedBy" defaultValue={editingRentEntry?.collectedBy} placeholder="e.g., Admin" />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="amount">Amount</Label>
                                      <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingRentEntry?.rent} placeholder="0.00" required disabled={!!selectedHistoricalTenant} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="status">Status</Label>
                                      <Select name="status" defaultValue={editingRentEntry?.status || 'Pending'}>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="Paid">Paid</SelectItem>
                                          <SelectItem value="Pending">Pending</SelectItem>
                                          <SelectItem value="Overdue">Overdue</SelectItem>
                                      </SelectContent>
                                      </Select>
                                  </div>
                                  <DialogFooter>
                                      <DialogClose asChild>
                                          <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button type="submit">Save Entry</Button>
                                  </DialogFooter>
                              </form>
                          </DialogContent>
                        </Dialog>
                    </div>}
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredTenantsForMonth.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary hover:bg-primary/90">
                            {isAdmin && <TableHead className="w-10 text-primary-foreground">
                                <Checkbox
                                    checked={selectedRentEntryIds.length > 0 && selectedRentEntryIds.length === filteredTenantsForMonth.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedRentEntryIds(filteredTenantsForMonth.map(t => t.id));
                                        } else {
                                            setSelectedRentEntryIds([]);
                                        }
                                    }}
                                />
                            </TableHead>}
                            <TableHead className="text-primary-foreground">Tenant</TableHead>
                            <TableHead className="hidden md:table-cell text-primary-foreground">Collected By</TableHead>
                            <TableHead className="hidden sm:table-cell text-primary-foreground">Payment Date</TableHead>
                            <TableHead className="text-primary-foreground">Status</TableHead>
                            <TableHead className="hidden sm:table-cell text-primary-foreground">Amount</TableHead>
                            <TableHead className="text-primary-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTenantsForMonth.map((entry) => (
                            <TableRow key={entry.id} className={getStatusRowClass(entry.status)} data-state={isAdmin && selectedRentEntryIds.includes(entry.id) ? "selected" : undefined}>
                              {isAdmin && <TableCell>
                                  <Checkbox
                                      checked={selectedRentEntryIds.includes(entry.id)}
                                      onCheckedChange={(checked) => {
                                          setSelectedRentEntryIds(prev => 
                                              checked ? [...prev, entry.id] : prev.filter(id => id !== entry.id)
                                          );
                                      }}
                                  />
                              </TableCell>}
                              <TableCell>
                                <div className="grid gap-1">
                                  <p className="text-sm font-medium leading-none">{entry.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {entry.property}
                                  </p>
                                  <p className="sm:hidden text-sm text-primary font-semibold">৳{entry.rent.toFixed(2)}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{entry.collectedBy || '-'}</TableCell>
                              <TableCell className="hidden sm:table-cell">{entry.paymentDate ? format(parseISO(entry.paymentDate), "dd MMM yyyy") : '-'}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadge(entry.status)} variant="outline">
                                  {getStatusIcon(entry.status)}
                                  {entry.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">৳{entry.rent.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleViewDetails(entry)}>
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">View Details</span>
                                  </Button>
                                  {isAdmin && <>
                                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditRentEntry(entry)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                      </Button>
                                       <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                              <Trash2 className="h-4 w-4" />
                                              <span className="sr-only">Delete</span>
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the rent entry for this tenant for {months[entry.month]} {entry.year}.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteRentEntry(entry.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                  }
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow className="bg-lime-500 hover:bg-lime-500/90 font-bold">
                                <TableCell colSpan={isAdmin ? 4 : 3} className="text-white text-right sm:text-left">Total Rent Collected</TableCell>
                                <TableCell colSpan={isAdmin ? 3 : 3} className="text-right text-white">৳{totalRentCollected.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                      </Table>
                    ) : (
                      <div className="text-center text-muted-foreground p-10">No rent collection data for {month} {year}.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="expenses">
                <Card className="mt-4">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Expenses - {month} {year}</CardTitle>
                      <CardDescription>Property-related expenses for {month} {year}.</CardDescription>
                    </div>
                    {isAdmin && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                       {selectedExpenseIds.length > 0 && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2 w-full sm:w-auto">
                                <Trash2 className="h-4 w-4" />
                                Delete ({selectedExpenseIds.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {selectedExpenseIds.length} selected expenses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMassDeleteExpenses}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                         <Dialog open={isExpenseDialogOpen} onOpenChange={handleExpenseOpenChange}>
                          <DialogTrigger asChild>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" onClick={() => setEditingExpense(null)}>
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only">Add new expense</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add Expense</TooltipContent>
                            </Tooltip>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                              <DialogDescription>
                                Fill in the form below to {editingExpense ? 'update the' : 'add a new'} expense.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveExpense} className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required />
                              </div>
                               <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {expenseCategories.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {expenseCategory === 'Other' && (
                                <div className="space-y-2">
                                  <Label htmlFor="customCategory">Custom Category</Label>
                                  <Input 
                                    id="customCategory" 
                                    name="customCategory" 
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    placeholder="Enter custom category" 
                                    required 
                                  />
                                </div>
                              )}
                               <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0.00" required />
                              </div>
                               <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={editingExpense?.status || 'Due'}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Due">Due</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={editingExpense?.description} placeholder="Describe the expense..." />
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                   <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save Expense</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                    </div>}
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredExpenses.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary hover:bg-primary/90">
                              {isAdmin && <TableHead className="w-10 text-primary-foreground">
                                  <Checkbox
                                      checked={selectedExpenseIds.length > 0 && selectedExpenseIds.length === filteredExpenses.length}
                                      onCheckedChange={(checked) => {
                                          if (checked) {
                                              setSelectedExpenseIds(filteredExpenses.map(e => e.id));
                                          } else {
                                              setSelectedExpenseIds([]);
                                          }
                                      }}
                                  />
                              </TableHead>}
                            <TableHead className="text-primary-foreground">Details</TableHead>
                            <TableHead className="text-primary-foreground">Amount</TableHead>
                            <TableHead className="text-primary-foreground">Status</TableHead>
                            <TableHead className="text-primary-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredExpenses.map((expense) => (
                            <TableRow key={expense.id} className={expense.status === 'Paid' ? 'bg-green-50/50' : ''} data-state={isAdmin && selectedExpenseIds.includes(expense.id) ? "selected" : undefined}>
                              {isAdmin && <TableCell>
                                  <Checkbox
                                      checked={selectedExpenseIds.includes(expense.id)}
                                      onCheckedChange={(checked) => {
                                          setSelectedExpenseIds(prev => 
                                              checked ? [...prev, expense.id] : prev.filter(id => id !== expense.id)
                                          );
                                      }}
                                  />
                              </TableCell>}
                              <TableCell>
                                  <div className="font-medium">{expense.category}</div>
                                  <div className="text-sm text-muted-foreground hidden sm:block">{expense.description}</div>
                              </TableCell>
                              <TableCell>৳{expense.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={getExpenseStatusBadge(expense.status)}>
                                  {expense.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                    {isAdmin && <>
                                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditExpense(expense)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This action cannot be undone. This will permanently delete the expense.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-lime-500 hover:bg-lime-500/90 font-bold">
                                <TableCell colSpan={isAdmin ? 2 : 1} className="text-white text-right sm:text-left">Total Expenses</TableCell>
                                <TableCell colSpan={2} className="text-right text-white">৳{totalExpenses.toFixed(2)}</TableCell>
                                {isAdmin && <TableCell />}
                            </TableRow>
                        </TableFooter>
                      </Table>
                    ) : (
                      <div className="text-center text-muted-foreground py-10">No expense data for {month} {year}.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 space-y-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <Megaphone className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Monthly Notice</h3>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-1">
                                <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {}}>
                                            {monthlyNotice ? <Edit className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{monthlyNotice ? 'Edit' : 'Add'} Monthly Notice</DialogTitle>
                                            <DialogDescription>
                                                This notice will be displayed on the overview for {month}, {year}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleSaveNotice}>
                                            <input type="hidden" name="year" value={year} />
                                            <input type="hidden" name="month" value={months.indexOf(month)} />
                                            {monthlyNotice && <input type="hidden" name="noticeId" value={monthlyNotice.id} />}
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="notice-content">Notice Content</Label>
                                                    <Textarea id="notice-content" name="content" rows={5} defaultValue={monthlyNotice?.content} required />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                                <Button type="submit" disabled={isNoticePending}>Save Notice</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                {monthlyNotice && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the notice for this month.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <form onSubmit={handleDeleteNotice}>
                                                    <input type="hidden" name="noticeId" value={monthlyNotice.id} />
                                                    <AlertDialogAction type="submit" disabled={isNoticePending}>Delete</AlertDialogAction>
                                                </form>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    {monthlyNotice?.content ? (
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{monthlyNotice.content}</p>
                        </CardContent>
                    ) : (
                         <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">No notice for this month.</p>
                         </CardContent>
                    )}
                 </Card>


                <div className="text-center">
                    <h3 className="text-2xl font-bold tracking-tight">{settings.page_overview.financial_overview_title} - {month} {year}</h3>
                    <p className="text-muted-foreground">{settings.page_overview.financial_overview_description}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Rent Expected</CardTitle>
                            <Banknote className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
                                ৳{totalRentExpected.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">
                                ৳{totalExpenses.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Result</CardTitle>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${netResult >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {netResult >= 0 ? '+' : ''}৳{netResult.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card className="bg-secondary">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-around items-center text-center sm:text-left">
                        <div className="p-2">
                            <p className="text-sm text-secondary-foreground font-semibold">Collection Rate</p>
                            <p className="text-2xl font-bold text-primary">{collectionRate.toFixed(1)}%</p>
                        </div>
                        <div className="border-t sm:border-t-0 sm:border-l border-border w-full sm:w-auto h-auto sm:h-12 my-2 sm:my-0"></div>
                        <div className="p-2">
                            <p className="text-sm text-secondary-foreground font-semibold">Available for Deposit</p>
                            <p className="text-2xl font-bold text-success">৳{amountForDeposit.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 bg-primary text-primary-foreground">
                        <div className="flex items-center gap-4">
                           <div className="flex-shrink-0 bg-primary-foreground/10 p-3 rounded-full">
                               <Landmark className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">Bank Deposit Information</h3>
                        </div>
                        {isAdmin && (
                            <Dialog open={isDepositDialogOpen} onOpenChange={handleDepositOpenChange}>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="secondary" className="h-8 w-8">
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only">{loggedDeposit ? 'Edit Deposit' : 'Log Deposit'}</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{loggedDeposit ? 'Edit Deposit' : 'Log New Deposit'}</DialogTitle>
                                        <DialogDescription>
                                            Confirm the amount, date, and receipt for the deposit for {month}, {year}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSaveDeposit}>
                                        <input type="hidden" name="year" value={year} />
                                        <input type="hidden" name="month" value={months.indexOf(month)} />
                                        {loggedDeposit && <input type="hidden" name="depositId" value={loggedDeposit.id} />}
                                        {loggedDeposit?.receipt_url && <input type="hidden" name="receipt_url" value={loggedDeposit.receipt_url} />}
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="deposit-amount">Amount to Deposit</Label>
                                                <Input id="deposit-amount" name="amount" type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="deposit-date">Deposit Date</Label>
                                                <Input id="deposit-date" name="deposit_date" type="date" defaultValue={loggedDeposit?.deposit_date || new Date().toISOString().split('T')[0]} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Bank Receipt</Label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                                                        {receiptPreview || loggedDeposit?.receipt_url ? (
                                                            <img src={receiptPreview || loggedDeposit?.receipt_url} alt="Receipt Preview" className="h-full w-full object-contain rounded-md" data-ai-hint="document receipt"/>
                                                        ) : (
                                                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <Button type="button" variant="outline" onClick={() => receiptInputRef.current?.click()}>
                                                        <Upload className="mr-2 h-4 w-4"/>
                                                        Upload Image
                                                    </Button>
                                                    <Input ref={receiptInputRef} type="file" className="hidden" accept="image/*" onChange={handleReceiptFileChange} />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter className="justify-between">
                                            {loggedDeposit ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button type="button" variant="destructive" disabled={isUploading}>Delete</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                         <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will remove the deposit log and receipt for {month}, {year}. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                         <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <form onSubmit={handleDeleteDeposit}>
                                                                <input type="hidden" name="depositId" value={loggedDeposit.id} />
                                                                <input type="hidden" name="receiptPath" value={loggedDeposit.receipt_url} />
                                                                <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                                            </form>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (<div></div>)}
                                            <div className="flex gap-2">
                                                <DialogClose asChild><Button type="button" variant="outline" disabled={isUploading}>Cancel</Button></DialogClose>
                                                <Button type="submit" disabled={isUploading}>
                                                   {isUploading && <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>}
                                                   {isUploading ? 'Saving...' : 'Save Deposit'}
                                                </Button>
                                            </div>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 grid md:grid-cols-3 gap-6 items-start">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                            <p className="font-semibold">{settings.bankName || "Not Set"}</p>
                            {settings.bankLogoUrl && (
                                <img src={settings.bankLogoUrl} alt={`${settings.bankName} logo`} className="h-10 mt-2 object-contain" data-ai-hint="logo bank" />
                            )}
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                            <p className="font-semibold">{settings.bankAccountNumber || "Not Set"}</p>
                        </div>
                        {loggedDeposit ? (
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Deposit Status</p>
                              <div className="flex items-center gap-2 text-success font-semibold">
                                  <CheckCircle className="h-5 w-5" />
                                  <span>Deposited on {format(parseISO(loggedDeposit.deposit_date), 'dd MMM, yyyy')}</span>
                              </div>
                               {loggedDeposit.receipt_url && (
                                    <Button asChild variant="secondary" size="sm" className="mt-2">
                                        <a href={loggedDeposit.receipt_url} target="_blank" rel="noopener noreferrer">
                                            <Eye className="mr-2 h-4 w-4" /> View Receipt
                                        </a>
                                    </Button>
                                )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                             <p className="text-sm font-medium text-muted-foreground">Deposit Status</p>
                             <div className="flex items-center gap-2 text-warning-foreground font-semibold">
                                 <AlertCircle className="h-5 w-5" />
                                 <span>Pending Deposit</span>
                             </div>
                           </div>
                        )}
                    </CardContent>
                     {loggedDeposit ? (
                        <CardFooter className="bg-success/10 p-4 text-center">
                            <p className="font-bold text-xl text-success w-full">৳{loggedDeposit.amount.toFixed(2)} Deposited</p>
                        </CardFooter>
                     ) : (
                        <CardFooter className="bg-secondary p-4 text-center">
                            <p className="font-bold text-xl text-primary w-full">৳{amountForDeposit.toFixed(2)} to Deposit</p>
                        </CardFooter>
                     )}
                </Card>
            </div>

          </div>
        </TabsContent>
      ))}
    </Tabs>
    {selectedTenantForSheet && (
      <TenantDetailSheet 
          tenant={selectedTenantForSheet}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
      />
    )}
     
    </TooltipProvider>
  )
}
