
"use client"

import * as React from "react"
import { useAppContext } from "@/context/app-context"
import { MapPin } from "lucide-react"

export function AppHeader() {
  const { settings } = useAppContext();

  return (
    <div className="relative rounded-lg border bg-card text-card-foreground shadow-sm p-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-secondary/30 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
          backgroundSize: "1rem 1rem",
        }}
      />
      <div className="relative z-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{settings.houseName}</h1>
        <div className="flex items-center justify-center gap-2 mt-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <p>{settings.houseAddress}</p>
        </div>
      </div>
    </div>
  )
}
