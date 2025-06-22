import axios, { AxiosResponse } from 'axios'
import { baseURL } from '@/lib/constants'
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmPasswordResetRequest,
  User,
  ApiResponse
} from '@/types'

// Create axios instance with base configuration
const authAPI = axios.create({
  baseURL: `${baseURL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await authAPI.post('/refresh', {
            refresh_token: refreshToken
          })

          const { access_token, refresh_token: newRefreshToken } = response.data.data
          
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', newRefreshToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return authAPI(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await authAPI.post(
        '/login',
        credentials
      )

      const authData = response.data.data
      
      // Store tokens and user data
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('refresh_token', authData.refresh_token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      localStorage.setItem('expires_at', String(Date.now() + authData.expires_in * 1000))

      return authData
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await authAPI.post(
        '/register',
        userData
      )

      const authData = response.data.data
      
      // Store tokens and user data
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('refresh_token', authData.refresh_token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      localStorage.setItem('expires_at', String(Date.now() + authData.expires_in * 1000))

      return authData
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await authAPI.post('/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('expires_at')
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response: AxiosResponse<ApiResponse<AuthResponse>> = await authAPI.post(
        '/refresh',
        { refresh_token: refreshToken }
      )

      const authData = response.data.data
      
      // Update stored tokens
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('refresh_token', authData.refresh_token)
      localStorage.setItem('expires_at', String(Date.now() + authData.expires_in * 1000))

      return authData
    } catch (error: any) {
      // Clear tokens on refresh failure
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('expires_at')
      throw this.handleError(error)
    }
  }

  /**
   * Change user password
   */
  static async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      await authAPI.post('/change-password', passwordData)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Request password reset
   */
  static async resetPassword(resetData: ResetPasswordRequest): Promise<void> {
    try {
      await authAPI.post('/reset-password', resetData)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Confirm password reset with token
   */
  static async confirmPasswordReset(confirmData: ConfirmPasswordResetRequest): Promise<void> {
    try {
      await authAPI.post('/confirm-reset', confirmData)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await authAPI.get('/me')
      const user = response.data.data
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user))
      
      return user
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token')
    const expiresAt = localStorage.getItem('expires_at')
    
    if (!token || !expiresAt) {
      return false
    }

    // Check if token is expired
    const now = Date.now()
    const expiry = parseInt(expiresAt, 10)
    
    if (now >= expiry) {
      // Token expired, try to refresh
      this.refreshToken().catch(() => {
        // Refresh failed, user is not authenticated
      })
      return false
    }

    return true
  }

  /**
   * Get stored user data
   */
  static getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing stored user data:', error)
      return null
    }
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiry)
   */
  static shouldRefreshToken(): boolean {
    const expiresAt = localStorage.getItem('expires_at')
    if (!expiresAt) return false

    const now = Date.now()
    const expiry = parseInt(expiresAt, 10)
    const fiveMinutes = 5 * 60 * 1000

    return (expiry - now) <= fiveMinutes
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private static handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error)
    }
    
    if (error.response?.data?.message) {
      return new Error(error.response.data.message)
    }

    if (error.message) {
      return new Error(error.message)
    }

    return new Error('An unexpected error occurred')
  }
}

export default AuthService
