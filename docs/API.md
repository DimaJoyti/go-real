# GoReal Platform API Documentation

## Overview

The GoReal Platform API provides comprehensive endpoints for managing users, challenges, films, and real estate NFTs. Built with Go and following RESTful principles.

**Base URL:** `http://localhost:8080/api/v1`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe"
  },
  "token": "jwt-token",
  "refresh_token": "refresh-token"
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "full_name": "John Doe"
}
```

#### POST /auth/refresh
Refresh an expired JWT token.

**Request Body:**
```json
{
  "refresh_token": "refresh-token"
}
```

#### POST /auth/logout
Logout and invalidate tokens.

## User Management

### GET /users/profile
Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": "Creative filmmaker and challenge enthusiast",
  "avatar_url": "https://storage.url/avatar.jpg",
  "wallet_address": "0x...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### PUT /users/profile
Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "newusername",
  "full_name": "New Name",
  "bio": "Updated bio",
  "avatar_url": "https://storage.url/new-avatar.jpg"
}
```

### GET /users/{id}/stats
Get user statistics and achievements.

**Response:**
```json
{
  "challenges_created": 5,
  "challenges_participated": 12,
  "films_created": 8,
  "properties_created": 2,
  "total_likes_received": 150,
  "followers_count": 45,
  "following_count": 32
}
```

### POST /users/{id}/follow
Follow or unfollow a user.

**Headers:** `Authorization: Bearer <token>`

## Challenges

### GET /challenges
List challenges with optional filtering.

**Query Parameters:**
- `status` - Filter by status (active, completed, draft)
- `creator_id` - Filter by creator
- `tag` - Filter by tag
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "challenges": [
    {
      "id": "uuid",
      "title": "30-Day Fitness Challenge",
      "description": "Complete a 30-day fitness journey",
      "creator_id": "uuid",
      "creator": {
        "username": "fitnessguru",
        "full_name": "Fitness Guru"
      },
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "reward_type": "nft",
      "reward_amount": 1,
      "status": "active",
      "current_participants": 25,
      "max_participants": 100,
      "tags": ["fitness", "health"],
      "image_url": "https://storage.url/challenge.jpg"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

### POST /challenges
Create a new challenge.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Creative Writing Challenge",
  "description": "Write a short story every day for 30 days",
  "start_date": "2024-02-01T00:00:00Z",
  "end_date": "2024-02-29T23:59:59Z",
  "reward_type": "token",
  "reward_amount": 100,
  "max_participants": 50,
  "rules": [
    "Write at least 500 words daily",
    "Submit before midnight",
    "Original content only"
  ],
  "tags": ["writing", "creativity", "daily"],
  "image_url": "https://storage.url/challenge.jpg"
}
```

### GET /challenges/{id}
Get detailed information about a specific challenge.

**Response:**
```json
{
  "id": "uuid",
  "title": "30-Day Fitness Challenge",
  "description": "Complete a 30-day fitness journey",
  "creator_id": "uuid",
  "creator": {
    "id": "uuid",
    "username": "fitnessguru",
    "full_name": "Fitness Guru",
    "avatar_url": "https://storage.url/avatar.jpg"
  },
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z",
  "reward_type": "nft",
  "reward_amount": 1,
  "status": "active",
  "current_participants": 25,
  "max_participants": 100,
  "rules": [
    "Exercise for at least 30 minutes daily",
    "Document your progress with photos",
    "Share weekly updates"
  ],
  "tags": ["fitness", "health", "lifestyle"],
  "image_url": "https://storage.url/challenge.jpg",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST /challenges/{id}/join
Join a challenge.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Successfully joined challenge",
  "participation": {
    "id": "uuid",
    "challenge_id": "uuid",
    "user_id": "uuid",
    "joined_at": "2024-01-15T10:30:00Z",
    "status": "active"
  }
}
```

### GET /challenges/trending
Get trending challenges.

**Query Parameters:**
- `limit` - Number of results (default: 10)

## Films

### GET /films
List films with optional filtering.

**Query Parameters:**
- `genre` - Filter by genre
- `creator_id` - Filter by creator
- `duration` - Filter by duration (short, medium, long)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "films": [
    {
      "id": "uuid",
      "title": "Urban Dreams",
      "description": "A short film about city life",
      "creator_id": "uuid",
      "creator": {
        "username": "filmmaker",
        "full_name": "Jane Filmmaker"
      },
      "video_url": "https://storage.url/film.mp4",
      "thumbnail_url": "https://storage.url/thumbnail.jpg",
      "duration": 300,
      "genre": ["drama", "urban"],
      "rating": 4.5,
      "view_count": 1250,
      "like_count": 89,
      "status": "published",
      "created_at": "2024-01-10T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### POST /films
Upload a new film.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "My Short Film",
  "description": "A creative exploration of modern life",
  "video_url": "https://storage.url/film.mp4",
  "thumbnail_url": "https://storage.url/thumbnail.jpg",
  "duration": 420,
  "genre": ["drama", "experimental"],
  "is_public": true,
  "challenge_id": "uuid"
}
```

### GET /films/{id}
Get detailed information about a specific film.

### POST /films/{id}/like
Like or unlike a film.

**Headers:** `Authorization: Bearer <token>`

### POST /films/{id}/comments
Add a comment to a film.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Great film! Really enjoyed the cinematography."
}
```

### GET /films/{id}/comments
Get comments for a film.

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Amazing work!",
      "user": {
        "username": "viewer123",
        "full_name": "Film Lover",
        "avatar_url": "https://storage.url/avatar.jpg"
      },
      "like_count": 5,
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are rate limited:
- **Authentication:** 5 requests per minute
- **General endpoints:** 100 requests per minute
- **Upload endpoints:** 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

The platform supports webhooks for real-time notifications:

### Challenge Events
- `challenge.created`
- `challenge.joined`
- `challenge.completed`

### Film Events
- `film.uploaded`
- `film.liked`
- `film.commented`

### User Events
- `user.followed`
- `user.achievement_earned`

Webhook payloads include event type, timestamp, and relevant data.
