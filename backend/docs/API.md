# GoReal API Documentation

## Authentication

GoReal API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid access token in the Authorization header.

### Header Format
```
Authorization: Bearer <access_token>
```

### User Roles
- `user` - Regular user
- `creator` - Content creator
- `client` - Client
- `employee` - Employee
- `manager` - Manager
- `admin` - Administrator
- `super_admin` - Super administrator

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "full_name": "Full Name",
  "password": "password123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "full_name": "Full Name",
      "role": "user",
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z"
    },
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "expires_in": 900
  }
}
```

### POST /api/auth/login
Login to the system.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "full_name": "Full Name",
      "role": "user",
      "is_active": true
    },
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "expires_in": 900
  }
}
```

### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "new_jwt_access_token",
    "refresh_token": "new_jwt_refresh_token",
    "expires_in": 900
  }
}
```

### POST /api/auth/logout
Logout from the system (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### POST /api/auth/change-password
Change password (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "old_password": "old_password",
  "new_password": "new_password"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### POST /api/auth/reset-password
Reset password.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### POST /api/auth/confirm-reset
Confirm password reset.

**Request Body:**
```json
{
  "token": "reset_token",
  "new_password": "new_password"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

## User Management Endpoints

All endpoints require authentication.

### GET /api/users
Get list of users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (int) - Number of records (default: 10)
- `offset` (int) - Offset (default: 0)
- `role` (string) - Filter by role
- `search` (string) - Search by name or email
- `is_active` (bool) - Filter by active status

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "full_name": "Full Name",
      "role": "user",
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "count": 10,
    "limit": 10,
    "offset": 0
  }
}
```

### POST /api/users
Create a new user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "full_name": "New User",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "username": "newuser",
    "full_name": "New User",
    "role": "user",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### GET /api/users/{id}
Get user by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "full_name": "Full Name",
    "role": "user",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### PUT /api/users/{id}
Update user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "Updated Name",
  "is_active": false
}
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "full_name": "Updated Name",
    "role": "user",
    "is_active": false,
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### DELETE /api/users/{id}
Delete user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request format"
}
```

### 401 Unauthorized
```json
{
  "error": "Authorization header required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API has rate limiting:
- 100 requests per minute per IP address
- Burst up to 10 requests

When the limit is exceeded, status 429 Too Many Requests is returned.

## CORS

API supports CORS for frontend applications. Allowed origins are configured through the `CORS_ALLOWED_ORIGINS` environment variable.
