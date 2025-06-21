'use client'

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: "Home", href: "/dashboard", icon: <Home className="h-4 w-4" /> }, ...items]
    : items

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors hover-lift"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className={cn(
                  "flex items-center space-x-1",
                  isLast ? "text-foreground font-semibold" : "text-muted-foreground"
                )}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Enhanced Breadcrumb with animations
export function EpicBreadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: "Home", href: "/dashboard", icon: <Home className="h-4 w-4" /> }, ...items]
    : items

  return (
    <nav className={cn("flex items-center space-x-1 text-sm animate-fade-in", className)} aria-label="Breadcrumb">
      <div className="glass-card px-4 py-2 rounded-xl">
        <ol className="flex items-center space-x-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1
            
            return (
              <li 
                key={index} 
                className="flex items-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {index > 0 && (
                  <div className="mx-2 p-1 rounded-full bg-primary/10">
                    <ChevronRight className="h-3 w-3 text-primary" />
                  </div>
                )}
                
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-all duration-300 hover-lift px-2 py-1 rounded-lg hover:bg-primary/5"
                  >
                    {item.icon && (
                      <div className="p-1 rounded-md bg-muted/50">
                        {item.icon}
                      </div>
                    )}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <div className={cn(
                    "flex items-center space-x-2 px-2 py-1 rounded-lg",
                    isLast ? "text-foreground font-bold bg-primary/10" : "text-muted-foreground"
                  )}>
                    {item.icon && (
                      <div className={cn(
                        "p-1 rounded-md",
                        isLast ? "bg-primary/20 text-primary" : "bg-muted/50"
                      )}>
                        {item.icon}
                      </div>
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
