

"use client"

import * as React from "react"
import type { Tenant, Expense, RentEntry, Deposit, Notice, WorkDetail, ToastFn } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Banknote, ArrowUpCircle, ArrowDownCircle, PlusCircle, Trash2, Pencil, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, Copy, X, FileText, Upload, Building, Landmark, CalendarCheck, Edit, Eye, Image as ImageIcon, Megaphone, Download, Percent, Receipt, TrendingDown, Calculator, LoaderCircle, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { useAppContext } from "@/context/app-context"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { Checkbox } from "./ui/checkbox"
import { TenantDetailSheet } from "./tenant-detail-sheet"
import * as XLSX from 'xlsx';
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { logDepositAction, deleteDepositAction } from "@/app/actions/deposits"
import { saveNoticeAction, deleteNoticeAction } from "@/app/actions/notices"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useProtection } from "@/context/protection-context"
import { Separator } from "./ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"

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

const getStatusNameColor = (status: RentEntry["status"]) => {
    switch (status) {
        case "Paid": return "text-green-600";
        case "Overdue": return "text-red-600";
        default: return "text-foreground";
    }
}


const getStatusIcon = (status: RentEntry["status"]) => {
    switch(status) {
        case "Paid": return <CheckCircle className="h-4 w-4 text-green-500"/>;
        case "Overdue": return <XCircle className="h-4 w-4 text-red-500"/>;
        case "Pending": return <AlertCircle className="h-4 w-4 text-yellow-500"/>
        default: return null;
    }
}


const getExpenseStatusBadge = (status: Expense["status"]) => {
    return status === "Paid" ? "bg-success text-success-foreground hover:bg-success/80"
      : "bg-warning text-warning-foreground hover:bg-warning/80";
};

const getExpenseStatusIcon = (status: Expense["status"]) => {
    switch(status) {
        case "Paid": return <CheckCircle className="h-4 w-4 text-green-500"/>;
        case "Due": return <AlertCircle className="h-4 w-4 text-yellow-500"/>;
        default: return null;
    }
}

interface EditableAmountProps {
    initialAmount: number;
    onSave: (newAmount: number) => void;
    currencySymbol: string;
    isAdmin: boolean;
    withProtection: (action: () => void, event?: React.MouseEvent) => void;
    className?: string;
}

const EditableAmount: React.FC<EditableAmountProps> = ({ initialAmount, onSave, currencySymbol, isAdmin, withProtection, className }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [amount, setAmount] = React.useState(initialAmount);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        const newAmount = Number(amount);
        if (newAmount !== initialAmount) {
            onSave(newAmount);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isAdmin) {
            withProtection(() => {
                setIsEditing(true);
            }, e);
        }
    };
    
    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                        setAmount(initialAmount);
                        setIsEditing(false);
                    }
                }}
                className={cn("h-8 w-24 text-left", className)}
            />
        );
    }

    return (
        <button 
            onClick={handleClick}
            disabled={!isAdmin}
            className={cn("text-left", isAdmin && "hover:bg-muted rounded-md px-2 py-1 transition-colors", className)}>
                {formatCurrency(amount, currencySymbol)}
        </button>
    );
};


export function MonthlyOverviewTab() {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonthIndex);

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i));

  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();

  const { tenants, expenses, rentData, deposits, notices, addRentEntry, addRentEntriesBatch, updateRentEntry, deleteRentEntry, syncTenantsForMonth, syncExpensesFromPreviousMonth, loading, deleteMultipleRentEntries, deleteMultipleExpenses, refreshData, getRentEntryById, addExpense, updateExpense, deleteExpense, settings } = useAppContext();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [expenseCategory, setExpenseCategory] = React.useState('');
  const [customCategory, setCustomCategory] = React.useState('');
  const [isSyncingExpenses, startExpenseSyncTransition] = React.useTransition();


  const [isRentDialogOpen, setIsRentDialogOpen] = React.useState(false);
  const [editingRentEntry, setEditingRentEntry] = React.useState<RentEntry | null>(null);
  const [isSyncingTenants, startTenantSyncTransition] = React.useTransition();
  
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
  const [navigatingToReceiptId, setNavigatingToReceiptId] = React.useState<string | null>(null);
  const [isNavigating, startNavigation] = React.useTransition();

  const [showAllRent, setShowAllRent] = React.useState(false);
  const [showAllExpenses, setShowAllExpenses] = React.useState(false);


  const formRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);


  const filteredTenantsForMonth = React.useMemo(() => {
    const tenantsForMonth = rentData.filter(entry => entry.year === selectedYear && entry.month === selectedMonth);
    
    const extractNumber = (str: string) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : Infinity;
    };
    
    return tenantsForMonth.sort((a, b) => {
        const numA = extractNumber(a.property);
        const numB = extractNumber(b.property);
        return numA - numB;
    });
  }, [rentData, selectedMonth, selectedYear]);

  const filteredExpenses = React.useMemo(() => {
     return expenses.filter(expense => {
      if (!expense.date) return false;
      try {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === selectedYear && expenseDate.getMonth() === selectedMonth;
      } catch {
        return false;
      }
    });
  }, [expenses, selectedMonth, selectedYear]);
  
  const loggedDeposit = React.useMemo(() => {
    return deposits.find(d => d.year === selectedYear && d.month === selectedMonth);
  }, [deposits, selectedYear, selectedMonth]);

  const monthlyNotice = React.useMemo(() => {
    return notices.find(n => n.year === selectedYear && n.month === selectedMonth);
  }, [notices, selectedYear, selectedMonth]);


  React.useEffect(() => {
    setSelectedRentEntryIds([]);
    setSelectedExpenseIds([]);
    setShowAllRent(false);
    setShowAllExpenses(false);
  }, [selectedMonth, selectedYear]);

  const totalRentCollected = filteredTenantsForMonth
    .filter(t => t.status === 'Paid')
    .reduce((acc, t) => acc + t.rent, 0);
  
  const totalRentExpected = filteredTenantsForMonth.reduce((acc, t) => acc + t.rent, 0);
  const collectionRate = totalRentExpected > 0 ? (totalRentCollected / totalRentExpected) * 100 : 0;
  const pendingRent = totalRentExpected - totalRentCollected;

  const totalExpensesPaid = filteredExpenses.filter(e => e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0);
  
  const netResult = totalRentCollected - totalExpensesPaid;
  const amountForDeposit = netResult > 0 ? netResult : 0;

    React.useEffect(() => {
        if (loggedDeposit) {
            setDepositAmount(String(loggedDeposit.amount || ''));
        } else {
             setDepositAmount(amountForDeposit > 0 ? amountForDeposit.toFixed(2) : '');
        }
    }, [loggedDeposit, amountForDeposit]);



  const historicalTenants = React.useMemo(() => {
    const allTenantsMap = new Map<string, HistoricalTenant>();

    const processEntry = (entry: RentEntry | Tenant, type: 'rent' | 'tenant') => {
        const uniqueId = `${entry.name.toLowerCase()}-${entry.property.toLowerCase()}`;
        const existing = allTenantsMap.get(uniqueId);

        let entryMonth, entryYear;

        if(type === 'rent' && 'year' in entry && 'month' in entry) {
            entryYear = entry.year;
            entryMonth = entry.month;
        } else if ('join_date' in entry && entry.join_date) {
            try {
                const parsedDate = new Date(entry.join_date);
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
        await addRentEntry(rentEntryData, selectedYear, selectedMonth, toast);
        toast({ title: "Rent Entry Added", description: "The new entry has been successfully added." });
    }

    setIsRentDialogOpen(false);
    setEditingRentEntry(null);
    setSelectedHistoricalTenant(null);
  };

    const handleSyncTenants = () => {
        startTenantSyncTransition(async () => {
            const syncedCount = await syncTenantsForMonth(selectedYear, selectedMonth, toast);
            if (syncedCount > 0) {
                toast({
                    title: "Sync Complete",
                    description: `${syncedCount} tenant(s) have been added to the rent roll for ${months[selectedMonth]}.`,
                });
            } else {
                toast({
                    title: "Already up to date",
                    description: "All active tenants are already in the rent roll for this month.",
                });
            }
        });
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

  const handleStatusChange = (entry: RentEntry, newStatus: RentEntry['status']) => {
    withProtection(async () => {
        let payment_date = entry.payment_date;
        if (newStatus === 'Paid' && !payment_date) {
            payment_date = new Date().toISOString().split('T')[0];
        }
        await updateRentEntry({ ...entry, status: newStatus, payment_date }, toast);
        toast({ title: "Status Updated", description: `${entry.name}'s status is now ${newStatus}.`});
    });
  }

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
      await updateExpense({ ...editingExpense, ...expenseData } as any, toast);
      toast({ title: "Expense Updated", description: "The expense has been successfully updated." });
    } else {
      await addExpense(expenseData as any, toast);
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
  
  const handleExpenseStatusChange = (expense: Expense, newStatus: Expense['status']) => {
    withProtection(async () => {
        await updateExpense({ ...expense, status: newStatus } as any, toast);
        toast({ title: "Status Updated", description: `Expense status is now ${newStatus}.`});
    });
  }


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
          header: 1, 
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
              const excelEpoch = new Date(1899, 11, 30);
              const excelDate = new Date(excelEpoch.getTime() + dateInput * 86400000);
              paymentDate = formatDate(excelDate.toISOString(), 'yyyy-MM-dd');
            } else {
              const parsed = new Date(dateInput);
              if (!isNaN(parsed.getTime())) {
                paymentDate = formatDate(parsed.toISOString(), 'yyyy-MM-dd');
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
        
        await addRentEntriesBatch(rentEntriesToCreate, selectedYear, selectedMonth, toast);

        toast({ title: "Import Successful", description: `${rentEntriesToCreate.length} entries have been added to ${months[selectedMonth]}, ${selectedYear}.` });

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
    formData.set('amount', depositAmount); 
    let receiptUrl: string | null = loggedDeposit?.receipt_url || null;

    if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `${selectedYear}-${selectedMonth}/${Date.now()}.${fileExt}`;
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

        if (loggedDeposit?.receipt_url) {
            formData.set('oldReceiptUrl', loggedDeposit.receipt_url);
        }
    }

    formData.set('receipt_url', receiptUrl || '');

    const result = await logDepositAction(formData);
    
    if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
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
    formData.set('month', selectedMonth.toString());

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

  const handleSyncExpenses = () => {
      startExpenseSyncTransition(async () => {
        const syncedCount = await syncExpensesFromPreviousMonth(selectedYear, selectedMonth, toast);
        if (syncedCount > 0) {
            toast({
                title: "Sync Complete",
                description: `${syncedCount} expense(s) from the previous month have been copied to ${months[selectedMonth]}.`,
            });
        } else {
            toast({
                title: "No Expenses to Sync",
                description: "There were no expenses recorded in the previous month to copy over.",
            });
        }
    });
  };

    const handleDesktopMonthChange = (monthName: string) => {
        const monthIndex = months.indexOf(monthName);
        if (monthIndex !== -1) {
            setSelectedMonth(monthIndex);
        }
    }
  
  return (
    <TooltipProvider>
    <Tabs value={months[selectedMonth]} onValueChange={handleDesktopMonthChange} className="w-full pt-4 md:pt-0">
      
      <div className="hidden md:flex gap-4 mb-4">
        <TabsList className="grid w-full grid-cols-12">
            {months.map(month => (
            <TabsTrigger key={month} value={month}>{month}</TabsTrigger>
            ))}
        </TabsList>
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Year:</span>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
      </div>

        <div className="md:hidden flex gap-2 mb-4">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>
                        {m}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
        </div>
      
      {months.map((month, monthIndex) => (
        <TabsContent key={month} value={month}>
          <div className="mt-6">
            <Tabs defaultValue="rent-roll" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rent-roll">Rent Roll</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value="rent-roll">
                 <Card className="mt-4">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     <div>
                        <CardTitle>Rent Roll - {month} {selectedYear}</CardTitle>
                        <CardDescription>Rent payment status for {month} {selectedYear}.</CardDescription>
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
                                            <DialogDescription>Fill in the form to {editingRentEntry ? 'update the' : 'add a new'} rent entry for {month}, {selectedYear}.</DialogDescription>
                                        </DialogHeader>
                                        <form ref={formRef} onSubmit={handleSaveRentEntry} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                                            <input type="hidden" name="month" value={monthIndex} />
                                            <input type="hidden" name="year" value={selectedYear} />
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
                                                                                            <div className="text-xs text-muted-foreground">{tenant.property} &middot; {formatCurrency(tenant.rent, settings.currencySymbol)}</div>
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
                                            <div className="space-y-2"><Label htmlFor="name">Tenant Name</Label><Input id="name" name="name" defaultValue={editingRentEntry?.name || ''} required disabled={!!selectedHistoricalTenant} /></div>
                                            <div className="space-y-2"><Label htmlFor="property">Property/Unit</Label><Input id="property" name="property" defaultValue={editingRentEntry?.property || ''} required disabled={!!selectedHistoricalTenant}/></div>
                                            <div className="space-y-2"><Label htmlFor="amount">Rent Amount</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingRentEntry?.rent || ''} required /></div>
                                            <div className="space-y-2"><Label htmlFor="status">Status</Label><Select name="status" defaultValue={editingRentEntry?.status || 'Pending'}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select></div>
                                            <div className="space-y-2"><Label htmlFor="payment_date">Payment Date</Label><Input id="payment_date" name="payment_date" type="date" defaultValue={editingRentEntry?.payment_date || ''} /></div>
                                            <div className="space-y-2"><Label htmlFor="collected_by">Collected By</Label><Input id="collected_by" name="collected_by" defaultValue={editingRentEntry?.collected_by || ''} /></div>
                                            <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Entry</Button></DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Tooltip><TooltipTrigger asChild>
                                    <Button size="icon" variant="outline" onClick={handleSyncTenants} className="flex-1 sm:flex-initial" disabled={isSyncingTenants}>
                                        {isSyncingTenants ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        <span className="sr-only">Sync tenants</span>
                                    </Button>
                                </TooltipTrigger><TooltipContent>Sync</TooltipContent></Tooltip>
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
                      <div className="relative overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                              {isAdmin && <TableHead className="w-10 text-inherit">
                                  <div className="text-white">
                                      <Checkbox
                                          className="border-primary data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                                          checked={selectedRentEntryIds.length > 0 && selectedRentEntryIds.length === filteredTenantsForMonth.length}
                                          onCheckedChange={(checked) => {
                                              if (checked) {
                                                  setSelectedRentEntryIds(filteredTenantsForMonth.map(t => t.id));
                                              } else {
                                                  setSelectedRentEntryIds([]);
                                              }
                                          }}
                                      />
                                  </div>
                              </TableHead>}
                              <TableHead className="text-inherit">Tenant</TableHead>
                              <TableHead className="hidden md:table-cell text-inherit">Collected By</TableHead>
                              <TableHead className="hidden sm:table-cell text-inherit">Payment Date</TableHead>
                              <TableHead className="hidden sm:table-cell text-inherit">Status</TableHead>
                              <TableHead className="text-inherit">Amount</TableHead>
                              <TableHead className="w-[50px] text-right text-inherit"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTenantsForMonth.length > 0 ? (
                              filteredTenantsForMonth.slice(0, showAllRent ? filteredTenantsForMonth.length : 10).map((entry) => (
                                <TableRow key={entry.id} className="odd:bg-muted/50" data-state={isAdmin && selectedRentEntryIds.includes(entry.id) ? "selected" : undefined}>
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
                                      <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewDetails(entry)}
                                            className={cn(
                                                "text-sm font-medium leading-none text-left hover:underline",
                                                getStatusNameColor(entry.status)
                                            )}
                                        >
                                            {entry.name}
                                        </button>
                                        <div className="sm:hidden">{getStatusIcon(entry.status)}</div>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {entry.property}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">{entry.collected_by || '-'}</TableCell>
                                  <TableCell className="hidden sm:table-cell">{formatDate(entry.payment_date, settings.dateFormat)}</TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                      {isAdmin && entry.status !== 'Paid' ? (
                                          <Select
                                              value={entry.status}
                                              onValueChange={(newStatus) => handleStatusChange(entry, newStatus as RentEntry['status'])}
                                          >
                                              <SelectTrigger className={cn("h-auto py-1 px-2 border", getStatusBadge(entry.status))}>
                                                  <div className="flex items-center">
                                                      <span className="mr-1">{getStatusIcon(entry.status)}</span>
                                                      <SelectValue />
                                                  </div>
                                              </SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="Pending">Pending</SelectItem>
                                                  <SelectItem value="Paid">Paid</SelectItem>
                                                  <SelectItem value="Overdue">Overdue</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      ) : (
                                          <Badge className={getStatusBadge(entry.status)} variant="outline">
                                              {getStatusIcon(entry.status)}
                                              {entry.status}
                                          </Badge>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-left">
                                        <EditableAmount
                                            initialAmount={entry.rent}
                                            onSave={(newAmount) => updateRentEntry({ ...entry, rent: newAmount }, toast)}
                                            currencySymbol={settings.currencySymbol}
                                            isAdmin={isAdmin}
                                            withProtection={withProtection}
                                        />
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {entry.status === 'Paid' && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setNavigatingToReceiptId(entry.id);
                                                        startNavigation(() => { router.push(`/receipt/${entry.id}`); });
                                                    }}
                                                    disabled={isNavigating && navigatingToReceiptId === entry.id}
                                                >
                                                    {isNavigating && navigatingToReceiptId === entry.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
                                                    View Receipt
                                                </DropdownMenuItem>
                                            )}
                                            {isAdmin && (
                                                <>
                                                    <DropdownMenuItem onClick={(e) => handleEditRentEntry(entry, e as any)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <form onSubmit={(e) => { e.preventDefault(); withProtection(() => handleDeleteRentEntry(entry), e as any); }}>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This will mark the rent entry for {entry.name} as deleted. You can undo this action.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </form>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground p-10">No rent collection data for {month} {selectedYear}.</TableCell>
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
                                      <div className="text-inherit font-bold">{formatCurrency(totalRentCollected, settings.currencySymbol)}</div>
                                    </div>
                                  </TableCell>
                              </TableRow>
                            </TableFooter>
                          )}
                        </Table>
                      </div>
                      {filteredTenantsForMonth.length > 10 && (
                        <div className="p-4 border-t text-center">
                          <Button variant="link" onClick={() => setShowAllRent(!showAllRent)}>
                            {showAllRent ? "Show Less" : `View All ${filteredTenantsForMonth.length} Entries`}
                          </Button>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="expenses">
                <Card className="mt-4">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Expenses - {month} {selectedYear}</CardTitle>
                      <CardDescription>Property-related expenses for {month} {selectedYear}.</CardDescription>
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
                                        <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={editingExpense?.date ? formatDate(editingExpense.date, 'yyyy-MM-dd') : formatDate(new Date().toISOString(), 'yyyy-MM-dd')} required /></div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                                <SelectContent>
                                                    {expenseCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {expenseCategory === 'Other' && (<div className="space-y-2"><Label htmlFor="customCategory">Custom Category</Label><Input id="customCategory" name="customCategory" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter custom category" required/></div>)}
                                        <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={String(editingExpense?.amount ?? '')} placeholder="0.00" required /></div>
                                        <div className="space-y-2"><Label htmlFor="status">Status</Label><Select name="status" defaultValue={editingExpense?.status || 'Due'}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Due">Due</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent></Select></div>
                                        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={editingExpense?.description || ""} placeholder="Describe the expense..." /></div>
                                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Expense</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="outline" onClick={handleSyncExpenses} className="flex-1 sm:flex-initial" disabled={isSyncingExpenses}>
                                        {isSyncingExpenses ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        <span className="sr-only">Sync expenses</span>
                                    </Button>
                                </TooltipTrigger><TooltipContent>Sync from Previous Month</TooltipContent></Tooltip>
                        </div>
                      </div>
                    }
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative overflow-x-auto">
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
                          <TableHead className="hidden sm:table-cell text-inherit">Category</TableHead>
                          <TableHead className="text-inherit">Amount</TableHead>
                          <TableHead className="hidden sm:table-cell text-inherit">Status</TableHead>
                          <TableHead className="w-[50px] text-right text-inherit"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExpenses.slice(0, showAllExpenses ? filteredExpenses.length : 10).map((expense) => (
                            <TableRow key={expense.id} className="odd:bg-muted/50" data-state={isAdmin && selectedExpenseIds.includes(expense.id) ? "selected" : undefined}>
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
                                <div className="font-medium flex items-center gap-2">
                                    {expense.description || expense.category}
                                    <div className="sm:hidden">{getExpenseStatusIcon(expense.status)}</div>
                                </div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {formatDate(expense.date, 'dd MMM, yy')}
                                </div>
                                <div className="text-sm text-muted-foreground hidden md:block">
                                    {formatDate(expense.date, settings.dateFormat)}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                {expense.category}
                              </TableCell>
                              <TableCell>
                                <div className="text-left">
                                    <EditableAmount
                                        initialAmount={expense.amount}
                                        onSave={(newAmount) => updateExpense({ ...expense, amount: newAmount }, toast)}
                                        currencySymbol={settings.currencySymbol}
                                        isAdmin={isAdmin}
                                        withProtection={withProtection}
                                    />
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                 {isAdmin && expense.status === 'Due' ? (
                                  <Select
                                      value={expense.status}
                                      onValueChange={(newStatus) => handleExpenseStatusChange(expense, newStatus as Expense['status'])}
                                  >
                                      <SelectTrigger className={cn("h-auto py-1 px-2 border", getExpenseStatusBadge(expense.status))}>
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="Due">Due</SelectItem>
                                          <SelectItem value="Paid">Paid</SelectItem>
                                      </SelectContent>
                                  </Select>
                              ) : (
                                  <Badge className={getExpenseStatusBadge(expense.status)}>
                                      {expense.status}
                                  </Badge>
                              )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {isAdmin && (
                                          <>
                                              <DropdownMenuItem onClick={(e) => handleEditExpense(expense, e as any)}>
                                                  <Pencil className="mr-2 h-4 w-4" />
                                                  Edit
                                              </DropdownMenuItem>
                                              <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                          <Trash2 className="mr-2 h-4 w-4" />
                                                          Delete
                                                      </DropdownMenuItem>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                      <form onSubmit={(e) => { e.preventDefault(); withProtection(() => handleDeleteExpense(expense), e as any); }}>
                                                          <AlertDialogHeader>
                                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                              <AlertDialogDescription>This will mark the expense as deleted. You can undo this action.</AlertDialogDescription>
                                                          </AlertDialogHeader>
                                                          <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                                          </AlertDialogFooter>
                                                      </form>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </>
                                      )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                           {filteredExpenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <span>No expense data for {month} {selectedYear}.</span>
                                </div>
                                </TableCell>
                            </TableRow>
                            )}
                      </TableBody>
                      {filteredExpenses.length > 0 && (
                        <TableFooter>
                          <TableRow style={{ backgroundColor: 'hsl(var(--table-footer-background))', color: 'hsl(var(--table-footer-foreground))' }} className="font-bold hover:bg-[hsl(var(--table-footer-background)/0.9)]">
                            <TableCell colSpan={isAdmin ? 6 : 5} className="p-2 text-inherit">
                               <div className="flex flex-col sm:flex-row items-center justify-between px-2">
                                <div className="sm:hidden text-center font-bold text-inherit">Total Paid</div>
                                <div className="hidden sm:block text-left font-bold text-inherit">Total Paid</div>
                                <div className="font-bold text-inherit">{formatCurrency(totalExpensesPaid, settings.currencySymbol)}</div>
                               </div>
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                    </div>
                    {filteredExpenses.length > 10 && (
                      <div className="p-4 border-t text-center">
                        <Button variant="link" onClick={() => setShowAllExpenses(!showAllExpenses)}>
                          {showAllExpenses ? "Show Less" : `View All ${filteredExpenses.length} Entries`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
             <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                    <div className="flex items-start gap-3">
                        <Megaphone className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-bold">Monthly Notice</h4>
                            {monthlyNotice ? (
                                <p className="text-sm mt-1 whitespace-pre-wrap">{monthlyNotice.content}</p>
                            ) : (
                                <p className="text-sm mt-1 text-yellow-700">No notice has been set for this month.</p>
                            )}
                        </div>
                        {isAdmin && (
                            <div className="flex flex-row items-center gap-2">
                                <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 hover:text-yellow-900">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            {monthlyNotice ? "Edit" : "Add"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{monthlyNotice ? "Edit" : "Add"} Notice for {month} {selectedYear}</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleSaveNotice}>
                                            <input type="hidden" name="year" value={selectedYear} />
                                            <input type="hidden" name="month" value={monthIndex} />
                                            {monthlyNotice && <input type="hidden" name="noticeId" value={monthlyNotice.id} />}
                                            <Textarea name="content" defaultValue={monthlyNotice?.content} rows={5} placeholder="Enter your notice here..."/>
                                            <DialogFooter className="mt-4">
                                                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                                                <Button type="submit" disabled={isNoticePending}>
                                                    {isNoticePending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                                                    Save Notice
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                {monthlyNotice && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="ghost" className="text-yellow-800 hover:bg-yellow-100 hover:text-yellow-900">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                             <form onSubmit={handleDeleteNotice}>
                                                <input type="hidden" name="noticeId" value={monthlyNotice.id} />
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the notice for this month.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction type="submit" disabled={isNoticePending}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </form>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            <div className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Rent Collected</p><div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-500"/><p className="text-xl font-bold text-green-600">{formatCurrency(totalRentCollected, settings.currencySymbol)}</p></div></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Expenses</p><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500"/><p className="text-xl font-bold text-red-600">{formatCurrency(totalExpensesPaid, settings.currencySymbol)}</p></div></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Net Amount</p><div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-blue-500"/><p className={`text-xl font-bold ${netResult >=0 ? 'text-blue-600':'text-red-600'}`}>{netResult >= 0 ? '+' : ''}{formatCurrency(netResult, settings.currencySymbol)}</p></div></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Available for Deposit</p><div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-purple-500"/><p className="text-xl font-bold text-purple-600">{formatCurrency(amountForDeposit, settings.currencySymbol)}</p></div></CardContent></Card>
                </div>
            </div>
            <div className="mt-6">
                 <Card>
                    <CardHeader className="p-3 bg-primary text-primary-foreground border-b">
                        <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-5 w-5"/>Bank Deposit Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border bg-background">
                                    <AvatarImage src={settings.bankLogoUrl} data-ai-hint="logo bank"/>
                                    <AvatarFallback><Building className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{settings.bankName}</p>
                                    <p className="text-xs text-muted-foreground">{settings.bankAccountNumber}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    {loggedDeposit ? (
                                        <>
                                            <p className="text-xs text-muted-foreground">Deposited on {formatDate(loggedDeposit.deposit_date, 'dd MMM')}</p>
                                            <p className="font-bold text-lg text-primary">{formatCurrency(loggedDeposit.amount, settings.currencySymbol)}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No deposit logged</p>
                                    )}
                                </div>
                                 <div className="flex items-center gap-1">
                                    {loggedDeposit?.receipt_url && (
                                        <Button asChild size="sm" variant="outline">
                                            <a href={loggedDeposit.receipt_url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </a>
                                        </Button>
                                    )}
                                    {isAdmin && (
                                        <Button size="sm" variant={loggedDeposit ? "secondary" : "default"} onClick={() => setIsDepositDialogOpen(true)}>
                                            {loggedDeposit ? <><Edit className="mr-2 h-4 w-4" />Edit</> : 'Log Deposit'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
      ))}
      <Dialog open={isDepositDialogOpen} onOpenChange={handleDepositOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{loggedDeposit ? 'Edit Deposit' : 'Log New Deposit'}</DialogTitle>
                <DialogDescription>
                    Confirm the amount, date, and receipt for the deposit for {months[selectedMonth]}, {selectedYear}.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDeposit}>
                <input type="hidden" name="year" value={selectedYear} />
                <input type="hidden" name="month" value={selectedMonth} />
                {loggedDeposit && <input type="hidden" name="depositId" value={loggedDeposit.id} />}
                {loggedDeposit?.receipt_url && <input type="hidden" name="receipt_url" value={loggedDeposit.receipt_url} />}
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="deposit-amount">Amount to Deposit</Label>
                        <Input id="deposit-amount" name="amount" type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deposit-date">Deposit Date</Label>
                        <Input id="deposit-date" name="deposit_date" type="date" defaultValue={loggedDeposit?.deposit_date ? formatDate(loggedDeposit.deposit_date, 'yyyy-MM-dd') : formatDate(new Date().toISOString(), 'yyyy-MM-dd')} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Bank Receipt</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                                {receiptPreview || loggedDeposit?.receipt_url ? (
                                    <img src={receiptPreview || loggedDeposit?.receipt_url || ''} alt="Receipt Preview" className="h-full w-full object-contain rounded-md" data-ai-hint="document receipt"/>
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
                                        This will remove the deposit log and receipt for {months[selectedMonth]}, {selectedYear}. This action cannot be undone.
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
