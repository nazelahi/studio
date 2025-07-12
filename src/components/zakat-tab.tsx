
"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Trash2, ArrowUpCircle, ArrowDownCircle, Banknote, LoaderCircle, Settings, Landmark, Eye, Upload, ImageIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, getYear } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveZakatTransactionAction, deleteZakatTransactionAction } from "@/app/actions/zakat"
import { updatePropertySettingsAction } from "@/app/settings/actions"
import type { ZakatTransaction } from "@/types"
import { Skeleton } from "./ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useSettings } from "@/context/settings-context"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
};

export function ZakatTab({ year }: { year: number }) {
  const { zakatTransactions, loading, refreshData } = useData();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<ZakatTransaction | null>(null);
  const [dialogTransactionType, setDialogTransactionType] = React.useState<'inflow' | 'outflow'>('inflow');
  const [isPending, startTransition] = React.useTransition();
  const [isDetailsPending, startDetailsTransition] = React.useTransition();
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);

  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const filteredTransactions = React.useMemo(() => {
    return zakatTransactions.filter(tx => {
        try {
            return getYear(parseISO(tx.transaction_date)) === year;
        } catch {
            return false;
        }
    });
  }, [zakatTransactions, year]);


  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingTransaction(null);
      setReceiptFile(null);
      setReceiptPreview(null);
    }
    setIsDialogOpen(isOpen);
  };

  const handleEdit = (transaction: ZakatTransaction) => {
    setEditingTransaction(transaction);
    setDialogTransactionType(transaction.type);
    setReceiptPreview(transaction.receipt_url || null);
    setIsDialogOpen(true);
  };
  
  const handleAdd = (type: 'inflow' | 'outflow') => {
    setEditingTransaction(null);
    setDialogTransactionType(type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (formData: FormData) => {
    const result = await deleteZakatTransactionAction(formData);
    if (result.error) {
      toast({ title: 'Error deleting transaction', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Transaction Deleted', description: 'The Zakat transaction has been removed.' });
      refreshData();
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (receiptFile) {
        formData.append('receiptFile', receiptFile);
    }

    startTransition(async () => {
      const result = await saveZakatTransactionAction(formData);
      if (result.error) {
        toast({ title: 'Error saving transaction', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: editingTransaction ? 'Transaction Updated' : 'Transaction Added', description: 'Your Zakat transaction has been saved.' });
        refreshData();
        handleOpenChange(false);
      }
    });
  };
  
  const handleSaveDetails = (formData: FormData) => {
    startDetailsTransition(async () => {
        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Settings', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Zakat Bank Details Saved', description: 'Your Zakat bank details have been updated.' });
            setIsDetailsDialogOpen(false);
        }
     });
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


  const totalInflow = filteredTransactions.filter(t => t.type === 'inflow').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutflow = filteredTransactions.filter(t => t.type === 'outflow').reduce((acc, curr) => acc + curr.amount, 0);
  const availableZakat = totalInflow - totalOutflow;
  
  const inflowTransactions = filteredTransactions.filter(t => t.type === 'inflow').sort((a,b) => parseISO(b.transaction_date).getTime() - parseISO(a.transaction_date).getTime());
  const outflowTransactions = filteredTransactions.filter(t => t.type === 'outflow').sort((a,b) => parseISO(b.transaction_date).getTime() - parseISO(a.transaction_date).getTime());


  if (loading) {
    return (
        <div className="pt-4 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  const TransactionTable = ({ transactions, type }: { transactions: ZakatTransaction[], type: 'inflow' | 'outflow' }) => (
     <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>{type === 'inflow' ? 'Source' : 'Recipient'}</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell>{format(parseISO(tx.transaction_date), "dd MMM, yyyy")}</TableCell>
                <TableCell className="font-medium">{tx.source_or_recipient}</TableCell>
                <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                <TableCell className={`text-right font-bold ${tx.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(tx.amount)}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tx.receipt_url && (
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                           <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                            </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tx)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this Zakat transaction. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <form action={handleDelete}>
                                    <input type="hidden" name="transactionId" value={tx.id} />
                                    {tx.receipt_url && <input type="hidden" name="receiptUrl" value={tx.receipt_url} />}
                                    <AlertDialogAction type="submit">Delete</AlertDialogAction>
                                </form>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                       </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground h-24">
                No Zakat {type} transactions recorded for {year}.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );

  return (
    <div className="pt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zakat Fund Summary for {year}</CardTitle>
          <CardDescription>An overview of your Zakat funds for the selected year.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                    <ArrowUpCircle className="h-5 w-5"/>
                    <h4 className="font-semibold">Total Inflow</h4>
                </div>
                <p className="text-2xl font-bold text-green-800 mt-2">{formatCurrency(totalInflow)}</p>
            </div>
             <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                    <ArrowDownCircle className="h-5 w-5"/>
                    <h4 className="font-semibold">Total Outflow</h4>
                </div>
                <p className="text-2xl font-bold text-red-800 mt-2">{formatCurrency(totalOutflow)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                    <Banknote className="h-5 w-5"/>
                    <h4 className="font-semibold">Available Zakat</h4>
                </div>
                <p className="text-2xl font-bold text-blue-800 mt-2">{formatCurrency(availableZakat)}</p>
            </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="inflow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inflow">Inflow</TabsTrigger>
            <TabsTrigger value="outflow">Outflow</TabsTrigger>
        </TabsList>
        <TabsContent value="inflow">
            <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Zakat Inflow for {year}</CardTitle>
                        <CardDescription>Zakat funds received in {year}.</CardDescription>
                    </div>
                    {isAdmin && <Button onClick={() => handleAdd('inflow')}><PlusCircle className="mr-2 h-4 w-4"/>Add Inflow</Button>}
                </CardHeader>
                <CardContent>
                    <TransactionTable transactions={inflowTransactions} type="inflow" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="outflow">
             <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Zakat Outflow for {year}</CardTitle>
                        <CardDescription>Zakat funds distributed in {year}.</CardDescription>
                    </div>
                    {isAdmin && <Button onClick={() => handleAdd('outflow')}><PlusCircle className="mr-2 h-4 w-4"/>Add Outflow</Button>}
                </CardHeader>
                <CardContent>
                    <TransactionTable transactions={outflowTransactions} type="outflow" />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <Landmark className="h-6 w-6 text-primary" />
                <CardTitle className="text-base">Zakat Bank Details</CardTitle>
            </div>
            {isAdmin && (
                <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"> <Settings className="mr-2 h-4 w-4" />Change Details</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Zakat Bank Details</DialogTitle>
                            <DialogDescription>
                                Enter the bank details for Zakat funds.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleSaveDetails}>
                            <input type="hidden" name="houseName" value={settings.houseName} />
                            <input type="hidden" name="houseAddress" value={settings.houseAddress} />
                            <input type="hidden" name="bankName" value={settings.bankName} />
                            <input type="hidden" name="bankAccountNumber" value={settings.bankAccountNumber} />
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="zakatBankName">Zakat Bank Name</Label>
                                    <Input id="zakatBankName" name="zakatBankName" defaultValue={settings.zakatBankName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zakatBankAccountNumber">Zakat Bank Account Number</Label>
                                    <Input id="zakatBankAccountNumber" name="zakatBankAccountNumber" defaultValue={settings.zakatBankAccountNumber} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isDetailsPending}>
                                    {isDetailsPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Details
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                <p className="font-semibold">{settings.zakatBankName || "Not Set"}</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                <p className="font-semibold">{settings.zakatBankAccountNumber || "Not Set"}</p>
            </div>
        </CardContent>
      </Card>
      
      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingTransaction ? "Edit" : "Add"} Zakat Transaction</DialogTitle>
                    <DialogDescription>
                        Log a new Zakat {dialogTransactionType}.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSave}>
                    <input type="hidden" name="type" value={dialogTransactionType} />
                    {editingTransaction && <input type="hidden" name="transactionId" value={editingTransaction.id} />}
                    {editingTransaction?.receipt_url && <input type="hidden" name="receipt_url" value={editingTransaction.receipt_url} />}
                    {editingTransaction?.receipt_url && <input type="hidden" name="oldReceiptUrl" value={editingTransaction.receipt_url} />}
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="transaction_date">Date</Label>
                            <Input id="transaction_date" name="transaction_date" type="date" defaultValue={editingTransaction?.transaction_date ? format(parseISO(editingTransaction.transaction_date), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount} placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="source_or_recipient">{dialogTransactionType === 'inflow' ? 'Source (From)' : 'Recipient (To)'}</Label>
                            <Input id="source_or_recipient" name="source_or_recipient" defaultValue={editingTransaction?.source_or_recipient} placeholder="Name of person or organization" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={editingTransaction?.description} placeholder="Optional notes..."/>
                        </div>
                        <div className="space-y-2">
                            <Label>Receipt</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                                    {receiptPreview ? (
                                        <img src={receiptPreview} alt="Receipt Preview" className="h-full w-full object-contain rounded-md" data-ai-hint="document receipt"/>
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
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" type="button" disabled={isPending}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Save Transaction
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
