

"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, RentEntry } from "@/types";
import { Mail, Phone, Home, Calendar, DollarSign, FileText, Download, Printer, ImageIcon, File as FileIcon, User, MapPin, Cake, CreditCard, ShieldCheck, ChevronLeft, ChevronRight, X, Flame, Zap, UserSquare2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format as formatDateLib, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/app-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { TenantIdCard } from "./tenant-id-card";
import { saveAs } from "file-saver";
import { formatCurrency, formatDate } from "@/lib/utils"

interface TenantDetailSheetProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TenantDetailSheet({
  tenant,
  isOpen,
  onOpenChange,
}: TenantDetailSheetProps) {
  const { toast } = useToast();
  const { rentData, settings } = useAppContext();
  const sheetContentRef = React.useRef<HTMLDivElement>(null);
  const idCardRef = React.useRef<HTMLDivElement>(null);
  const [showAllHistory, setShowAllHistory] = React.useState(false);
  
  const tenantPaymentHistory = React.useMemo(() => {
    if (!tenant) return [];
    return rentData
      .filter(entry => entry.tenant_id === tenant.id)
      .sort((a, b) => {
        const dateA = new Date(a.year, a.month);
        const dateB = new Date(b.year, b.month);
        return dateB.getTime() - dateA.getTime();
      });
  }, [rentData, tenant]);

  const handleDownloadPdf = async () => {
    const input = sheetContentRef.current;
    if (!input || !tenant) return;

    toast({ title: "Generating PDF...", description: "Please wait a moment." });
    
    try {
      const originalBackgroundColor = document.body.style.backgroundColor;
      document.body.style.backgroundColor = "white";

      const canvas = await html2canvas(input, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.style.backgroundColor = originalBackgroundColor;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Tenant_Details_${tenant.name.replace(" ", "_")}.pdf`);
      toast({ title: "Success", description: "PDF has been downloaded." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };
  
  const handleDownloadIdCard = async () => {
    const input = idCardRef.current;
    if (!input || !tenant) return;
    
    toast({ title: "Generating ID Card...", description: "Please wait a moment." });

    try {
        const canvas = await html2canvas(input, {
            scale: 3, 
            useCORS: true,
            backgroundColor: null,
        });
        canvas.toBlob(function(blob) {
            if (blob) {
                saveAs(blob, `ID_Card_${tenant.name.replace(/\s/g, '_')}.png`);
                 toast({ title: "Success", description: "ID Card has been downloaded." });
            }
        });
    } catch (error) {
        console.error("Error generating ID card:", error);
        toast({ title: "Error", description: "Failed to generate ID card.", variant: "destructive" });
    }
  };


  const handlePrint = () => {
     const input = sheetContentRef.current;
     if (!input) return;
      
      const printContainer = document.createElement('div');
      printContainer.innerHTML = input.innerHTML;

      const styles = Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
                console.warn('Cannot access stylesheet rules. Cross-origin policy may be blocking it.', e);
                return '';
            }
        }).join('\n');

      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
          printWindow.document.write('<html><head><title>Print Tenant Details</title>');
          printWindow.document.write(`<style>${styles}</style>`);
          printWindow.document.write('</head><body>');
          printWindow.document.write(printContainer.innerHTML);
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.focus();
          
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
      }
  };
  
  if (!tenant) return null;
  
  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-success text-success-foreground hover:bg-success/80';
      case 'Pending':
        return 'bg-warning text-warning-foreground hover:bg-warning/80';
      case 'Overdue':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const getPaymentStatusBadge = (status: RentEntry['status']) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }


  return (
    <>
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="text-left sr-only">
          <SheetTitle>Tenant Details</SheetTitle>
          <SheetDescription>
            A quick overview of the tenant's information.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto bg-background printable-area" id="tenant-details-content">
          <div ref={sheetContentRef} className="p-6">
           <div className="relative -mx-6 -mt-6 bg-muted">
                <a href={tenant.avatar} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={tenant.avatar} alt={tenant.name} className="w-full h-48 object-contain" data-ai-hint="person avatar" />
                </a>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-6 pointer-events-none">
                    <h2 className="text-3xl font-bold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>{tenant.name}</h2>
                    <p className="text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>{tenant.property}</p>
                    <Badge className={cn("mt-2 pointer-events-auto", getStatusBadge(tenant.status))}>{tenant.status}</Badge>
                </div>
            </div>

          <div className="space-y-6 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {tenant.father_name && (
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Father's Name: <strong>{tenant.father_name}</strong></span>
                        </div>
                    )}
                     {tenant.date_of_birth && (
                        <div className="flex items-center gap-3">
                            <Cake className="h-4 w-4 text-muted-foreground" />
                            <span>Date of Birth: <strong>{formatDate(tenant.date_of_birth, settings.dateFormat)}</strong></span>
                        </div>
                    )}
                    {tenant.nid_number && (
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span>NID: <strong>{tenant.nid_number}</strong></span>
                        </div>
                    )}
                    {tenant.address && (
                         <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex flex-col">
                                <span>Address:</span>
                                <strong>{tenant.address}</strong>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">{tenant.email}</a>
                    </div>
                    {tenant.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                             <a href={`tel:${tenant.phone}`} className="text-primary hover:underline">{tenant.phone}</a>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Tenancy Details</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>Rents <strong>{tenant.property}</strong></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Monthly Rent: <strong>{formatCurrency(tenant.rent, settings.currencySymbol)}</strong></span>
                    </div>
                    {tenant.advance_deposit && (
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span>Advance Deposit: <strong>{formatCurrency(tenant.advance_deposit, settings.currencySymbol)}</strong></span>
                        </div>
                    )}
                    {tenant.gas_meter_number && (
                        <div className="flex items-center gap-3">
                            <Flame className="h-4 w-4 text-muted-foreground" />
                            <span>Gas Meter: <strong>{tenant.gas_meter_number}</strong></span>
                        </div>
                    )}
                    {tenant.electric_meter_number && (
                        <div className="flex items-center gap-3">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span>Electric Meter: <strong>{tenant.electric_meter_number}</strong></span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined on: <strong>{formatDate(tenant.join_date, settings.dateFormat)}</strong></span>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Payment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                     {tenantPaymentHistory.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                                        <TableHead className="text-inherit">Period</TableHead>
                                        <TableHead className="text-inherit">Status</TableHead>
                                        <TableHead className="text-right text-inherit">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenantPaymentHistory.slice(0, showAllHistory ? tenantPaymentHistory.length : 10).map(entry => (
                                        <TableRow key={entry.id} className="odd:bg-muted/50">
                                            <TableCell className="font-medium">{formatDateLib(new Date(entry.year, entry.month), 'MMMM yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-xs", getPaymentStatusBadge(entry.status))}>{entry.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(entry.rent, settings.currencySymbol)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {tenantPaymentHistory.length > 10 && (
                                <div className="p-4 border-t text-center">
                                    <Button variant="link" onClick={() => setShowAllHistory(!showAllHistory)}>
                                        {showAllHistory ? "Show Less" : `View All ${tenantPaymentHistory.length} Records`}
                                    </Button>
                                </div>
                            )}
                        </>
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No payment history available.</p>
                     )}
                </CardContent>
            </Card>


             {tenant.documents && tenant.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                   <Carousel
                      opts={{
                        align: "start",
                      }}
                      className="w-full"
                    >
                      <CarouselContent>
                        {tenant.documents.map((doc, index) => (
                          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                               <Dialog>
                                    <DialogTrigger asChild>
                                      <div className="group aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden cursor-pointer">
                                         <img src={doc} alt={`Document ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" data-ai-hint="document id" />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                                        <img src={doc} alt={`Document ${index + 1}`} className="w-full h-auto rounded-lg" />
                                    </DialogContent>
                                </Dialog>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                </CardContent>
              </Card>
            )}

            {tenant.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tenant.notes}</p>
                    </CardContent>
                </Card>
            )}
          </div>
          </div>
        </div>
        <Separator />
        <SheetFooter className="mt-auto p-4 bg-background no-print">
          <div className="flex w-full justify-end gap-2 flex-wrap">
             <Button variant="outline" onClick={handleDownloadIdCard}>
              <UserSquare2 className="mr-2 h-4 w-4" />
              Download ID Card
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    {/* This component is rendered off-screen for the canvas conversion */}
    <div className="fixed -left-[9999px] top-0">
        {tenant && <TenantIdCard tenant={tenant} innerRef={idCardRef} />}
    </div>
    </>
  );
}
