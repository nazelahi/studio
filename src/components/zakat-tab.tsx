

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Trash2, ArrowUpCircle, ArrowDownCircle, Banknote, LoaderCircle, Settings, Landmark, Eye, Upload, ImageIcon, MapPin } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveZakatTransactionAction, deleteZakatTransactionAction, saveZakatBankDetailAction, deleteZakatBankDetailAction } from "@/app/actions/zakat"
import type { ZakatTransaction, ZakatBankDetail } from "@/types"
import { Skeleton } from "./ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useSettings } from "@/context/settings-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { formatCurrency, formatDate } from "@/lib/utils"

export function ZakatTab() {
  const { zakatTransactions, loading } = useData();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [isTxDialogOpen, setIsTxDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<ZakatTransaction | null>(null);
  const [dialogTransactionType, setDialogTransactionType] = React.useState<'inflow' | 'outflow'>('inflow');
  const [isTxPending, startTxTransition] = React.useTransition();

  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = React.useState(false);
  const [editingBankDetail, setEditingBankDetail] = React.useState<ZakatBankDetail | null>(null);
  const [isBankDetailPending, startBankDetailTransition] = React.useTransition();


  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);
  
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleTxOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingTransaction(null);
      setReceiptFile(null);
      setReceiptPreview(null);
    }
    setIsTxDialogOpen(isOpen);
  };
  
  const handleBankDetailOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setEditingBankDetail(null);
        setLogoFile(null);
        setLogoPreview(null);
    }
    setIsBankDetailDialogOpen(isOpen);
  }

  const handleEditTx = (transaction: ZakatTransaction) => {
    setEditingTransaction(transaction);
    setDialogTransactionType(transaction.type);
    setReceiptPreview(transaction.receipt_url || null);
    setIsTxDialogOpen(true);
  };
  
  const handleAddTx = (type: 'inflow' | 'outflow') => {
    setEditingTransaction(null);
    setDialogTransactionType(type);
    setIsTxDialogOpen(true);
  };

  const handleDeleteTx = (formData: FormData) => {
    startTxTransition(async () => {
        const result = await deleteZakatTransactionAction(formData);
        if (result.error) {
        toast({ title: 'Error deleting transaction', description: result.error, variant: 'destructive' });
        } else {
        toast({ title: 'Transaction Deleted', description: 'The Zakat transaction has been removed.' });
        }
    });
  };

  const handleSaveTx = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (receiptFile) {
        formData.append('receiptFile', receiptFile);
    }

    startTxTransition(async () => {
      const result = await saveZakatTransactionAction(formData);
      if (result.error) {
        toast({ title: 'Error saving transaction', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: editingTransaction ? 'Transaction Updated' : 'Transaction Added', description: 'Your Zakat transaction has been saved.' });
        handleTxOpenChange(false);
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
  
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveBankDetail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
     if (logoFile) {
        formData.append('logoFile', logoFile);
    }
    startBankDetailTransition(async () => {
        const result = await saveZakatBankDetailAction(formData);
        if (result.error) {
             toast({ title: 'Error Saving Zakat Detail', description: result.error, variant: 'destructive'});
        } else {
             toast({ title: 'Zakat Detail Saved', description: 'The Zakat bank detail has been saved successfully.' });
             handleBankDetailOpenChange(false);
        }
    });
  }
  
  const handleDeleteBankDetail = (formData: FormData) => {
    startBankDetailTransition(async () => {
        const result = await deleteZakatBankDetailAction(formData);
        if (result.error) {
             toast({ title: 'Error Deleting Zakat Detail', description: result.error, variant: 'destructive'});
        } else {
             toast({ title: 'Zakat Detail Deleted', description: 'The Zakat bank detail has been deleted.', variant: 'destructive' });
        }
    });
  }

  const handleEditBankDetail = (detail: ZakatBankDetail) => {
    setEditingBankDetail(detail);
    setLogoPreview(detail.logo_url || null);
    setIsBankDetailDialogOpen(true);
  }
  
  const handleAddBankDetail = () => {
    setEditingBankDetail(null);
    setIsBankDetailDialogOpen(true);
  }


  const totalInflow = zakatTransactions.filter(t => t.type === 'inflow').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutflow = zakatTransactions.filter(t => t.type === 'outflow').reduce((acc, curr) => acc + curr.amount, 0);
  const availableZakat = totalInflow - totalOutflow;
  
  const inflowTransactions = zakatTransactions.filter(t => t.type === 'inflow').sort((a,b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  const outflowTransactions = zakatTransactions.filter(t => t.type === 'outflow').sort((a,b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());


  if (loading) {
    return (
        <div className="pt-4 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  const TransactionTable = ({ transactions, type }: { transactions: ZakatTransaction[], type: 'inflow' | 'outflow' }) => {
    const totalAmount = transactions.reduce((acc, tx) => acc + tx.amount, 0);

    return (
     <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
            <TableHead className="text-inherit">Date</TableHead>
            <TableHead className="text-inherit">{type === 'inflow' ? 'Source' : 'Recipient'}</TableHead>
            <TableHead className="hidden sm:table-cell text-inherit">Description</TableHead>
            <TableHead className="text-right text-inherit">Amount</TableHead>
            <TableHead className="text-inherit w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <TableRow key={tx.id} className={cn(type === 'inflow' ? 'bg-green-50/50' : 'bg-red-50/50')}>
                <TableCell>{formatDate(tx.transaction_date, settings.dateFormat)}</TableCell>
                <TableCell className="font-medium">{tx.source_or_recipient}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{tx.description || '-'}</TableCell>
                <TableCell className={`text-right font-bold ${tx.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(tx.amount, settings.currencySymbol)}
                </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tx.receipt_url && (
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                           <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                            </a>
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTx(tx)}>
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
                                    <form onSubmit={(e) => { e.preventDefault(); handleDeleteTx(new FormData(e.currentTarget)); }}>
                                        <input type="hidden" name="transactionId" value={tx.id} />
                                        {tx.receipt_url && <input type="hidden" name="receiptUrl" value={tx.receipt_url} />}
                                        <AlertDialogAction type="submit" disabled={isTxPending}>Delete</AlertDialogAction>
                                    </form>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                           </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                No Zakat {type} transactions recorded.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {transactions.length > 0 && (
            <UiTableFooter>
                <TableRow style={{ backgroundColor: 'hsl(var(--table-footer-background))', color: 'hsl(var(--table-footer-foreground))' }} className="font-bold hover:bg-[hsl(var(--table-footer-background)/0.9)]">
                    <TableCell colSpan={5} className="text-inherit p-2">
                        <div className="flex flex-col sm:flex-row items-center justify-between px-2">
                          <div className="sm:hidden text-center text-inherit font-bold">Total</div>
                          <div className="hidden sm:block text-left text-inherit font-bold">Total</div>
                          <div className="text-inherit font-bold">{formatCurrency(totalAmount, settings.currencySymbol)}</div>
                        </div>
                    </TableCell>
                </TableRow>
            </UiTableFooter>
        )}
      </Table>
  );
}

  return (
    <div className="pt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zakat Fund Summary</CardTitle>
          <CardDescription>An overview of your total Zakat funds.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                    <ArrowUpCircle className="h-5 w-5"/>
                    <h4 className="font-semibold">Total Inflow</h4>
                </div>
                <p className="text-2xl font-bold text-green-800 mt-2">{formatCurrency(totalInflow, settings.currencySymbol)}</p>
            </div>
             <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                    <ArrowDownCircle className="h-5 w-5"/>
                    <h4 className="font-semibold">Total Outflow</h4>
                </div>
                <p className="text-2xl font-bold text-red-800 mt-2">{formatCurrency(totalOutflow, settings.currencySymbol)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                    <Banknote className="h-5 w-5"/>
                    <h4 className="font-semibold">Available Zakat</h4>
                </div>
                <p className="text-2xl font-bold text-blue-800 mt-2">{formatCurrency(availableZakat, settings.currencySymbol)}</p>
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
                        <CardTitle>Zakat Inflow</CardTitle>
                        <CardDescription>Zakat funds received.</CardDescription>
                    </div>
                    {isAdmin && <Button onClick={() => handleAddTx('inflow')}><PlusCircle className="mr-2 h-4 w-4"/>Add Inflow</Button>}
                </CardHeader>
                <CardContent className="p-0">
                    <TransactionTable transactions={inflowTransactions} type="inflow" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="outflow">
             <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Zakat Outflow</CardTitle>
                        <CardDescription>Zakat funds distributed.</CardDescription>
                    </div>
                    {isAdmin && <Button onClick={() => handleAddTx('outflow')}><PlusCircle className="mr-2 h-4 w-4"/>Add Outflow</Button>}
                </CardHeader>
                <CardContent className="p-0">
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
                <Button variant="outline" size="sm" onClick={handleAddBankDetail}> <PlusCircle className="mr-2 h-4 w-4" />Add New Account</Button>
            )}
        </CardHeader>
        <CardContent>
           {settings.zakatBankDetails.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Bank Name</TableHead>
                            <TableHead>Account Number</TableHead>
                            <TableHead>Location</TableHead>
                            {isAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settings.zakatBankDetails.map(detail => (
                            <TableRow key={detail.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={detail.logo_url} alt={detail.bank_name} data-ai-hint="logo bank"/>
                                        <AvatarFallback><Banknote className="h-4 w-4"/></AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>{detail.bank_name}</TableCell>
                                <TableCell>{detail.account_number}</TableCell>
                                <TableCell>{detail.location || '-'}</TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditBankDetail(detail)}>
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
                                                        <AlertDialogDescription>This will permanently delete this Zakat bank detail. This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(); fd.set('detailId', detail.id); fd.set('logoUrl', detail.logo_url || ''); handleDeleteBankDetail(fd); }}>
                                                            <AlertDialogAction type="submit" disabled={isBankDetailPending}>Delete</AlertDialogAction>
                                                        </form>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
           ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No Zakat bank details have been set up yet. An admin can add them here.</p>
           )}
        </CardContent>
      </Card>
      
      {isAdmin && (
        <>
            <Dialog open={isTxDialogOpen} onOpenChange={handleTxOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTransaction ? "Edit" : "Add"} Zakat Transaction</DialogTitle>
                        <DialogDescription>
                            Log a new Zakat {dialogTransactionType}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveTx}>
                        <input type="hidden" name="type" value={dialogTransactionType} />
                        {editingTransaction && <input type="hidden" name="transactionId" value={editingTransaction.id} />}
                        {editingTransaction?.receipt_url && <input type="hidden" name="receipt_url" value={editingTransaction.receipt_url} />}
                        {editingTransaction?.receipt_url && <input type="hidden" name="oldReceiptUrl" value={editingTransaction.receipt_url} />}
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label htmlFor="transaction_date">Date</Label>
                                <Input id="transaction_date" name="transaction_date" type="date" defaultValue={editingTransaction?.transaction_date ? formatDate(editingTransaction.transaction_date, 'yyyy-MM-dd') : formatDate(new Date().toISOString(), 'yyyy-MM-dd')} required />
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
                                <Textarea id="description" name="description" defaultValue={editingTransaction?.description || ""} placeholder="Optional notes..."/>
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
                                <Button variant="outline" type="button" disabled={isTxPending}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isTxPending}>
                                {isTxPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Save Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isBankDetailDialogOpen} onOpenChange={handleBankDetailOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBankDetail ? 'Edit' : 'Add'} Zakat Bank Account</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveBankDetail}>
                        {editingBankDetail && <input type="hidden" name="detailId" value={editingBankDetail.id} />}
                        {editingBankDetail?.logo_url && <input type="hidden" name="logo_url" value={editingBankDetail.logo_url} />}
                        {editingBankDetail?.logo_url && <input type="hidden" name="oldLogoUrl" value={editingBankDetail.logo_url} />}
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                           <div className="space-y-2">
                                <Label>Bank Logo</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 rounded-md">
                                        <AvatarImage src={logoPreview} data-ai-hint="logo bank"/>
                                        <AvatarFallback className="rounded-md"><Banknote className="h-8 w-8"/></AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4"/>
                                        Upload Logo
                                    </Button>
                                    <Input ref={logoInputRef} type="file" name="logoFile" className="hidden" accept="image/*" onChange={handleLogoFileChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Bank Name</Label>
                                <Input id="bank_name" name="bank_name" defaultValue={editingBankDetail?.bank_name} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="location">Location / Branch</Label>
                                <Input id="location" name="location" defaultValue={editingBankDetail?.location || ''} placeholder="e.g., Main Branch, Dhaka"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_number">Account Number</Label>
                                <Input id="account_number" name="account_number" defaultValue={editingBankDetail?.account_number} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_holder">Account Holder Name (Optional)</Label>
                                <Input id="account_holder" name="account_holder" defaultValue={editingBankDetail?.account_holder || ''} />
                            </div>
                        </div>
                         <DialogFooter>
                            <DialogClose asChild><Button variant="outline" type="button" disabled={isBankDetailPending}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isBankDetailPending}>
                                {isBankDetailPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
      )}
    </div>
  )
}
