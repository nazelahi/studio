// src/app/work-report/page.tsx

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
};

export default function WorkReportPage() {
    const { workDetails, loading } = useData()
    const router = useRouter()
    const reportContentRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const grandTotal = React.useMemo(() => {
        return workDetails.reduce((acc, work) => acc + (work.product_cost || 0) + (work.worker_cost || 0), 0);
    }, [workDetails])

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const input = reportContentRef.current;
        if (!input) {
            toast({ title: "Error", description: "Could not find report content to download.", variant: "destructive" });
            return;
        }
        toast({ title: "Generating PDF...", description: "Please wait a moment." });
        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Full_Work_Report.pdf`);
            toast({ title: "Success", description: "PDF has been downloaded." });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 no-print">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>
                <div ref={reportContentRef} className="printable-area bg-background p-6 rounded-lg shadow-sm">
                    <Card>
                        <CardHeader>
                            <CardTitle>Full Work Report</CardTitle>
                            <CardDescription>A comprehensive list of all work details recorded.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow className="bg-primary hover:bg-primary/90">
                                    <TableHead className="text-primary-foreground">Work Category</TableHead>
                                    <TableHead className="text-primary-foreground hidden sm:table-cell">Product Price</TableHead>
                                    <TableHead className="text-primary-foreground hidden sm:table-cell">Worker Cost</TableHead>
                                    <TableHead className="text-primary-foreground">Status</TableHead>
                                    <TableHead className="text-right text-primary-foreground">Total Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                        ))
                                    ) : workDetails.length > 0 ? (
                                    workDetails.map((work) => {
                                        const totalCost = (work.product_cost || 0) + (work.worker_cost || 0);
                                        const isCompleted = work.status === 'Completed';
                                        return (
                                        <TableRow key={work.id}>
                                            <TableCell className="font-medium">{work.title}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{formatCurrency(work.product_cost)}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{formatCurrency(work.worker_cost)}</TableCell>
                                            <TableCell>
                                                <div className={cn("p-2 rounded-md text-center", isCompleted ? 'bg-green-200' : 'bg-transparent')}>
                                                {isCompleted ? 'Paid' : work.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(totalCost)}</TableCell>
                                        </TableRow>
                                        )
                                    })
                                    ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No work items found.
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                                {workDetails.length > 0 && (
                                    <TableFooter>
                                        <TableRow className="bg-lime-500 hover:bg-lime-500/90 font-bold">
                                            <TableCell colSpan={3} className="text-white text-right sm:text-left">Grand Total</TableCell>
                                            <TableCell colSpan={2} className="text-right text-white">{formatCurrency(grandTotal)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
