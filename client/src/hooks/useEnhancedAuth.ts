import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedAuth as useAuthContext } from '@/contexts/EnhancedAuthContext'
import { UserRole, LoginRequest, RegisterRequest, ChangePasswordRequest } from '@/types'
import { toast } from 'react-hot-toast'

export interface UseEnhancedAuthReturn {
  // Auth state
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  error: any
  tokens: any

  // Auth actions
  login: (credentials: LoginRequest, redirectTo?: string) => Promise<void>
  register: (userData: RegisterRequest, redirectTo?: string) => Promise<void>
  logout: (redirectTo?: string) => Promise<void>
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshUser: () => Promise<void>

  // Permission checks
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  canAccess: (requiredRole: UserRole) => boolean
  checkPermission: (requiredRole?: UserRole, allowedRoles?: UserRole[]) => boolean

  // Utility functions
  clearError: () => void
  isTokenExpired: () => boolean
  getDisplayName: () => string
  getInitials: () => string
  getRoleDisplayName: () => string

  // Convenience flags
  isAdmin: boolean
  isManager: boolean
  isEmployee: boolean
  isClient: boolean
  canManageUsers: boolean
  canManageLeads: boolean
  canViewAnalytics: boolean
  canManageProperties: boolean
}

export function useEnhancedAuth(): UseEnhancedAuthReturn {
  const router = useRouter()
  const authContext = useAuthContext()

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    tokens,
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    changePassword: contextChangePassword,
    resetPassword: contextResetPassword,
    refreshUser,
    hasRole,
    hasAnyRole,
    canAccess,
    clearError,
    isTokenExpired,
  } = authContext

  // Enhanced login with redirect handling
  const login = useCallback(async (credentials: LoginRequest, redirectTo?: string) => {
    try {
      await contextLogin(credentials)
      
      if (redirectTo) {
        router.push(redirectTo)
      }
      // Note: contextLogin already handles role-based redirect
    } catch (error: any) {
      // Error handling is done in the context
      throw error
    }
  }, [contextLogin, router])

  // Enhanced register with redirect handling
  const register = useCallback(async (userData: RegisterRequest, redirectTo?: string) => {
    try {
      await contextRegister(userData)
      
      if (redirectTo) {
        router.push(redirectTo)
      }
      // Note: contextRegister already handles redirect to dashboard
    } catch (error: any) {
      // Error handling is done in the context
      throw error
    }
  }, [contextRegister, router])

  // Enhanced logout with redirect handling
  const logout = useCallback(async (redirectTo?: string) => {
    try {
      await contextLogout()
      
      if (redirectTo) {
        router.push(redirectTo)
      }
      // Note: contextLogout already handles redirect to login
    } catch (error: any) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      router.push(redirectTo || '/login')
    }
  }, [contextLogout, router])

  // Enhanced change password with success feedback
  const changePassword = useCallback(async (passwordData: ChangePasswordRequest) => {
    try {
      await contextChangePassword(passwordData)
      toast.success('Password changed successfully!')
    } catch (error: any) {
      // Error handling is done in the context
      throw error
    }
  }, [contextChangePassword])

  // Enhanced reset password with success feedback
  const resetPassword = useCallback(async (email: string) => {
    try {
      await contextResetPassword({ email })
      toast.success('Password reset email sent! Please check your inbox.')
    } catch (error: any) {
      // Error handling is done in the context
      throw error
    }
  }, [contextResetPassword])

  // Enhanced permission checking
  const checkPermission = useCallback((requiredRole?: UserRole, allowedRoles?: UserRole[]): boolean => {
    if (!user) return false

    if (requiredRole && !canAccess(requiredRole)) {
      return false
    }

    if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
      return false
    }

    return true
  }, [user, canAccess, hasAnyRole])

  // Utility functions
  const getDisplayName = useCallback((): string => {
    if (!user) return ''
    return user.full_name || user.username || user.email || 'User'
  }, [user])

  const getInitials = useCallback((): string => {
    if (!user) return ''
    
    const name = user.full_name || user.username || user.email
    if (!name) return 'U'

    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }, [user])

  const getRoleDisplayName = useCallback((): string => {
    if (!user) return ''
    
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Administrator'
      case UserRole.ADMIN:
        return 'Administrator'
      case UserRole.MANAGER:
        return 'Manager'
      case UserRole.EMPLOYEE:
        return 'Employee'
      case UserRole.CLIENT:
        return 'Client'
      default:
        return 'User'
    }
  }, [user])

  // Convenience flags
  const isAdmin = useMemo(() => 
    user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
    [user?.role]
  )

  const isManager = useMemo(() => 
    canAccess(UserRole.MANAGER),
    [canAccess]
  )

  const isEmployee = useMemo(() => 
    canAccess(UserRole.EMPLOYEE),
    [canAccess]
  )

  const isClient = useMemo(() => 
    user?.role === UserRole.CLIENT,
    [user?.role]
  )

  // Permission flags for common actions
  const canManageUsers = useMemo(() => 
    canAccess(UserRole.ADMIN),
    [canAccess]
  )

  const canManageLeads = useMemo(() => 
    canAccess(UserRole.EMPLOYEE),
    [canAccess]
  )

  const canViewAnalytics = useMemo(() => 
    canAccess(UserRole.MANAGER),
    [canAccess]
  )

  const canManageProperties = useMemo(() => 
    canAccess(UserRole.EMPLOYEE),
    [canAccess]
  )

  return {
    // Auth state
    user,
    isAuthenticated,
    isLoading,
    error,
    tokens,

    // Auth actions
    login,
    register,
    logout,
    changePassword,
    resetPassword,
    refreshUser,

    // Permission checks
    hasRole,
    hasAnyRole,
    canAccess,
    checkPermission,

    // Utility functions
    clearError,
    isTokenExpired,
    getDisplayName,
    getInitials,
    getRoleDisplayName,

    // Convenience flags
    isAdmin,
    isManager,
    isEmployee,
    isClient,
    canManageUsers,
    canManageLeads,
    canViewAnalytics,
    canManageProperties,
  }
}

// Hook for authentication status only (lightweight)
export function useAuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  
  return {
    user,
    isAuthenticated,
    isLoading,
    isLoggedIn: isAuthenticated && !!user,
  }
}

// Hook for user permissions only
export function useUserPermissions() {
  const { user, hasRole, hasAnyRole, canAccess } = useAuthContext()
  
  return {
    user,
    hasRole,
    hasAnyRole,
    canAccess,
    isAdmin: user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
    isManager: canAccess(UserRole.MANAGER),
    isEmployee: canAccess(UserRole.EMPLOYEE),
    isClient: user?.role === UserRole.CLIENT,
  }
}

// Hook for auth actions only
export function useAuthActions() {
  const {
    login,
    register,
    logout,
    changePassword,
    resetPassword,
    refreshUser,
    clearError,
  } = useEnhancedAuth()
  
  return {
    login,
    register,
    logout,
    changePassword,
    resetPassword,
    refreshUser,
    clearError,
  }
}

export default useEnhancedAuth
