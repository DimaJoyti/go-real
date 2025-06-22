# GoReal Frontend Authentication System

This document describes the comprehensive authentication system implemented in the GoReal frontend application.

## Overview

The authentication system provides:

- **JWT-based Authentication** with access and refresh tokens
- **Role-based Access Control (RBAC)** with hierarchical permissions
- **Form Validation** using React Hook Form and Zod
- **Protected Routes** with automatic redirects
- **Password Security** with strength validation
- **Error Handling** with user-friendly messages
- **Token Management** with automatic refresh

## Architecture

### Core Components

1. **Enhanced Auth Context** (`/src/contexts/EnhancedAuthContext.tsx`)
   - Centralized authentication state management
   - Token handling and automatic refresh
   - Role-based permission checking
   - Integration with backend API

2. **Auth Service** (`/src/services/auth.service.ts`)
   - HTTP client for authentication API calls
   - Token storage and management
   - Automatic token refresh interceptors
   - Error handling and retry logic

3. **Protected Routes** (`/src/components/auth/ProtectedRoute.tsx`)
   - Route-level access control
   - Role-based rendering
   - Unauthorized access handling
   - Loading states

4. **Enhanced Auth Hook** (`/src/hooks/useEnhancedAuth.ts`)
   - Convenient authentication interface
   - Permission checking utilities
   - User information helpers

## User Roles and Permissions

### Role Hierarchy

```
Super Admin (5) > Admin (4) > Manager (3) > Employee (2) > Client (1)
```

### Role Definitions

- **Client**: Property investors, buyers
- **Employee**: Real estate agents, staff
- **Manager**: Team leads, department managers
- **Admin**: System administrators
- **Super Admin**: Full system access

### Permission System

```typescript
// Hierarchical permissions (can access role and below)
canAccess(UserRole.MANAGER) // Manager, Admin, Super Admin

// Exact role matching
hasRole(UserRole.CLIENT) // Only clients

// Multiple role matching
hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) // Admin or Super Admin
```

## Authentication Flow

### 1. Login Process

```typescript
const { login } = useEnhancedAuth()

await login({
  email: 'user@example.com',
  password: 'securePassword123!'
})

// Automatic redirect based on user role:
// - Client → /dashboard
// - Employee → /employee/dashboard
// - Manager → /manager/dashboard
// - Admin → /admin/dashboard
```

### 2. Registration Process

```typescript
const { register } = useEnhancedAuth()

await register({
  email: 'user@example.com',
  password: 'securePassword123!',
  username: 'johndoe',
  full_name: 'John Doe',
  role: UserRole.CLIENT
})
```

### 3. Token Management

- **Access Token**: 15-minute expiry, stored in localStorage
- **Refresh Token**: 7-day expiry, stored in localStorage
- **Automatic Refresh**: Triggered 5 minutes before expiry
- **Logout on Failure**: Automatic logout if refresh fails

## Form Validation

### Login Validation

```typescript
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})
```

### Registration Validation

```typescript
const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms')
})
```

### Password Strength Validation

- **Length**: Minimum 8 characters
- **Lowercase**: At least one lowercase letter
- **Uppercase**: At least one uppercase letter
- **Number**: At least one digit
- **Special Character**: At least one special character (@$!%*?&)

## Protected Routes Usage

### Basic Protection

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

### Role-based Protection

```typescript
// Require specific role (hierarchical)
<ProtectedRoute requiredRole={UserRole.MANAGER}>
  <ManagerDashboard />
</ProtectedRoute>

// Allow specific roles only (exact match)
<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
  <AdminPanel />
</ProtectedRoute>

// Multiple role requirements
<ProtectedRoute requiredRoles={[UserRole.EMPLOYEE, UserRole.MANAGER]}>
  <EmployeeTools />
</ProtectedRoute>
```

### Higher-Order Component

```typescript
import { withAuth } from '@/components/auth/ProtectedRoute'

const ProtectedDashboard = withAuth(Dashboard, {
  requiredRole: UserRole.EMPLOYEE
})
```

## Conditional Rendering

### Permission-based Components

```typescript
import { ConditionalRender, AdminOnly, ManagerAndAbove } from '@/components/auth/ProtectedRoute'

// Custom conditions
<ConditionalRender requiredRole={UserRole.MANAGER}>
  <ManagerOnlyContent />
</ConditionalRender>

// Predefined components
<AdminOnly>
  <AdminSettings />
</AdminOnly>

<ManagerAndAbove>
  <ManagementTools />
</ManagerAndAbove>
```

### Permission Hook

```typescript
import { usePermissions } from '@/components/auth/ProtectedRoute'

function MyComponent() {
  const { isAdmin, canManageUsers, checkPermission } = usePermissions()
  
  return (
    <div>
      {isAdmin && <AdminButton />}
      {canManageUsers && <UserManagement />}
      {checkPermission(UserRole.EMPLOYEE) && <EmployeeTools />}
    </div>
  )
}
```

## Error Handling

### Authentication Errors

```typescript
try {
  await login(credentials)
} catch (error) {
  // Specific error handling
  if (error.message.includes('Invalid credentials')) {
    setFormError('email', { message: 'Invalid email or password' })
  } else if (error.message.includes('Account suspended')) {
    setFormError('email', { message: 'Account suspended. Contact support.' })
  }
}
```

### Global Error States

- **Network Errors**: Automatic retry with exponential backoff
- **Token Expiry**: Automatic refresh or logout
- **Permission Denied**: Redirect to appropriate page
- **Server Errors**: User-friendly error messages

## Security Features

### Token Security

- **Secure Storage**: localStorage with automatic cleanup
- **Token Validation**: Client-side expiry checking
- **Automatic Refresh**: Seamless token renewal
- **Logout on Failure**: Security-first approach

### Password Security

- **Strength Validation**: Real-time password strength checking
- **Secure Transmission**: HTTPS-only communication
- **Hash Verification**: Server-side bcrypt validation
- **Reset Tokens**: Time-limited password reset

### Route Security

- **Authentication Guards**: Automatic login redirects
- **Role Validation**: Server-side permission verification
- **Unauthorized Handling**: Graceful access denial
- **Session Management**: Automatic cleanup on logout

## Usage Examples

### Basic Authentication

```typescript
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'

function LoginForm() {
  const { login, isLoading, error } = useEnhancedAuth()
  
  const handleSubmit = async (data) => {
    try {
      await login(data)
      // Automatic redirect based on role
    } catch (error) {
      // Error handling
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Permission Checking

```typescript
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'

function Dashboard() {
  const { 
    user, 
    isAdmin, 
    canManageUsers, 
    getDisplayName,
    getRoleDisplayName 
  } = useEnhancedAuth()
  
  return (
    <div>
      <h1>Welcome, {getDisplayName()}!</h1>
      <p>Role: {getRoleDisplayName()}</p>
      
      {isAdmin && <AdminPanel />}
      {canManageUsers && <UserManagement />}
    </div>
  )
}
```

### Route Protection

```typescript
// app/admin/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

## Best Practices

### 1. Always Use Protected Routes

```typescript
// ✅ Good
<ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
  <EmployeeDashboard />
</ProtectedRoute>

// ❌ Bad - No protection
<EmployeeDashboard />
```

### 2. Handle Loading States

```typescript
// ✅ Good
const { isLoading, user } = useEnhancedAuth()

if (isLoading) return <LoadingSpinner />
if (!user) return <LoginPrompt />

return <Dashboard />
```

### 3. Validate Permissions

```typescript
// ✅ Good - Check permissions before actions
const { canManageUsers } = useEnhancedAuth()

const handleDeleteUser = () => {
  if (!canManageUsers) {
    toast.error('Insufficient permissions')
    return
  }
  // Proceed with deletion
}
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Specific error handling
try {
  await login(credentials)
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    setError('Invalid email or password')
  } else {
    setError('Login failed. Please try again.')
  }
}
```

## Testing

### Authentication Testing

```typescript
import { render, screen } from '@testing-library/react'
import { EnhancedAuthProvider } from '@/contexts/EnhancedAuthContext'

const renderWithAuth = (component, { user = null } = {}) => {
  return render(
    <EnhancedAuthProvider value={{ user, isAuthenticated: !!user }}>
      {component}
    </EnhancedAuthProvider>
  )
}

test('shows admin content for admin users', () => {
  const adminUser = { role: UserRole.ADMIN }
  renderWithAuth(<Dashboard />, { user: adminUser })
  
  expect(screen.getByText('Admin Panel')).toBeInTheDocument()
})
```

## Troubleshooting

### Common Issues

1. **Token Expiry**: Check localStorage for valid tokens
2. **Permission Denied**: Verify user role and route requirements
3. **Redirect Loops**: Check authentication state initialization
4. **Form Validation**: Verify Zod schema requirements

### Debug Commands

```typescript
// Check authentication state
console.log(useEnhancedAuth())

// Check stored tokens
console.log(localStorage.getItem('access_token'))
console.log(localStorage.getItem('refresh_token'))

// Check user permissions
const { user, canAccess } = useEnhancedAuth()
console.log('User role:', user?.role)
console.log('Can access admin:', canAccess(UserRole.ADMIN))
```

This authentication system provides a robust, secure, and user-friendly foundation for the GoReal platform with comprehensive role-based access control and modern security practices.
