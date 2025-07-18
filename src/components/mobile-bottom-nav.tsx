

"use client"

import * as React from "react"
import { Home, Users, Briefcase, FileText, HandCoins, Archive } from "lucide-react"
import { useAppContext } from "@/context/app-context"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const { settings } = useAppContext();
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'overview', icon: Home, label: settings.tabNames.overview },
    { id: 'contacts', icon: Users, label: settings.tabNames.tenants },
    { id: 'work', icon: Briefcase, label: settings.tabNames.work },
    { id: 'documents', icon: Archive, label: settings.tabNames.documents },
    { id: 'reports', icon: FileText, label: settings.tabNames.reports },
    { id: 'zakat', icon: HandCoins, label: settings.tabNames.zakat },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 border-t" style={{ backgroundColor: 'hsl(var(--mobile-nav-background))', color: 'hsl(var(--mobile-nav-foreground))' }}>
      <div className="grid h-full max-w-lg grid-cols-6 mx-auto font-medium">
        {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    type="button"
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-2 group transition-opacity",
                        isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
                    )}
                    onClick={() => onTabChange(item.id)}
                    style={{ color: 'hsl(var(--mobile-nav-foreground))' }}
                >
                    <item.icon className={cn("w-5 h-5 mb-1", isActive ? "text-[hsl(var(--mobile-nav-foreground))]" : "text-[hsl(var(--mobile-nav-foreground))] group-hover:text-[hsl(var(--mobile-nav-foreground))]")} />
                    <span className="text-xs">{item.label}</span>
                </button>
            )
        })}
      </div>
    </div>
  );
}
