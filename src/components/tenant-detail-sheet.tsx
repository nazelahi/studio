
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
import type { Tenant } from "@/types";
import { Mail, Phone, Home, Calendar, DollarSign, FileText, Download, Printer, ImageIcon } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const sheetContentRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const input = sheetContentRef.current;
    if (!input || !tenant) return;

    toast({ title: "Generating PDF...", description: "Please wait a moment." });
    
    try {
      // Temporarily remove box-shadow for cleaner canvas capture
      const originalShadow = input.style.boxShadow;
      input.style.boxShadow = 'none';

      const canvas = await html2canvas(input, { scale: 2 });
      
      // Restore box-shadow
      input.style.boxShadow = originalShadow;

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

  const handlePrint = () => {
     const input = sheetContentRef.current;
     if (!input) return;

      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
          printWindow.document.write('<html><head><title>Print Tenant Details</title>');
          // Inject styles
          const styles = Array.from(document.styleSheets)
              .map(styleSheet => {
                  try {
                      return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                  } catch (e) {
                      console.log('Access to stylesheet %s is denied. Skipping.', styleSheet.href);
                      return '';
                  }
              }).join('');
          printWindow.document.write(`<style>${styles}</style>`);
          printWindow.document.write('</head><body >');
          printWindow.document.write(input.innerHTML);
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.focus();
          // Use a timeout to ensure content is rendered before printing
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
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
        return '';
    }
  };


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Tenant Details</SheetTitle>
          <SheetDescription>
            A quick overview of the tenant's information.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div ref={sheetContentRef} className="flex-grow overflow-y-auto p-1 -m-1 bg-background">
          <div className="space-y-6 py-4">
             <div className="flex flex-col items-center text-center space-y-2">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={tenant.avatar} alt={tenant.name} data-ai-hint="person avatar" />
                    <AvatarFallback><ImageIcon className="h-12 w-12 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold">{tenant.name}</h2>
                    <p className="text-muted-foreground">{tenant.property}</p>
                    <Badge className={`mt-2 ${getStatusBadge(tenant.status)}`}>{tenant.status}</Badge>
                </div>
            </div>

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
                        <span>Monthly Rent: <strong>৳{tenant.rent.toFixed(2)}</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined on: <strong>{format(parseISO(tenant.joinDate), "MMMM dd, yyyy")}</strong></span>
                    </div>
                </CardContent>
            </Card>

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
        <Separator />
        <SheetFooter className="mt-auto">
          <div className="flex w-full justify-end gap-2">
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
  );
}
