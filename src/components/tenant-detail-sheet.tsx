

"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Tenant } from "@/types";
import { Mail, Phone, Home, Edit, MapPin, User, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { useProtection } from "@/context/protection-context";
import { useData } from "@/context/data-context";

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

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.76 2.81 1.91 3.58-.71 0-1.37-.22-1.95-.54v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.35 0-.69-.02-1.03-.06C3.44 20.29 5.7 21 8.12 21c7.34 0 11.35-6.08 11.35-11.35 0-.17 0-.34-.01-.51.78-.57 1.45-1.28 1.99-2.09z" />
    </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
    </svg>
);


export function TenantDetailSheet({
  tenant,
  isOpen,
  onOpenChange,
}: TenantDetailSheetProps) {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { isAdmin } = useAuth();
  const { withProtection } = useProtection();
  const { setEditingTenant, setIsTenantDialogOpen } = useData();
  const sheetContentRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    // ... same as before
  };

  const handlePrint = () => {
    // ... same as before
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

  const handleEdit = (e: React.MouseEvent) => {
    if (!tenant) return;
    withProtection(() => {
        setEditingTenant(tenant);
        onOpenChange(false); // Close the sheet
        setTimeout(() => setIsTenantDialogOpen(true), 150); // Open the dialog after a short delay
    }, e);
  };

  if (!tenant) return null;
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Tenant Details: {tenant.name}</SheetTitle>
          <SheetDescription>A quick overview of the tenant's information.</SheetDescription>
        </SheetHeader>

        <div ref={sheetContentRef} className="flex-grow overflow-y-auto bg-muted/20">
            <div className="bg-background shadow-sm">
                <div className="p-6">
                    <p className="text-lg font-semibold text-primary">{settings.houseName}</p>
                    <p className="text-sm text-muted-foreground">{settings.houseAddress}</p>
                </div>
                <div className="relative h-20 bg-muted">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarImage src={tenant.avatar} data-ai-hint="person avatar" />
                            <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
            
            <div className="text-center pt-12 pb-6 px-6 bg-background">
                 <h2 className="text-2xl font-bold">{tenant.name}</h2>
                 <p className="text-muted-foreground">{tenant.property}</p>
            </div>
            
            <div className="p-6 space-y-4">
                <div className="p-4 bg-background rounded-lg shadow-sm">
                     <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
                     <div className="space-y-3 text-sm">
                        {tenant.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${tenant.phone}`} className="text-primary hover:underline">{tenant.phone}</a>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">{tenant.email}</a>
                        </div>
                        {tenant.address && (
                             <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{tenant.address}</span>
                            </div>
                        )}
                     </div>
                </div>

                <div className="p-4 bg-background rounded-lg shadow-sm">
                     <h3 className="text-sm font-semibold mb-3">Personal Details</h3>
                     <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Father's Name: <strong>{tenant.father_name || "N/A"}</strong></span>
                        </div>
                     </div>
                </div>
                
                <div className="p-4 bg-background rounded-lg shadow-sm">
                     <h3 className="text-sm font-semibold mb-3">Social Media</h3>
                     <div className="flex items-center gap-3">
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500 hover:text-green-600" onClick={handleWhatsappMessage}>
                            <WhatsAppIcon className="h-6 w-6"/>
                        </Button>
                         <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-600 hover:text-blue-700" disabled>
                            <FacebookIcon className="h-5 w-5"/>
                        </Button>
                         <Button size="icon" variant="ghost" className="h-9 w-9 text-sky-500 hover:text-sky-600" disabled>
                            <TwitterIcon className="h-5 w-5"/>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-pink-500 hover:text-pink-600" disabled>
                            <InstagramIcon className="h-6 w-6"/>
                        </Button>
                     </div>
                </div>
            </div>
        </div>
        <Separator />
        <SheetFooter className="mt-auto p-4 bg-background border-t">
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <Button variant="ghost" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="ghost" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
            {isAdmin && (
                <SheetClose asChild>
                    <Button onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Tenant
                    </Button>
                </SheetClose>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
