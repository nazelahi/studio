
"use client"

import { useSettings } from "@/context/settings-context"
import { Mail, MapPin, Phone } from "lucide-react";

export function AppFooter() {
    const { settings } = useSettings();

    return (
        <footer className="mt-auto bg-background border-t">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-2">
                         <span className="text-lg font-semibold">{settings.appName}</span>
                        <p className="text-sm text-muted-foreground">
                            {settings.aboutUs}
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div>
                                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Contact Us</h3>
                                <ul className="mt-4 space-y-2 text-sm">
                                    {settings.contactPhone && (
                                        <li className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary"/>
                                            <a href={`tel:${settings.contactPhone}`} className="text-muted-foreground hover:text-primary">{settings.contactPhone}</a>
                                        </li>
                                    )}
                                     {settings.contactEmail && (
                                        <li className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-primary"/>
                                            <a href={`mailto:${settings.contactEmail}`} className="text-muted-foreground hover:text-primary">{settings.contactEmail}</a>
                                        </li>
                                    )}
                                </ul>
                             </div>
                             <div>
                                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Address</h3>
                                 <ul className="mt-4 space-y-2 text-sm">
                                     {settings.contactAddress && (
                                        <li className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-1"/>
                                            <span className="text-muted-foreground">{settings.contactAddress}</span>
                                        </li>
                                    )}
                                </ul>
                             </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-border pt-4 text-center">
                     <p className="text-xs text-muted-foreground">{settings.footerName}</p>
                </div>
            </div>
        </footer>
    );
}
