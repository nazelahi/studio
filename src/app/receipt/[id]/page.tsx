// src/app/receipt/[id]/page.tsx

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { useSettings } from "@/context/settings-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer, LoaderCircle, Building, User } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { type RentEntry } from "@/types"
import { format, parseISO } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/icons"
import { supabase } from "@/lib/supabase"

const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
};

export default function ReceiptPage() {
    const { getRentEntryById, loading: dataLoading } = useData()
    const { settings, loading: settingsLoading } = useSettings()
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const reportContentRef = React.useRef<HTMLDivElement>(null);

    const [rentEntry, setRentEntry] = React.useState<RentEntry | null>(null);
    const [loading, setLoading] = React.useState(true);

    const rentEntryId = Array.isArray(params.id) ? params.id[0] : params.id;

    React.useEffect(() => {
        const fetchReceiptData = async () => {
            if (!rentEntryId) {
                setLoading(false);
                return;
            }

            // First, try to get data from context
            const entryFromContext = getRentEntryById(rentEntryId);
            
            if (entryFromContext) {
                setRentEntry(entryFromContext);
                setLoading(false);
            } else if (!dataLoading) { 
                // If not in context and context is done loading, fetch directly
                try {
                    const { data, error } = await supabase
                        .from('rent_entries')
                        .select('*')
                        .eq('id', rentEntryId)
                        .single();
                    
                    if (error) throw error;
                    setRentEntry(data);
                } catch (error) {
                    console.error("Failed to fetch receipt data directly:", error);
                    setRentEntry(null);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        // Only run fetch logic if the data context isn't loading, or if the rent entry is not yet found.
        if(!dataLoading || !rentEntry) {
            fetchReceiptData();
        }

    }, [rentEntryId, getRentEntryById, dataLoading, rentEntry]);


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
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
            pdf.save(`Receipt_${rentEntry?.name}_${rentEntry?.year}-${(rentEntry?.month || 0)+1}.pdf`);
            toast({ title: "Success", description: "PDF has been downloaded." });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
        }
    };
    
    if (loading || settingsLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Receipt...</p>
            </div>
        )
    }
    
    if (!rentEntry) {
         return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <p className="mt-4 text-destructive">Receipt not found.</p>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        )
    }

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
                <div ref={reportContentRef} className="printable-area bg-background p-8 rounded-lg shadow-sm border">
                    <header className="flex justify-between items-start pb-6 border-b">
                        <div className="flex items-center gap-4">
                            {settings.ownerPhotoUrl ? (
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={settings.ownerPhotoUrl} data-ai-hint="person logo" />
                                    <AvatarFallback><Logo /></AvatarFallback>
                                </Avatar>
                            ) : <Logo className="h-12 w-12 text-primary"/>}
                            <div>
                                <h1 className="text-2xl font-bold text-primary">{settings.houseName}</h1>
                                <p className="text-muted-foreground">{settings.houseAddress}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold uppercase text-muted-foreground tracking-wider">Receipt</h2>
                            <p className="text-sm text-muted-foreground">Receipt #: {rentEntry.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                    </header>
                    
                    <section className="grid grid-cols-2 gap-8 my-8">
                        <div>
                           <Card className="h-full">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                               <User className="h-5 w-5 text-muted-foreground"/>
                               <h3 className="text-base font-semibold">Billed To</h3>
                            </CardHeader>
                            <CardContent>
                                <p className="font-bold text-lg">{rentEntry.name}</p>
                                <p className="text-muted-foreground">{rentEntry.property}</p>
                            </CardContent>
                           </Card>
                        </div>
                         <div>
                           <Card className="h-full">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                                <Building className="h-5 w-5 text-muted-foreground"/>
                               <h3 className="text-base font-semibold">From</h3>
                            </CardHeader>
                            <CardContent>
                                <p className="font-bold text-lg">{settings.ownerName}</p>
                                <p className="text-muted-foreground">Property Owner</p>
                            </CardContent>
                           </Card>
                        </div>
                    </section>

                    <section className="my-8">
                        <Table>
                            <TableHeader>
                                <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                                    <TableHead className="text-inherit">Description</TableHead>
                                    <TableHead className="text-right text-inherit">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <div className="font-medium">Rent for {format(rentEntry.due_date, 'MMMM yyyy')}</div>
                                        <div className="text-sm text-muted-foreground">Apartment/Unit: {rentEntry.property}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(rentEntry.rent)}</TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell>Total Amount</TableCell>
                                    <TableCell className="text-right">{formatCurrency(rentEntry.rent)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </section>
                    
                     <section className="my-8">
                        <Card>
                            <CardContent className="p-4 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Payment Date</p>
                                    <p className="font-semibold">{rentEntry.payment_date ? format(parseISO(rentEntry.payment_date), 'MMMM dd, yyyy') : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="font-semibold">{rentEntry.collected_by || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <Separator className="my-8"/>

                    <footer className="text-center text-xs text-muted-foreground">
                        <p>Thank you for your payment!</p>
                        <p>{settings.footerName}</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
