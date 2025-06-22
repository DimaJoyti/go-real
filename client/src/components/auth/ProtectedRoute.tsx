'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, AlertCircle, Lock } from 'lucide-react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  allowedRoles?: UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
  showUnauthorized?: boolean
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  allowedRoles,
  redirectTo = '/login',
  fallback,
  showUnauthorized = true,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, hasRole, hasAnyRole, canAccess } = useEnhancedAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false)
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current path for redirect after login
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`
      router.push(redirectUrl)
    }
  }, [isAuthenticated, isLoading, router, redirectTo, pathname])

  // Show loading state
  if (isLoading || isChecking) {
    return fallback || <LoadingFallback />
  }

  // User not authenticated
  if (!isAuthenticated || !user) {
    return null // Router will handle redirect
  }

  // Check role-based access
  const hasAccess = checkAccess(user.role, {
    requiredRole,
    requiredRoles,
    allowedRoles,
    hasRole,
    hasAnyRole,
    canAccess,
  })

  if (!hasAccess) {
    if (showUnauthorized) {
      return <UnauthorizedFallback userRole={user.role} />
    }
    return null
  }

  return <>{children}</>
}

// Helper function to check access based on role requirements
function checkAccess(
  userRole: UserRole,
  {
    requiredRole,
    requiredRoles,
    allowedRoles,
    hasRole,
    hasAnyRole,
    canAccess,
  }: {
    requiredRole?: UserRole
    requiredRoles?: UserRole[]
    allowedRoles?: UserRole[]
    hasRole: (role: UserRole) => boolean
    hasAnyRole: (roles: UserRole[]) => boolean
    canAccess: (role: UserRole) => boolean
  }
): boolean {
  // If no role requirements specified, allow access
  if (!requiredRole && !requiredRoles && !allowedRoles) {
    return true
  }

  // Check specific required role (hierarchical)
  if (requiredRole && !canAccess(requiredRole)) {
    return false
  }

  // Check if user has any of the required roles (hierarchical)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => canAccess(role))
    if (!hasRequiredRole) {
      return false
    }
  }

  // Check if user has any of the allowed roles (exact match)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      return false
    }
  }

  return true
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  )
}

// Unauthorized access fallback component
function UnauthorizedFallback({ userRole }: { userRole: UserRole }) {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your current role ({userRole}) doesn't have sufficient permissions to view this content.
              Please contact your administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleGoBack} className="flex-1">
              Go Back
            </Button>
            <Button onClick={handleGoHome} className="flex-1">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user, hasRole, hasAnyRole, canAccess } = useEnhancedAuth()

  const checkPermission = (
    requiredRole?: UserRole,
    requiredRoles?: UserRole[],
    allowedRoles?: UserRole[]
  ): boolean => {
    if (!user) return false

    return checkAccess(user.role, {
      requiredRole,
      requiredRoles,
      allowedRoles,
      hasRole,
      hasAnyRole,
      canAccess,
    })
  }

  return {
    user,
    hasRole,
    hasAnyRole,
    canAccess,
    checkPermission,
    isAdmin: user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
    isManager: canAccess(UserRole.MANAGER),
    isEmployee: canAccess(UserRole.EMPLOYEE),
    isClient: user?.role === UserRole.CLIENT,
  }
}

// Component for conditionally rendering content based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
  inverse?: boolean // If true, render when user DOESN'T have permission
}

export function ConditionalRender({
  children,
  requiredRole,
  requiredRoles,
  allowedRoles,
  fallback = null,
  inverse = false,
}: ConditionalRenderProps) {
  const { checkPermission } = usePermissions()
  
  const hasPermission = checkPermission(requiredRole, requiredRoles, allowedRoles)
  const shouldRender = inverse ? !hasPermission : hasPermission

  return shouldRender ? <>{children}</> : <>{fallback}</>
}

// Specific role-based components for common use cases
export const AdminOnly = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <ConditionalRender allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} fallback={fallback}>
    {children}
  </ConditionalRender>
)

export const ManagerAndAbove = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <ConditionalRender requiredRole={UserRole.MANAGER} fallback={fallback}>
    {children}
  </ConditionalRender>
)

export const EmployeeAndAbove = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <ConditionalRender requiredRole={UserRole.EMPLOYEE} fallback={fallback}>
    {children}
  </ConditionalRender>
)

export const ClientOnly = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <ConditionalRender allowedRoles={[UserRole.CLIENT]} fallback={fallback}>
    {children}
  </ConditionalRender>
)

export default ProtectedRoute
