
"use client"

import { useSettings } from "@/context/settings-context"
import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "./icons";

export function AppFooter() {
    const { settings } = useSettings();

    return (
        <footer className="mt-8 pt-8 border-t bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <Logo className="h-6 w-6 text-primary"/>
                            <span className="text-lg font-bold">{settings.appName}</span>
                        </div>
                        <p className="text-muted-foreground text-xs max-w-md">
                            {settings.aboutUs}
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Contact Information</h3>
                        <div className="mt-4 space-y-2 text-xs">
                            {settings.contactPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-primary flex-shrink-0"/>
                                    <a href={`tel:${settings.contactPhone}`} className="text-muted-foreground hover:text-primary">{settings.contactPhone}</a>
                                </div>
                            )}
                            {settings.contactEmail && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-primary flex-shrink-0"/>
                                    <a href={`mailto:${settings.contactEmail}`} className="text-muted-foreground hover:text-primary">{settings.contactEmail}</a>
                                </div>
                            )}
                            {settings.contactAddress && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5"/>
                                    <p className="text-muted-foreground">{settings.contactAddress}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-border py-4 text-center">
                     <p className="text-xs text-muted-foreground">{settings.footerName}</p>
                </div>
            </div>
        </footer>
    );
}
