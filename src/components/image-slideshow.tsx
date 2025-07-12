
"use client"

import * as React from "react"
import { useSettings } from "@/context/settings-context"
import { Card } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Skeleton } from "./ui/skeleton"

export function ImageSlideshow() {
  const { settings, loading } = useSettings();

  if (loading) {
    return <Skeleton className="w-full aspect-[2/1] md:aspect-[3/1] rounded-lg" />
  }

  if (!settings.houseImages || settings.houseImages.length === 0) {
    // Return a placeholder or nothing if no images are set
    return (
        <Card className="flex items-center justify-center w-full aspect-[2/1] md:aspect-[3/1] rounded-lg bg-muted border-dashed">
            <div className="text-center text-muted-foreground">
                <p>No house images have been uploaded.</p>
                <p className="text-xs">An admin can upload images in the Settings page.</p>
            </div>
        </Card>
    )
  }

  return (
    <Carousel
      className="w-full"
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent>
        {settings.houseImages.map((imageUrl, index) => (
          <CarouselItem key={index}>
            <Card className="overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={`House image ${index + 1}`} 
                    className="w-full object-cover aspect-[2/1] md:aspect-[3/1]"
                    data-ai-hint="house apartment building"
                />
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:inline-flex" />
      <CarouselNext className="hidden sm:inline-flex" />
    </Carousel>
  )
}
