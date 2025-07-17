

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, TooltipProps } from 'recharts';
import { Badge } from "./ui/badge"
import { format as formatDateLib, parseISO } from "date-fns"
import type { Tenant, RentEntry, Expense } from "@/types"
import { Button } from "./ui/button"
import { Download, Printer, FileText, DollarSign, TrendingDown, Calculator, Landmark } from "lucide-react"
import { Label } from "@/components/ui/label"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useSettings } from "@/context/settings-context"
import { formatCurrency, formatDate } from "@/lib/utils"

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1943", "#19B2FF"];


const getStatusBadge = (status: RentEntry["status"]) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Overdue": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const CustomTooltip = ({ active, payload, label, settings }: TooltipProps<number, string> & { settings: any }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-sm bg-background/80 backdrop-blur-sm border rounded-md shadow-lg">
          <p className="font-bold">{`${payload[0].name}: ${formatCurrency(payload[0].value, settings.currencySymbol)}`}</p>
        </div>
      );
    }
    return null;
};

export function ReportsTab({ year }: { year: number }) {
  const { rentData, expenses, tenants, loading } = useData();
  const { settings } = useSettings();
  const [reportType, setReportType] = React.useState("monthly");
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth());
  const reportContentRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Yearly Data
  const yearlySummary = React.useMemo(() => {
    const income = rentData.filter(e => e.year === year && e.status === 'Paid').reduce((acc, e) => acc + e.rent, 0);
    const expenseTotal = expenses.filter(e => {
        try { return parseISO(e.date).getFullYear() === year; }
        catch { return false; }
    }).reduce((acc, e) => acc + e.amount, 0);
    return { income, expenses: expenseTotal, net: income - expenseTotal };
  }, [year, rentData, expenses]);
  
  const yearlyChartData = [
      { name: 'Total Income', value: yearlySummary.income },
      { name: 'Total Expenses', value: yearlySummary.expenses },
  ];

  // Monthly Data
  const monthlySummary = React.useMemo(() => {
    const income = rentData.filter(e => e.year === year && e.month === selectedMonth && e.status === 'Paid').reduce((acc, e) => acc + e.rent, 0);
    const expenseTotal = expenses.filter(e => {
        try { 
            const d = parseISO(e.date);
            return d.getFullYear() === year && d.getMonth() === selectedMonth;
        }
        catch { return false; }
    }).reduce((acc, e) => acc + e.amount, 0);
    return { 
        income, 
        expenses: expenseTotal, 
        net: income - expenseTotal,
        deposit: income > expenseTotal ? income - expenseTotal : 0
    };
  }, [year, selectedMonth, rentData, expenses]);
  
  const monthlyRentCollections = React.useMemo(() => rentData.filter(r => r.year === year && r.month === selectedMonth), [rentData, year, selectedMonth]);
  const monthlyExpenses = React.useMemo(() => expenses.filter(e => {
        try { 
            const d = parseISO(e.date);
            return d.getFullYear() === year && d.getMonth() === selectedMonth;
        }
        catch { return false; }
    }), [expenses, year, selectedMonth]);
    
  const monthlyExpenseChartData = React.useMemo(() => {
      const categoryMap = new Map<string, number>();
      monthlyExpenses.forEach(e => {
          categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
      });
      return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [monthlyExpenses]);


  // Tenant Data
  const tenantReportData = React.useMemo(() => {
    if (!selectedTenant) return [];
    return rentData
      .filter(entry => entry.tenant_id === selectedTenant)
      .sort((a, b) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime());
  }, [rentData, selectedTenant]);

  const handleDownloadPdf = async () => {
    const input = reportContentRef.current;
    if (!input) {
      toast({ title: "Error", description: "Could not find report content to download.", variant: "destructive" });
      return;
    }
    
    toast({ title: "Generating PDF...", description: "Please wait a moment." });
    try {
      const canvas = await html2canvas(input, { scale: 2, backgroundColor: 'hsl(var(--background))' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Report_${reportType}_${year}.pdf`);
      toast({ title: "Success", description: "PDF has been downloaded." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <div className="pt-4 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const selectedTenantName = selectedTenant ? tenants.find(t => t.id === selectedTenant)?.name : 'N/A';

  const renderContent = () => {
    switch(reportType) {
        case 'yearly':
            return (
                <Card>
                  <CardHeader>
                    <CardTitle>Yearly Financial Summary for {year}</CardTitle>
                    <CardDescription>An overview of your finances for the entire year.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                     <div className="space-y-4">
                        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50">
                            <CardContent className="p-4 flex justify-between items-center">
                                <span className="font-medium text-green-600 dark:text-green-400">Total Income</span>
                                <span className="font-bold text-xl text-green-700 dark:text-green-300">{formatCurrency(yearlySummary.income, settings.currencySymbol)}</span>
                            </CardContent>
                        </Card>
                         <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50">
                            <CardContent className="p-4 flex justify-between items-center">
                                <span className="font-medium text-red-600 dark:text-red-400">Total Expenses</span>
                                <span className="font-bold text-xl text-red-700 dark:text-red-300">{formatCurrency(yearlySummary.expenses, settings.currencySymbol)}</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex justify-between items-center">
                                <span className="font-medium">Net Profit</span>
                                <span className={`font-bold text-xl ${yearlySummary.net >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(yearlySummary.net, settings.currencySymbol)}</span>
                            </CardContent>
                        </Card>
                     </div>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={yearlyChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    <Cell fill="hsl(var(--chart-1))" />
                                    <Cell fill="hsl(var(--destructive))" />
                                </Pie>
                                <Tooltip content={<CustomTooltip settings={settings} />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
            );
        case 'monthly':
            return (
                 <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary"/>
                        <h2 className="text-xl font-bold">Financial Report - {months[selectedMonth]} {year}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Rent Collected</p><div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-500"/><p className="text-xl font-bold text-green-600">{formatCurrency(monthlySummary.income, settings.currencySymbol)}</p></div></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Expenses</p><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500"/><p className="text-xl font-bold text-red-600">{formatCurrency(monthlySummary.expenses, settings.currencySymbol)}</p></div></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Net Amount</p><div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-blue-500"/><p className={`text-xl font-bold ${monthlySummary.net >=0 ? 'text-blue-600':'text-red-600'}`}>{monthlySummary.net >= 0 ? '+' : ''}{formatCurrency(monthlySummary.net, settings.currencySymbol)}</p></div></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Available for Deposit</p><div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-purple-500"/><p className="text-xl font-bold text-purple-600">{formatCurrency(monthlySummary.deposit, settings.currencySymbol)}</p></div></CardContent></Card>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Rent Collections - {months[selectedMonth]} {year}</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Tenant</TableHead><TableHead>Flat</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {monthlyRentCollections.map(r => <TableRow key={r.id}><TableCell>{r.name}</TableCell><TableCell><Badge variant="outline">{r.property}</Badge></TableCell><TableCell className="text-right font-medium">{r.status === "Paid" ? formatCurrency(r.rent, settings.currencySymbol) : "-"}</TableCell></TableRow>)}
                                    </TableBody>
                                    <TableFooter><TableRow><TableCell colSpan={2} className="font-bold">Total Collected:</TableCell><TableCell className="text-right font-bold">{formatCurrency(monthlySummary.income, settings.currencySymbol)}</TableCell></TableRow></TableFooter>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-base">Expenses - {months[selectedMonth]} {year}</CardTitle></CardHeader>
                            <CardContent>
                                 <Table>
                                    <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {monthlyExpenses.map(e => <TableRow key={e.id}><TableCell>{e.description || e.category}</TableCell><TableCell className="text-right font-medium text-red-600">{formatCurrency(e.amount, settings.currencySymbol)}</TableCell></TableRow>)}
                                    </TableBody>
                                    <TableFooter><TableRow><TableCell className="font-bold">Total Expenses:</TableCell><TableCell className="text-right font-bold text-red-600">{formatCurrency(monthlySummary.expenses, settings.currencySymbol)}</TableCell></TableRow></TableFooter>
                                </Table>
                                {monthlyExpenseChartData.length > 0 && (
                                    <div className="h-48 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={monthlyExpenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5}>
                                                    {monthlyExpenseChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                 <Tooltip content={<CustomTooltip settings={settings} />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            );
        case 'tenant':
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant Payment History: {selectedTenantName}</CardTitle>
                        <CardDescription>A complete payment history for the selected tenant.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {selectedTenant ? (
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
                                  <TableCell className="hidden sm:table-cell">{formatDate(entry.due_date, settings.dateFormat)}</TableCell>
                                  <TableCell className="hidden md:table-cell">{formatDate(entry.payment_date, settings.dateFormat)}</TableCell>
                                  <TableCell><Badge className={getStatusBadge(entry.status)}>{entry.status}</Badge></TableCell>
                                  <TableCell className="text-right">{formatCurrency(entry.rent, settings.currencySymbol)}</TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No payment history found for this tenant.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                       ) : (
                          <div className="text-center text-muted-foreground p-10">Please select a tenant to view their report.</div>
                       )}
                    </CardContent>
                </Card>
            )
    }
  }

  return (
    <div className="pt-4 space-y-6">
      <Card className="no-print">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                <div>
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger><SelectValue placeholder="Select Report Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Summary</SelectItem>
                        <SelectItem value="yearly">Yearly Summary</SelectItem>
                        <SelectItem value="tenant">Tenant History</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                {reportType === 'monthly' && (
                    <div>
                        <Label>Month</Label>
                        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select month..." /></SelectTrigger>
                            <SelectContent>
                                {months.map((month, index) => <SelectItem key={index} value={index.toString()}>{month}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {reportType === 'tenant' && (
                    <div className="col-span-2 sm:col-span-1">
                        <Label>Tenant</Label>
                        <Select onValueChange={setSelectedTenant}>
                          <SelectTrigger><SelectValue placeholder="Select a tenant..." /></SelectTrigger>
                          <SelectContent>
                            {tenants.map(tenant => (
                              <SelectItem key={tenant.id} value={tenant.id}>{tenant.name} - {tenant.property}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            <div className="flex items-end gap-2 self-end">
              <Button variant="outline" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4"/>PDF</Button>
              <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
            </div>
          </CardContent>
      </Card>
      <div ref={reportContentRef} className="printable-area space-y-6 bg-background p-4 rounded-lg">
        {renderContent()}
      </div>
    </div>
  )
}

    
