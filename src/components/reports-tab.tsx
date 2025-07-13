

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "./ui/badge"
import { format, parseISO } from "date-fns"
import type { Tenant, RentEntry, Expense } from "@/types"
import { Button } from "./ui/button"
import { Download, Printer } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const getStatusBadge = (status: RentEntry["status"]) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Overdue": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') return '৳0.00';
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('BDT', '৳');
}

export function ReportsTab({ year }: { year: number }) {
  const { rentData, expenses, tenants, loading } = useData();
  const { isAdmin } = useAuth();
  const [reportType, setReportType] = React.useState("yearly");
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const reportContentRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = React.useState(false);


  const yearlyData = React.useMemo(() => {
    const data = months.map((month, index) => ({
      name: month,
      income: 0,
      expenses: 0,
    }));

    rentData.forEach(entry => {
      if (entry.year === year && entry.status === 'Paid') {
        data[entry.month].income += entry.rent;
      }
    });

    expenses.forEach(expense => {
      try {
        const expenseDate = parseISO(expense.date);
        if (expenseDate.getFullYear() === year) {
          data[expenseDate.getMonth()].expenses += expense.amount;
        }
      } catch (e) {
        console.error("Invalid expense date:", expense.date);
      }
    });

    return data;
  }, [year, rentData, expenses]);

  const tenantReportData = React.useMemo(() => {
    if (!selectedTenant) return [];
    return rentData
      .filter(entry => entry.tenant_id === selectedTenant)
      .sort((a, b) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime());
  }, [rentData, selectedTenant]);
  
  const monthlyTransactions = React.useMemo(() => {
    if (selectedMonth === null) return [];
    
    const income: (RentEntry & {type: 'income'})[] = rentData
      .filter(r => r.year === year && r.month === selectedMonth && r.status === 'Paid')
      .map(r => ({...r, type: 'income'}));

    const outcome: (Expense & {type: 'expense'})[] = expenses
        .filter(e => {
            try {
                const d = parseISO(e.date);
                return d.getFullYear() === year && d.getMonth() === selectedMonth;
            } catch { return false }
        })
        .map(e => ({...e, type: 'expense'}));

    return [...income, ...outcome].sort((a,b) => {
        const dateA = a.type === 'income' ? a.payment_date : a.date;
        const dateB = b.type === 'income' ? b.payment_date : b.date;
        if (!dateA || !dateB) return 0;
        return parseISO(dateA).getTime() - parseISO(dateB).getTime();
    });

  }, [rentData, expenses, year, selectedMonth]);

  const handleDownloadPdf = async () => {
    const input = reportContentRef.current;
    if (!input) {
      toast({
        title: "Error",
        description: "Could not find report content to download.",
        variant: "destructive",
      });
      return;
    }
    
    toast({ title: "Generating PDF...", description: "Please wait a moment." });

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      const tenantName = selectedTenant ? tenants.find(t => t.id === selectedTenant)?.name.replace(' ', '_') : 'All';
      const reportTitle = reportType === 'yearly' 
        ? `Yearly_Report_${year}`
        : `Tenant_Report_${tenantName}`;
        
      pdf.save(`${reportTitle}.pdf`);
      
      toast({ title: "Success", description: "PDF has been downloaded." });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="pt-4 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const totalIncome = yearlyData.reduce((acc, month) => acc + month.income, 0);
  const totalExpenses = yearlyData.reduce((acc, month) => acc + month.expenses, 0);
  const netProfit = totalIncome - totalExpenses;

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const monthName = data.activePayload[0].payload.name;
      const monthIndex = months.indexOf(monthName);
      setSelectedMonth(monthIndex);
    }
  }
  
  const selectedTenantName = selectedTenant ? tenants.find(t => t.id === selectedTenant)?.name : 'N/A';

  return (
    <div className="pt-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex-shrink-0">Reports</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Yearly / Monthly</SelectItem>
                <SelectItem value="tenant">Tenant-based</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4"/>
            PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4"/>
            Print
          </Button>
        </div>
      </div>
        <div ref={reportContentRef} className="printable-area space-y-6 bg-background p-4 rounded-lg">
          {reportType === 'yearly' && (
            <Card>
              <CardHeader>
                <CardTitle>Yearly Report for {year}</CardTitle>
                <CardDescription className="no-print">An overview of your income and expenses for the year. Click a bar to see monthly details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-success/10 border-success/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-success-foreground">Total Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-destructive/10 border-destructive/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-destructive-foreground">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(netProfit)}</p>
                        </CardContent>
                    </Card>
                </div>

                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={yearlyData} onClick={handleBarClick}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value as number)}/>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {selectedMonth !== null && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transactions for {months[selectedMonth]} {year}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlyTransactions.length > 0 ? monthlyTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{format(parseISO(tx.type === 'income' ? tx.payment_date! : tx.date!), "dd MMM yyyy")}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{tx.type === 'income' ? `${tx.name} (${tx.property})` : tx.category}</div>
                                                {tx.type === 'expense' && <div className="text-sm text-muted-foreground">{tx.description}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.type === 'income' ? 'secondary' : 'outline'}>{tx.type}</Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                                {formatCurrency(tx.type === 'income' ? tx.rent : tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">No transactions for this month.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
              </CardContent>
            </Card>
          )}

          {reportType === 'tenant' && (
            <Card>
              <CardHeader>
                <CardTitle>Tenant Report</CardTitle>
                <CardDescription className="no-print">Select a tenant to view their payment history.</CardDescription>
                <div className="no-print">
                    <Select onValueChange={setSelectedTenant}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select a tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>{tenant.name} - {tenant.property}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTenant ? (
                  <>
                    <h3 className="text-xl font-semibold">Payment History for: {selectedTenantName}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                          <TableHead className="hidden md:table-cell">Payment Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenantReportData.length > 0 ? tenantReportData.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{months[entry.month]} {entry.year}</TableCell>
                            <TableCell className="hidden sm:table-cell">{format(parseISO(entry.due_date), "dd MMM yyyy")}</TableCell>
                            <TableCell className="hidden md:table-cell">{entry.payment_date ? format(parseISO(entry.payment_date), "dd MMM yyyy") : 'N/A'}</TableCell>
                            <TableCell><Badge className={getStatusBadge(entry.status)}>{entry.status}</Badge></TableCell>
                            <TableCell className="text-right">{formatCurrency(entry.rent)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center">No payment history found for this tenant.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                ) : <div className="text-center text-muted-foreground p-10">Please select a tenant to view their report.</div> }
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  )
}
