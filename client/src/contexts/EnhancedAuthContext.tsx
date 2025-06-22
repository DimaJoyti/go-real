'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/auth.service'
import {
  User,
  AuthState,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmPasswordResetRequest,
  AuthError,
  UserRole
} from '@/types'

interface AuthContextType extends AuthState {
  // Authentication methods
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>
  resetPassword: (resetData: ResetPasswordRequest) => Promise<void>
  confirmPasswordReset: (confirmData: ConfirmPasswordResetRequest) => Promise<void>
  
  // User management
  refreshUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  
  // Permission checks
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  canAccess: (requiredRole: UserRole) => boolean
  
  // Utility methods
  clearError: () => void
  isTokenExpired: () => boolean
}

const EnhancedAuthContext = createContext<AuthContextType | undefined>(undefined)

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.CLIENT]: 1,
  [UserRole.EMPLOYEE]: 2,
  [UserRole.MANAGER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
}

// Helper function to get redirect path based on user role
const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return '/admin/dashboard'
    case UserRole.MANAGER:
      return '/manager/dashboard'
    case UserRole.EMPLOYEE:
      return '/employee/dashboard'
    case UserRole.CLIENT:
    default:
      return '/dashboard'
  }
}

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    tokens: {
      access_token: null,
      refresh_token: null,
      expires_at: null
    }
  })

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = AuthService.getStoredUser()
        const accessToken = AuthService.getAccessToken()
        const refreshToken = localStorage.getItem('refresh_token')
        const expiresAt = localStorage.getItem('expires_at')

        if (storedUser && accessToken) {
          setState(prev => ({
            ...prev,
            user: storedUser,
            isAuthenticated: true,
            tokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt ? parseInt(expiresAt, 10) : null
            }
          }))

          // Check if token needs refresh
          if (AuthService.shouldRefreshToken()) {
            try {
              await AuthService.refreshToken()
            } catch (error) {
              console.warn('Token refresh failed during initialization:', error)
              await logout()
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initializeAuth()
  }, [])

  // Auto-refresh token when needed
  useEffect(() => {
    if (!state.isAuthenticated) return

    const interval = setInterval(() => {
      if (AuthService.shouldRefreshToken()) {
        AuthService.refreshToken().catch((error) => {
          console.error('Auto token refresh failed:', error)
          logout()
        })
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [state.isAuthenticated])

  const setError = useCallback((error: AuthError | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  const updateAuthState = useCallback((authData: AuthResponse) => {
    setState(prev => ({
      ...prev,
      user: authData.user,
      isAuthenticated: true,
      error: null,
      tokens: {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: Date.now() + authData.expires_in * 1000
      }
    }))
  }, [])

  const clearAuthState = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: {
        access_token: null,
        refresh_token: null,
        expires_at: null
      }
    })
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const authData = await AuthService.login(credentials)
      updateAuthState(authData)
      
      // Redirect based on user role
      const redirectPath = getRedirectPath(authData.user.role)
      router.push(redirectPath)
    } catch (error: any) {
      setError({
        message: error.message || 'Login failed',
        code: error.code
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [router, setError, setLoading, updateAuthState])

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const authData = await AuthService.register(userData)
      updateAuthState(authData)
      
      // Redirect to dashboard after registration
      router.push('/dashboard')
    } catch (error: any) {
      setError({
        message: error.message || 'Registration failed',
        code: error.code
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [router, setError, setLoading, updateAuthState])

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      await AuthService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthState()
      router.push('/login')
    }
  }, [router, setLoading, clearAuthState])

  const changePassword = useCallback(async (passwordData: ChangePasswordRequest) => {
    try {
      setLoading(true)
      setError(null)
      await AuthService.changePassword(passwordData)
    } catch (error: any) {
      setError({
        message: error.message || 'Password change failed',
        code: error.code
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading])

  const resetPassword = useCallback(async (resetData: ResetPasswordRequest) => {
    try {
      setLoading(true)
      setError(null)
      await AuthService.resetPassword(resetData)
    } catch (error: any) {
      setError({
        message: error.message || 'Password reset failed',
        code: error.code
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading])

  const confirmPasswordReset = useCallback(async (confirmData: ConfirmPasswordResetRequest) => {
    try {
      setLoading(true)
      setError(null)
      await AuthService.confirmPasswordReset(confirmData)
    } catch (error: any) {
      setError({
        message: error.message || 'Password reset confirmation failed',
        code: error.code
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading])

  const refreshUser = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser()
      setState(prev => ({ ...prev, user }))
    } catch (error: any) {
      setError({
        message: error.message || 'Failed to refresh user data',
        code: error.code
      })
    }
  }, [setError])

  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }))
  }, [])

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!state.user) return false
    return state.user.role === role
  }, [state.user])

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!state.user) return false
    return roles.includes(state.user.role)
  }, [state.user])

  const canAccess = useCallback((requiredRole: UserRole): boolean => {
    if (!state.user) return false
    const userRoleLevel = ROLE_HIERARCHY[state.user.role]
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]
    return userRoleLevel >= requiredRoleLevel
  }, [state.user])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const isTokenExpired = useCallback((): boolean => {
    const expiresAt = state.tokens.expires_at
    if (!expiresAt) return true
    return Date.now() >= expiresAt
  }, [state.tokens.expires_at])

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    changePassword,
    resetPassword,
    confirmPasswordReset,
    refreshUser,
    updateUser,
    hasRole,
    hasAnyRole,
    canAccess,
    clearError,
    isTokenExpired,
  }

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}

export default EnhancedAuthContext
