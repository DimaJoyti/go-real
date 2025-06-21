'use client'

import { cn } from "@/lib/utils"

interface EpicLoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "aurora" | "cosmic" | "royal" | "sunset" | "ocean"
  className?: string
  text?: string
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16",
  xl: "w-24 h-24"
}

const variantClasses = {
  aurora: "gradient-aurora",
  cosmic: "gradient-cosmic", 
  royal: "gradient-royal",
  sunset: "gradient-sunset",
  ocean: "gradient-ocean"
}

export function EpicLoading({ 
  size = "md", 
  variant = "aurora", 
  className,
  text = "Loading..."
}: EpicLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Spinning orb */}
      <div className="relative">
        <div className={cn(
          "rounded-full animate-spin sparkle",
          sizeClasses[size],
          variantClasses[variant]
        )}>
          <div className="absolute inset-2 bg-background rounded-full" />
        </div>
        
        {/* Inner floating dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
        
        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-accent rounded-full transform -translate-x-1/2" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-secondary rounded-full transform -translate-x-1/2" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-gradient-aurora animate-pulse">
          {text}
        </p>
        
        {/* Animated dots */}
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
          <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  )
}

// Full screen epic loading
export function EpicFullScreenLoading({ text = "Loading your epic experience..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="relative">
        {/* Background glow */}
        <div className="absolute inset-0 gradient-aurora opacity-20 rounded-full blur-3xl animate-pulse" 
             style={{ transform: 'scale(3)' }} />
        
        <div className="relative glass-card p-12 rounded-3xl text-center space-y-8">
          {/* Main loading animation */}
          <div className="relative mx-auto w-32 h-32">
            {/* Outer ring */}
            <div className="absolute inset-0 gradient-royal rounded-full animate-spin sparkle" 
                 style={{ animationDuration: '3s' }}>
              <div className="absolute inset-4 bg-background rounded-full" />
            </div>
            
            {/* Middle ring */}
            <div className="absolute inset-6 gradient-cosmic rounded-full animate-spin" 
                 style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
              <div className="absolute inset-3 bg-background rounded-full" />
            </div>
            
            {/* Inner core */}
            <div className="absolute inset-12 gradient-aurora rounded-full animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl animate-bounce">🏠</span>
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary rounded-full animate-float"
                  style={{
                    top: `${20 + Math.sin(i * Math.PI / 4) * 40}%`,
                    left: `${20 + Math.cos(i * Math.PI / 4) * 40}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${3 + i * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gradient-aurora">
              {text}
            </h2>
            
            {/* Progress bar */}
            <div className="w-64 h-2 bg-muted/30 rounded-full overflow-hidden mx-auto">
              <div className="h-full gradient-aurora rounded-full animate-pulse" 
                   style={{ 
                     width: '60%',
                     animation: 'shimmer 2s infinite, pulse 2s infinite'
                   }} />
            </div>
            
            {/* Status text */}
            <p className="text-sm text-muted-foreground animate-pulse">
              Preparing your dashboard...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader with epic effects
export function EpicSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-shimmer rounded-lg bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 sparkle",
      className
    )} />
  )
}
