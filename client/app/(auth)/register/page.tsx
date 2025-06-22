'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { RegisterFormData, checkPasswordStrength, registerSchema } from '@/lib/validations/auth'
import { UserRole } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError, isAuthenticated } = useEnhancedAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<any>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError: setFormError,
    clearErrors,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      full_name: '',
      role: UserRole.CLIENT,
      terms: false,
    },
  })

  const watchedPassword = watch('password')
  const watchedUsername = watch('username')

  // Check password strength
  useEffect(() => {
    if (watchedPassword) {
      const strength = checkPasswordStrength(watchedPassword)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(null)
    }
  }, [watchedPassword])

  // Check username availability (debounced)
  useEffect(() => {
    if (watchedUsername && watchedUsername.length >= 3) {
      setIsCheckingUsername(true)
      const timeoutId = setTimeout(async () => {
        try {
          // This would be replaced with actual API call
          const isAvailable = await checkUsernameAvailability(watchedUsername)
          if (!isAvailable) {
            setFormError('username', { message: 'Username is already taken' })
          } else {
            clearErrors('username')
          }
        } catch (error) {
          console.error('Username check failed:', error)
        } finally {
          setIsCheckingUsername(false)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [watchedUsername, setFormError, clearErrors])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      clearErrors()

      // Remove confirmPassword from the data before sending
      const { confirmPassword, terms, ...registrationData } = data

      await registerUser(registrationData)

      toast.success('Registration successful! Welcome to GoReal!')
      router.push('/dashboard')
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes('Email already exists')) {
        setFormError('email', { message: 'An account with this email already exists' })
      } else if (error.message.includes('Username already exists')) {
        setFormError('username', { message: 'This username is already taken' })
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  // Placeholder function - would be replaced with actual API call
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const unavailableUsernames = ['admin', 'root', 'user', 'test', 'goreal']
        resolve(!unavailableUsernames.includes(username.toLowerCase()))
      }, 300)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
