

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
import { Mail, Phone, Home, Calendar, DollarSign, FileText, Download, Printer, ImageIcon, File as FileIcon, User, MapPin, Cake, CreditCard, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/context/settings-context";

interface TenantDetailSheetProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.75 13.96c.25.13.43.2.5.33.08.13.12.28.12.48 0 .2-.04.38-.12.53s-.18.28-.3.4-.27.2-.42.28-.32.12-.5.12c-.2 0-.38-.03-.56-.08s-.36-.13-.55-.23c-.34-.16-.66-.36-1-.6-.33-.24-.6-.48-.84-.72s-.45-.5-.65-.77c-.2-.27-.37-.56-.48-.85s-.18-.58-.18-.88c0-.3.06-.56.18-.78.12-.22.28-.4.48-.55.2-.14.4-.22.6-.22.1 0 .2.02.3.05s.2.06.3.1c.1.04.2.1.3.18l.1.13c.04.07.1.18.17.32l.1.2c.07.15.12.3.15.43s.05.27.05.4c0 .1-.02.2-.05.3s-.07.2-.13.28l-.13.15c-.04.05-.1.1-.15.15l-.1.1c-.04.03-.07.06-.08.1s-.02.08-.02.13c0 .05.01.1.04.15s.05.1.08.14c.08.08.18.17.3.28.12.1.24.2.37.28.2.13.4.24.6.33.2.1.4.15.6.15.2 0 .4-.04.58-.12s.3-.18.4-.3c.04-.05.1-.1.14-.18s.1-.16.14-.25.1-.18.13-.26.06-.17.06-.25c0-.1-.02-.2-.04-.28s-.06-.16-.1-.23l-.1-.14c-.03-.04-.06-.1-.1-.13l-.04-.04c-.04-.02-.1-.04-.13-.07s-.06-.05-.1-.08l-.2-.14c-.04-.03-.1-.06-.1-.1s-.07-.1-.07-.16.02-.1.08-.15.1-.1.14-.14.1-.08.14-.1.1-.04.1-.04h.1c.07-.02.13-.04.2-.06s.1-.04.14-.05.1-.02.1-.02.13 0 .2.02c.1.02.2.05.3.1.1.04.2.1.3.16.1.07.2.14.3.2l.2.2c.08.1.15.2.2.3zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path>
    </svg>
  );

export function TenantDetailSheet({
  tenant,
  isOpen,
  onOpenChange,
}: TenantDetailSheetProps) {
  const { toast } = useToast();
  const { settings } = useSettings();
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
  
    const handleWhatsappMessage = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     if (!tenant) return;
     const number = tenant.whatsapp_number || tenant.phone;
     if (!number) {
        toast({ title: "No Number", description: "This tenant does not have a WhatsApp number set.", variant: "destructive" });
        return;
     }
     const cleanNumber = number.replace(/[^0-9]/g, "");
     const message = encodeURIComponent(`Hello ${tenant.name}, this is a message regarding your tenancy at ${settings.houseName}.`);
     window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  }

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
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="text-left sr-only">
          <SheetTitle>Tenant Details</SheetTitle>
          <SheetDescription>
            A quick overview of the tenant's information.
          </SheetDescription>
        </SheetHeader>

        <div ref={sheetContentRef} className="flex-grow overflow-y-auto bg-background">
           <div className="relative bg-muted">
                <a href={tenant.avatar} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={tenant.avatar} alt={tenant.name} className="w-full h-48 object-contain" data-ai-hint="person avatar" />
                </a>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-6 pointer-events-none">
                    <h2 className="text-3xl font-bold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>{tenant.name}</h2>
                    <p className="text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>{tenant.property}</p>
                    <Badge className={`mt-2 ${getStatusBadge(tenant.status)} pointer-events-auto`}>{tenant.status}</Badge>
                </div>
            </div>

          <div className="space-y-6 p-6">
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
                            <span>Date of Birth: <strong>{format(parseISO(tenant.date_of_birth), "MMMM dd, yyyy")}</strong></span>
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
                     {tenant.whatsapp_number && (
                        <div className="flex items-center gap-3">
                            <WhatsAppIcon className="h-4 w-4 text-muted-foreground" />
                             <a href="#" onClick={handleWhatsappMessage} className="text-primary hover:underline">{tenant.whatsapp_number}</a>
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
                    {tenant.advance_deposit && (
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span>Advance Deposit: <strong>৳{tenant.advance_deposit.toFixed(2)}</strong></span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined on: <strong>{format(parseISO(tenant.join_date), "MMMM dd, yyyy")}</strong></span>
                    </div>
                </CardContent>
            </Card>

             {tenant.documents && tenant.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tenant.documents.map((doc, index) => (
                    <a key={index} href={doc} target="_blank" rel="noopener noreferrer" className="group">
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center group-hover:bg-accent transition-colors">
                         <img src={doc} alt={`Document ${index + 1}`} className="max-h-full max-w-full object-contain" data-ai-hint="document id" />
                      </div>
                    </a>
                  ))}
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
        <Separator />
        <SheetFooter className="mt-auto p-6 bg-background">
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
