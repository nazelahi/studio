

"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry, Deposit, Notice, WorkDetail, ToastFn } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Banknote, ArrowUpCircle, ArrowDownCircle, PlusCircle, Trash2, Pencil, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, Copy, X, FileText, Upload, Building, Landmark, CalendarCheck, Edit, Eye, Image as ImageIcon, Megaphone, Download, Percent, Receipt, TrendingDown, Calculator } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { logDepositAction, deleteDepositAction } from "@/app/actions/deposits"
import { saveNoticeAction, deleteNoticeAction } from "@/app/actions/notices"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useProtection } from "@/context/protection-context"
import { Separator } from "./ui/separator"


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

interface MonthlyOverviewTabProps {
  year: number;
  mobileSelectedMonth: number;
}


export function MonthlyOverviewTab({ year, mobileSelectedMonth }: MonthlyOverviewTabProps) {
  const currentMonthIndex = year === new Date().getFullYear() ? new Date().getMonth() : 0;
  const [desktopSelectedMonth, setDesktopSelectedMonth] = React.useState(months[currentMonthIndex]);
  const [isMobile, setIsMobile] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedMonth = isMobile ? months[mobileSelectedMonth] : desktopSelectedMonth;
  const monthIndex = months.indexOf(selectedMonth);

  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { withProtection } = useProtection();

  const { tenants, expenses, rentData, deposits, notices, addRentEntry, addRentEntriesBatch, updateRentEntry, deleteRentEntry, addExpense, updateExpense, deleteExpense, syncTenantsForMonth, syncExpensesFromPreviousMonth, loading, deleteMultipleRentEntries, deleteMultipleExpenses, refreshData } = useData();

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
    return rentData.filter(entry => entry.year === year && entry.month === monthIndex);
  }, [rentData, monthIndex, year]);

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(expense => {
        if (!expense.date) return false;
        try {
            const expenseDate = parseISO(expense.date);
            return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === year;
        } catch {
            return false;
        }
      });
  }, [expenses, monthIndex, year]);
  
  const loggedDeposit = React.useMemo(() => {
    return deposits.find(d => d.year === year && d.month === monthIndex);
  }, [deposits, year, monthIndex]);

  const monthlyNotice = React.useMemo(() => {
    return notices.find(n => n.year === year && n.month === monthIndex);
  }, [notices, year, monthIndex]);


  // Clear selections when month or year changes
  React.useEffect(() => {
    setSelectedRentEntryIds([]);
    setSelectedExpenseIds([]);
  }, [monthIndex, year]);

  const totalRentCollected = filteredTenantsForMonth
    .filter(t => t.status === 'Paid')
    .reduce((acc, t) => acc + t.rent, 0);
  
  const totalRentExpected = filteredTenantsForMonth.reduce((acc, t) => acc + t.rent, 0);
  const collectionRate = totalRentExpected > 0 ? (totalRentCollected / totalRentExpected) * 100 : 0;
  const pendingRent = totalRentExpected - totalRentCollected;

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
        } else if ('join_date' in entry && entry.join_date) {
            try {
                const parsedDate = parseISO(entry.join_date);
                entryYear = parsedDate.getFullYear();
                entryMonth = parsedDate.getMonth();
            } catch (e) {
                console.error("Invalid joinDate:", entry.join_date);
                return;
            }
        } else {
            return; 
        }

        const isMoreRecent = !existing || entryYear > existing.lastSeen.year || (entryYear === existing.lastSeen.year && entryMonth > existing.lastSeen.month);

        if (isMoreRecent) {
            allTenantsMap.set(uniqueId, {
                id: (entry as any).tenant_id || (entry as any).id,
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
  
  const handleEditRentEntry = (entry: RentEntry, e: React.MouseEvent) => {
    withProtection(() => {
        setEditingRentEntry(entry);
        setSelectedHistoricalTenant(null);
        setIsRentDialogOpen(true);
    }, e);
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

  const handleDeleteRentEntry = (entry: RentEntry) => {
    deleteRentEntry(entry.id, toast);
  };
  
  const handleSaveRentEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const rentEntryData = {
        name: selectedHistoricalTenant?.name || formData.get('name') as string,
        property: selectedHistoricalTenant?.property || formData.get('property') as string,
        rent: Number(formData.get('amount')),
        payment_date: formData.get('payment_date') as string || undefined,
        collected_by: formData.get('collected_by') as string,
        status: formData.get('status') as RentEntry['status'],
        avatar: selectedHistoricalTenant?.avatar || editingRentEntry?.avatar || 'https://placehold.co/80x80.png',
        tenant_id: selectedHistoricalTenant?.id || editingRentEntry?.tenant_id
    };

    if(editingRentEntry) {
        await updateRentEntry({ ...editingRentEntry, ...rentEntryData }, toast);
        toast({ title: "Rent Entry Updated", description: "The entry has been successfully updated." });
    } else {
        await addRentEntry(rentEntryData, year, monthIndex, toast);
        toast({ title: "Rent Entry Added", description: "The new entry has been successfully added." });
    }

    setIsRentDialogOpen(false);
    setEditingRentEntry(null);
    setSelectedHistoricalTenant(null);
  };

    const handleSyncTenants = async () => {
        const syncedCount = await syncTenantsForMonth(year, monthIndex, toast);

        if (syncedCount > 0) {
            toast({
                title: "Sync Complete",
                description: `${syncedCount} tenant(s) have been added to the rent roll for ${months[monthIndex]}.`,
            });
        } else {
             toast({
                title: "Already up to date",
                description: "All active tenants are already in the rent roll for this month.",
            });
        }
    };
    
  const handleMassDeleteRentEntries = () => {
    deleteMultipleRentEntries(selectedRentEntryIds, toast);
    setSelectedRentEntryIds([]);
  }

  const handleViewDetails = (entry: RentEntry) => {
    const tenant = tenants.find(t => t.id === entry.tenant_id);
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
      await updateExpense({ ...editingExpense, ...expenseData }, toast);
      toast({ title: "Expense Updated", description: "The expense has been successfully updated." });
    } else {
      await addExpense(expenseData, toast);
      toast({ title: "Expense Added", description: "The new expense has been successfully added." });
    }

    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
    setExpenseCategory('');
    setCustomCategory('');
  };
  
  const handleEditExpense = (expense: Expense, e: React.MouseEvent) => {
    withProtection(() => {
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
    }, e);
  };
  
  const handleDeleteExpense = (expense: Expense) => {
    deleteExpense(expense.id, toast);
  };
  
  const handleExpenseOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingExpense(null);
      setExpenseCategory('');
      setCustomCategory('');
    }
    setIsExpenseDialogOpen(isOpen);
  };
  
  const handleMassDeleteExpenses = () => {
    deleteMultipleExpenses(selectedExpenseIds, toast);
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

        const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Get an array of arrays
          blankrows: false,
        });

        if (json.length < 2) {
          toast({ title: "Empty or invalid sheet", description: "The sheet must have a header row and at least one data row.", variant: "destructive" });
          return;
        }

        const header: string[] = json[0].map((h: any) => String(h).toLowerCase().trim().replace(/ /g, '_'));
        const rows = json.slice(1);

        const rentEntriesToCreate = rows.map(rowArray => {
          const row: { [key: string]: any } = {};
          header.forEach((h, i) => {
            row[h] = rowArray[i];
          });

          const validStatuses = ["paid", "pending", "overdue"];
          const statusInput = String(row.status || 'pending').toLowerCase();
          const status = validStatuses.includes(statusInput) ? (statusInput.charAt(0).toUpperCase() + statusInput.slice(1)) as RentEntry['status'] : "Pending";

          let paymentDate: string | undefined = undefined;
          const dateInput = row.payment_date;
          if (dateInput) {
            if (typeof dateInput === 'number') {
              const date = XLSX.SSF.parse_date_code(dateInput);
              paymentDate = new Date(date.y, date.m - 1, date.d).toISOString().split('T')[0];
            } else {
              const parsed = new Date(dateInput);
              if (!isNaN(parsed.getTime())) {
                paymentDate = parsed.toISOString().split('T')[0];
              }
            }
          }
          
          return {
            name: String(row.name || ''),
            property: String(row.property || ''),
            rent: Number(row.rent || 0),
            status: status,
            payment_date: paymentDate,
            collected_by: String(row.collected_by || ''),
          };
        }).filter(entry => entry.name && entry.property && entry.rent > 0);
        
        if (rentEntriesToCreate.length === 0) {
          toast({ title: "No Valid Data Found", description: "Ensure your file has columns for at least: Name, Property, and Rent (case-insensitive).", variant: "destructive" });
          return;
        }
        
        await addRentEntriesBatch(rentEntriesToCreate, year, monthIndex, toast);

        toast({ title: "Import Successful", description: `${rentEntriesToCreate.length} entries have been added to ${selectedMonth}, ${year}.` });

      } catch (error) {
        console.error("Error importing file:", error);
        toast({ title: "Import Failed", description: "There was an error processing your file. Please check the console for details.", variant: "destructive" });
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
        toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
    };
    reader.readAsArrayBuffer(file);
  };
  
    const handleDownloadTemplate = () => {
        const headers = ["name", "property", "rent", "status", "payment_date", "collected_by"];
        const sampleData = [
            ["John Doe", "Apt 101", 15000, "Paid", "2024-05-05", "Manager"],
            ["Jane Smith", "Apt 202", 16000, "Pending", "", "Bank Transfer"]
        ];
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rent Roll Template");
        XLSX.writeFile(workbook, "RentRoll_Template.xlsx");
        toast({ title: "Template Downloaded", description: "RentRoll_Template.xlsx has been downloaded." });
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
        const filePath = `${year}-${monthIndex}/${Date.now()}.${fileExt}`;
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
    formData.set('month', monthIndex.toString());

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
            toast({ title: 'Notice Deleted', description: 'The monthly notice has been removed.' });
        }
    });
  }

  const handleSyncExpenses = async () => {
    const syncedCount = await syncExpensesFromPreviousMonth(year, monthIndex, toast);

    if (syncedCount > 0) {
        toast({
            title: "Sync Complete",
            description: `${syncedCount} expense(s) from the previous month have been copied to ${months[monthIndex]}.`,
        });
    } else {
         toast({
            title: "No Expenses to Sync",
            description: "There were no expenses recorded in the previous month to copy over.",
        });
    }
  };
  
    const formatCurrency = (amount: number) => {
        if (amount === undefined || amount === null) return '-';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
    };

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
    <Tabs value={desktopSelectedMonth} onValueChange={setDesktopSelectedMonth} className="w-full pt-4 md:pt-0">
      
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
                     {isAdmin && (
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            {selectedRentEntryIds.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive" className="gap-2 w-full sm:w-auto">
                                            <Trash2 className="h-4 w-4" />
                                            Delete ({selectedRentEntryIds.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <form onSubmit={(e) => { e.preventDefault(); withProtection(handleMassDeleteRentEntries, e as any); }}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will mark {selectedRentEntryIds.length} selected rent entries as deleted. You can undo this action.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </form>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                             <div className="flex gap-2 w-full">
                                <Dialog open={isRentDialogOpen} onOpenChange={handleRentOpenChange}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add New Entry
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>{editingRentEntry ? 'Edit Rent Entry' : 'Add New Rent Entry'}</DialogTitle>
                                            <DialogDescription>Fill in the form to {editingRentEntry ? 'update the' : 'add a new'} rent entry for {month}, {year}.</DialogDescription>
                                        </DialogHeader>
                                        <form ref={formRef} onSubmit={handleSaveRentEntry} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                                            <input type="hidden" name="month" value={monthIndex} />
                                            <input type="hidden" name="year" value={year} />
                                            {editingRentEntry && <input type="hidden" name="id" value={editingRentEntry.id} />}
                                            {!editingRentEntry && (
                                                <div className="space-y-2">
                                                    <Label>Tenant</Label>
                                                    {selectedHistoricalTenant ? (
                                                        <div className="flex items-center justify-between p-2 border rounded-md">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={selectedHistoricalTenant.avatar} />
                                                                    <AvatarFallback>{selectedHistoricalTenant.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{selectedHistoricalTenant.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{selectedHistoricalTenant.property}</p>
                                                                </div>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleClearSelectedTenant}><X className="h-4 w-4" /></Button>
                                                        </div>
                                                    ) : (
                                                        <Popover open={isTenantFinderOpen} onOpenChange={setIsTenantFinderOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" role="combobox" aria-expanded={isTenantFinderOpen} className="w-full justify-between">
                                                                    Select past tenant...
                                                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50"/>
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                <Command>
                                                                    <CommandInput placeholder="Search tenant..." />
                                                                    <CommandEmpty>No tenant found.</CommandEmpty>
                                                                    <CommandList>
                                                                        <CommandGroup>
                                                                            {historicalTenants.map((tenant) => (
                                                                                <CommandItem key={tenant.uniqueId} value={`${tenant.name} ${tenant.property}`} onSelect={() => handleSelectHistoricalTenant(tenant)}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <Avatar className="h-8 w-8"><AvatarImage src={tenant.avatar} /><AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback></Avatar>
                                                                                        <div>
                                                                                            <div className="font-medium">{tenant.name}</div>
                                                                                            <div className="text-xs text-muted-foreground">{tenant.property} &middot; ৳{tenant.rent}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </div>
                                            )}
                                            <div className="space-y-2"><Label htmlFor="name">Tenant Name</Label><Input id="name" name="name" defaultValue={editingRentEntry?.name} required disabled={!!selectedHistoricalTenant} /></div>
                                            <div className="space-y-2"><Label htmlFor="property">Property/Unit</Label><Input id="property" name="property" defaultValue={editingRentEntry?.property} required disabled={!!selectedHistoricalTenant}/></div>
                                            <div className="space-y-2"><Label htmlFor="amount">Rent Amount</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingRentEntry?.rent} required /></div>
                                            <div className="space-y-2"><Label htmlFor="status">Status</Label><Select name="status" defaultValue={editingRentEntry?.status || 'Pending'}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select></div>
                                            <div className="space-y-2"><Label htmlFor="payment_date">Payment Date</Label><Input id="payment_date" name="payment_date" type="date" defaultValue={editingRentEntry?.payment_date} /></div>
                                            <div className="space-y-2"><Label htmlFor="collected_by">Collected By</Label><Input id="collected_by" name="collected_by" defaultValue={editingRentEntry?.collected_by} /></div>
                                            <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Entry</Button></DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" onClick={handleSyncTenants} className="flex-1 sm:flex-initial"><RefreshCw className="h-4 w-4" /><span className="sr-only">Sync tenants</span></Button></TooltipTrigger><TooltipContent>Sync</TooltipContent></Tooltip>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                                <Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" onClick={handleDownloadTemplate}><Download className="h-4 w-4" /><span className="sr-only">Download Template</span></Button></TooltipTrigger><TooltipContent>Download Template</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" onClick={handleImportClick}><Upload className="h-4 w-4" /><span className="sr-only">Import from file</span></Button></TooltipTrigger><TooltipContent>Import</TooltipContent></Tooltip>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .csv" onChange={handleFileChange}/>
                            </div>
                        </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                            {isAdmin && <TableHead className="w-10 text-inherit">
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
                            <TableHead className="text-inherit">Tenant</TableHead>
                            <TableHead className="hidden md:table-cell text-inherit">Collected By</TableHead>
                            <TableHead className="hidden sm:table-cell text-inherit">Payment Date</TableHead>
                            <TableHead className="text-inherit">Status</TableHead>
                            <TableHead className="hidden sm:table-cell text-inherit">Amount</TableHead>
                            <TableHead className="text-inherit">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTenantsForMonth.length > 0 ? (
                            filteredTenantsForMonth.map((entry) => (
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
                                <TableCell className="hidden md:table-cell">{entry.collected_by || '-'}</TableCell>
                                <TableCell className="hidden sm:table-cell">{entry.payment_date ? format(parseISO(entry.payment_date), "dd MMM yyyy") : '-'}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadge(entry.status)} variant="outline">
                                    {getStatusIcon(entry.status)}
                                    {entry.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">৳{entry.rent.toFixed(2)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {entry.status === 'Paid' && (
                                       <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => router.push(`/receipt/${entry.id}`)}>
                                          <Receipt className="h-4 w-4" />
                                          <span className="sr-only">View Receipt</span>
                                      </Button>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleViewDetails(entry)}>
                                      <FileText className="h-4 w-4" />
                                      <span className="sr-only">View Details</span>
                                    </Button>
                                    {isAdmin && <>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleEditRentEntry(entry, e)}>
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
                                                <form onSubmit={(e) => { e.preventDefault(); withProtection(() => handleDeleteRentEntry(entry), e as any); }}>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      This will mark the rent entry for {entry.name} as deleted. You can undo this action.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </form>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                      </>
                                    }
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground p-10">No rent collection data for {month} {year}.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                        {filteredTenantsForMonth.length > 0 && (
                          <TableFooter>
                            <TableRow style={{ backgroundColor: 'hsl(var(--table-footer-background))', color: 'hsl(var(--table-footer-foreground))' }} className="font-bold hover:bg-[hsl(var(--table-footer-background)/0.9)]">
                                <TableCell colSpan={isAdmin ? 7 : 6} className="text-inherit p-2">
                                  <div className="flex flex-col sm:flex-row items-center justify-between px-2">
                                    <div className="sm:hidden text-center text-inherit font-bold">Total Rent Collected</div>
                                    <div className="hidden sm:block text-left text-inherit font-bold">Total Rent Collected</div>
                                    <div className="text-inherit font-bold">৳{totalRentCollected.toFixed(2)}</div>
                                  </div>
                                </TableCell>
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
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
                    {isAdmin && 
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        {selectedExpenseIds.length > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2 w-full sm:w-auto">
                                <Trash2 className="h-4 w-4" />
                                Delete ({selectedExpenseIds.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <form onSubmit={(e) => { e.preventDefault(); withProtection(handleMassDeleteExpenses, e as any); }}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark {selectedExpenseIds.length} selected expenses as deleted. You can undo this action.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </form>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <div className="flex gap-2 w-full">
                            <Dialog open={isExpenseDialogOpen} onOpenChange={handleExpenseOpenChange}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full flex-1">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New Expense
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                                        <DialogDescription>Fill in the form below to {editingExpense ? 'update the' : 'add a new'} expense.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSaveExpense} className="grid gap-4 py-4">
                                        <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required /></div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select value={expenseCategory} onValueChange={setExpenseCategory}><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{expenseCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select>
                                        </div>
                                        {expenseCategory === 'Other' && (<div className="space-y-2"><Label htmlFor="customCategory">Custom Category</Label><Input id="customCategory" name="customCategory" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter custom category" required/></div>)}
                                        <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0.00" required /></div>
                                        <div className="space-y-2"><Label htmlFor="status">Status</Label><Select name="status" defaultValue={editingExpense?.status || 'Due'}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Due">Due</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent></Select></div>
                                        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={editingExpense?.description} placeholder="Describe the expense..." /></div>
                                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Expense</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                             <Tooltip>
                                <TooltipTrigger asChild><Button size="icon" variant="outline" onClick={handleSyncExpenses} className="flex-1 sm:flex-initial"><RefreshCw className="h-4 w-4" /><span className="sr-only">Sync expenses</span></Button></TooltipTrigger>
                                <TooltipContent>Sync from Previous Month</TooltipContent>
                            </Tooltip>
                        </div>
                      </div>
                    }
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                          {isAdmin && <TableHead className="w-10 text-inherit">
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
                          <TableHead className="text-inherit">Details</TableHead>
                          <TableHead className="text-inherit">Amount</TableHead>
                          <TableHead className="text-inherit">Status</TableHead>
                          <TableHead className="text-inherit">Actions</TableHead>
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
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleEditExpense(expense, e)}>
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
                                        <form onSubmit={(e) => { e.preventDefault(); withProtection(() => handleDeleteExpense(expense), e as any); }}>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will mark the expense as deleted. You can undo this action.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </form>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                           {filteredExpenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <span>No expense data for {month} {year}.</span>
                                </div>
                                </TableCell>
                            </TableRow>
                            )}
                      </TableBody>
                      {filteredExpenses.length > 0 && (
                        <TableFooter>
                          <TableRow style={{ backgroundColor: 'hsl(var(--table-footer-background))', color: 'hsl(var(--table-footer-foreground))' }} className="font-bold hover:bg-[hsl(var(--table-footer-background)/0.9)]">
                              <TableCell colSpan={isAdmin ? 5 : 4} className="p-2 text-inherit">
                                  <div className="flex flex-col sm:flex-row items-center justify-between px-2">
                                      <div className="text-base font-bold text-inherit">Total Expenses</div>
                                      <div className="text-base font-bold text-inherit">৳{totalExpenses.toFixed(2)}</div>
                                  </div>
                              </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <Card>
                <CardContent className="p-0">
                    <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-4">
                        <Card className="border-0 shadow-none rounded-none border-r border-green-200 bg-green-50/50 dark:border-green-600/30 dark:bg-green-500/10 p-4">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Rent Collected</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="text-2xl font-bold text-green-800 dark:text-green-300">{formatCurrency(totalRentCollected)}</div>
                                <p className="text-xs text-green-600 dark:text-green-500">{collectionRate.toFixed(1)}% of total</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-none rounded-none border-r border-orange-200 bg-orange-50/50 dark:border-orange-600/30 dark:bg-orange-500/10 p-4">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Pending Rent</CardTitle>
                                <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">{formatCurrency(pendingRent)}</div>
                                <p className="text-xs text-orange-600 dark:text-orange-500">Yet to collect</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-none rounded-none border-r border-red-200 bg-red-50/50 dark:border-red-600/30 dark:bg-red-500/10 p-4">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Total Expenses</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="text-2xl font-bold text-red-800 dark:text-red-300">{formatCurrency(totalExpenses)}</div>
                                <p className="text-xs text-red-600 dark:text-red-500">This month</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-none rounded-none border-blue-200 bg-blue-50/50 dark:border-blue-600/30 dark:bg-blue-500/10 p-4">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Net Amount</CardTitle>
                                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                    {netResult >= 0 ? '+' : ''}{formatCurrency(netResult)}
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-500">Profit</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 space-y-6">
                 <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/50">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <Megaphone className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Monthly Notice</h3>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-1">
                                <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-800/50" onClick={() => {}}>
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
                                            <input type="hidden" name="month" value={monthIndex} />
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
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-yellow-100 dark:hover:bg-yellow-800/50">
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
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">{monthlyNotice.content}</p>
                        </CardContent>
                    ) : (
                         <CardContent className="p-4 pt-0">
                            <p className="text-sm text-yellow-600 dark:text-yellow-500">No notice for this month.</p>
                         </CardContent>
                    )}
                 </Card>


                
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-3 p-3" style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }}>
                        <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-inherit" />
                            <h3 className="font-semibold text-sm text-inherit">Bank Deposit Information</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 grid md:grid-cols-3 gap-6 items-start">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                             <div className="flex items-center gap-2">
                                {settings.bankLogoUrl && (
                                    <img src={settings.bankLogoUrl} alt={`${settings.bankName} logo`} className="h-6 object-contain" data-ai-hint="logo bank" />
                                )}
                                <p className="font-semibold">{settings.bankName || "Not Set"}</p>
                            </div>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                            <p className="font-semibold">{settings.bankAccountNumber || "Not Set"}</p>
                        </div>
                        <Dialog open={isDepositDialogOpen} onOpenChange={handleDepositOpenChange}>
                          {loggedDeposit ? (
                              <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Deposit Status</p>
                                    <DialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 -mr-2" disabled={!isAdmin}>
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Edit Deposit</span>
                                      </Button>
                                    </DialogTrigger>
                                  </div>
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
                                 <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Deposit Status</p>
                                    <DialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 -mr-2" disabled={!isAdmin}>
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="sr-only">Log Deposit</span>
                                      </Button>
                                    </DialogTrigger>
                                  </div>
                                 <div className="flex items-center gap-2 text-warning-foreground font-semibold">
                                     <AlertCircle className="h-5 w-5" />
                                     <span>Pending Deposit</span>
                                 </div>
                               </div>
                            )}
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{loggedDeposit ? 'Edit Deposit' : 'Log New Deposit'}</DialogTitle>
                                    <DialogDescription>
                                        Confirm the amount, date, and receipt for the deposit for {month}, {year}.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSaveDeposit}>
                                    <input type="hidden" name="year" value={year} />
                                    <input type="hidden" name="month" value={monthIndex} />
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
                    </CardContent>
                     {loggedDeposit ? (
                        <CardFooter style={{ backgroundColor: 'hsl(var(--success)/0.1)', borderTop: '1px solid hsl(var(--border))'}} className="p-2 text-center">
                            <p className="font-bold text-base text-success w-full">৳{loggedDeposit.amount.toFixed(2)} Deposited</p>
                        </CardFooter>
                     ) : (
                        <CardFooter style={{ backgroundColor: 'hsl(var(--secondary))', borderTop: '1px solid hsl(var(--border))'}} className="p-2 text-center">
                            <p className="font-bold text-base text-primary w-full">৳{amountForDeposit.toFixed(2)} to Deposit</p>
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

    







    

    




    

