
"use client"

import { useSettings } from "@/context/settings-context"
import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "./icons";

export function AppFooter() {
    const { settings } = useSettings();

    return (
        <footer className="mt-auto bg-background border-t">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Logo className="h-8 w-8 text-primary"/>
                            <span className="text-xl font-bold">{settings.appName}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {settings.aboutUs}
                        </p>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Contact Us</h3>
                            <ul className="mt-4 space-y-4">
                                {settings.contactPhone && (
                                    <li>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"/>
                                            <a href={`tel:${settings.contactPhone}`} className="text-sm text-muted-foreground hover:text-primary">{settings.contactPhone}</a>
                                        </div>
                                    </li>
                                )}
                                {settings.contactEmail && (
                                    <li>
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"/>
                                            <a href={`mailto:${settings.contactEmail}`} className="text-sm text-muted-foreground hover:text-primary">{settings.contactEmail}</a>
                                        </div>
                                    </li>
                                )}
                                {settings.contactAddress && (
                                     <li>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"/>
                                            <p className="text-sm text-muted-foreground">{settings.contactAddress}</p>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                         <div>
                            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Quick Links</h3>
                            <ul className="mt-4 space-y-4">
                                <li>
                                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                                        Dashboard
                                    </Link>
                                </li>
                                 <li>
                                    <Link href="/settings" className="text-sm text-muted-foreground hover:text-primary">
                                        Settings
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-border pt-8 text-center">
                     <p className="text-sm text-muted-foreground">{settings.footerName}</p>
                </div>
            </div>
        </footer>
    );
}
