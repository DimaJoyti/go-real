'use client'

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface EpicNotificationProps {
  title: string
  description?: string
  variant?: "default" | "success" | "warning" | "error" | "info" | "epic"
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export function EpicNotification({ 
  title, 
  description, 
  variant = "default", 
  onClose, 
  autoClose = true,
  duration = 5000 
}: EpicNotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const icons = {
    default: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    epic: <Sparkles className="h-5 w-5" />
  }

  const variantClasses = {
    default: "glass-card border-border",
    success: "glass-card border-success/30 bg-success/5 shadow-success/20",
    warning: "glass-card border-warning/30 bg-warning/5 shadow-warning/20",
    error: "glass-card border-destructive/30 bg-destructive/5 shadow-destructive/20",
    info: "glass-card border-primary/30 bg-primary/5 shadow-primary/20",
    epic: "gradient-aurora border-white/30 shadow-2xl"
  }

  const iconClasses = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning", 
    error: "text-destructive",
    info: "text-primary",
    epic: "text-white animate-pulse"
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      "flex items-start space-x-4 p-6 rounded-2xl shadow-2xl transition-all duration-500 animate-slide-down hover-lift sparkle max-w-md",
      variantClasses[variant],
      !isVisible && "animate-fade-out"
    )}>
      {/* Floating particles for epic variant */}
      {variant === "epic" && (
        <>
          <div className="absolute top-2 right-8 w-1 h-1 bg-white rounded-full animate-float" />
          <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-white/70 rounded-full animate-float floating-delayed" />
        </>
      )}
      
      <div className={cn(
        "flex-shrink-0 mt-1 p-2 rounded-xl transition-all duration-300 hover:scale-110",
        variant === "success" && "bg-success/20",
        variant === "warning" && "bg-warning/20", 
        variant === "error" && "bg-destructive/20",
        variant === "info" && "bg-primary/20",
        variant === "epic" && "bg-white/20 animate-breathe",
        variant === "default" && "bg-muted/20"
      )}>
        <div className={iconClasses[variant]}>
          {icons[variant]}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-bold leading-tight",
          variant === "epic" ? "text-white" : "text-foreground"
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            "text-sm mt-2 leading-relaxed",
            variant === "epic" ? "text-white/90" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(), 300)
          }}
          className={cn(
            "flex-shrink-0 p-1 rounded-lg transition-all duration-200 hover:scale-110",
            variant === "epic" ? "text-white/70 hover:text-white hover:bg-white/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Notification Container
export function EpicNotificationContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md">
      {children}
    </div>
  )
}

// Hook for managing notifications
export function useEpicNotifications() {
  const [notifications, setNotifications] = React.useState<Array<EpicNotificationProps & { id: string }>>([])

  const addNotification = React.useCallback((notification: Omit<EpicNotificationProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { ...notification, id }])
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showSuccess = React.useCallback((title: string, description?: string) => {
    addNotification({ title, description, variant: "success" })
  }, [addNotification])

  const showError = React.useCallback((title: string, description?: string) => {
    addNotification({ title, description, variant: "error" })
  }, [addNotification])

  const showWarning = React.useCallback((title: string, description?: string) => {
    addNotification({ title, description, variant: "warning" })
  }, [addNotification])

  const showInfo = React.useCallback((title: string, description?: string) => {
    addNotification({ title, description, variant: "info" })
  }, [addNotification])

  const showEpic = React.useCallback((title: string, description?: string) => {
    addNotification({ title, description, variant: "epic", duration: 8000 })
  }, [addNotification])

  const NotificationContainer = React.useCallback(() => (
    <EpicNotificationContainer>
      {notifications.map((notification) => (
        <EpicNotification
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </EpicNotificationContainer>
  ), [notifications, removeNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showEpic,
    NotificationContainer
  }
}

// Example usage component
export function EpicNotificationDemo() {
  const { showSuccess, showError, showWarning, showInfo, showEpic, NotificationContainer } = useEpicNotifications()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => showSuccess("Success!", "Your action was completed successfully.")}
          className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90"
        >
          Show Success
        </button>
        <button 
          onClick={() => showError("Error!", "Something went wrong. Please try again.")}
          className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90"
        >
          Show Error
        </button>
        <button 
          onClick={() => showWarning("Warning!", "Please review your input before proceeding.")}
          className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90"
        >
          Show Warning
        </button>
        <button 
          onClick={() => showInfo("Info", "Here's some helpful information for you.")}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Show Info
        </button>
        <button 
          onClick={() => showEpic("🎉 Epic Achievement!", "You've unlocked a new level of awesomeness!")}
          className="px-4 py-2 gradient-aurora text-white rounded-lg hover:scale-105 transition-transform"
        >
          Show Epic
        </button>
      </div>
      <NotificationContainer />
    </div>
  )
}
