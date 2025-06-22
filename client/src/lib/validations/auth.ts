import { z } from 'zod'
import { UserRole } from '@/types'

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Registration validation schema
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters long')
    .max(50, 'Full name must be less than 50 characters'),
  role: z
    .nativeEnum(UserRole)
    .optional()
    .default(UserRole.CLIENT),
  terms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Change password validation schema
export const changePasswordSchema = z.object({
  old_password: z
    .string()
    .min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_new_password: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine(data => data.new_password === data.confirm_new_password, {
  message: 'New passwords do not match',
  path: ['confirm_new_password'],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// Reset password validation schema
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Confirm password reset validation schema
export const confirmPasswordResetSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_password: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export type ConfirmPasswordResetFormData = z.infer<typeof confirmPasswordResetSchema>

// Profile update validation schema
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(50, 'Full name must be less than 50 characters')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  wallet_address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum wallet address')
    .optional()
    .or(z.literal('')),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

// Email validation helper
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

// Password validation helper
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

// Username validation helper
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username must be less than 20 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )

// Validation error formatter
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.reduce((acc, error) => {
    const path = error.path.join('.')
    acc[path] = error.message
    return acc
  }, {} as Record<string, string>)
}

// Password strength checker
export const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length
  
  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score < 3) strength = 'weak'
  else if (score < 4) strength = 'fair'
  else if (score < 5) strength = 'good'
  else strength = 'strong'

  return {
    score,
    strength,
    checks,
    isValid: score === 5,
  }
}

// Email domain validation
export const validateEmailDomain = (email: string, allowedDomains?: string[]) => {
  if (!allowedDomains || allowedDomains.length === 0) return true
  
  const domain = email.split('@')[1]?.toLowerCase()
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain.toLowerCase()
  )
}

// Username availability checker (placeholder - would integrate with API)
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  // This would make an API call to check username availability
  // For now, return true as placeholder
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate some unavailable usernames
      const unavailableUsernames = ['admin', 'root', 'user', 'test']
      resolve(!unavailableUsernames.includes(username.toLowerCase()))
    }, 500)
  })
}
