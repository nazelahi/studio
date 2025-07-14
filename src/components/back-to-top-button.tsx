
"use client"

import * as React from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BackToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false)

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  React.useEffect(() => {
    window.addEventListener("scroll", toggleVisibility)

    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm transition-opacity duration-300 hover:bg-accent",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={scrollToTop}
      aria-label="Go to top"
    >
      <ArrowUp className="h-6 w-6" />
    </Button>
  )
}
