# GoReal Platform Development Guide

## Development Environment Setup

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Go** 1.21+
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - Go extension
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

### Local Development Setup

1. **Clone and Setup**
```bash
git clone https://github.com/your-username/goreal-platform.git
cd goreal-platform

# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../backend && go mod download
```

2. **Environment Configuration**
```bash
# Frontend environment
cp client/.env.example client/.env.local

# Backend environment
cp backend/.env.example backend/.env
```

3. **Start Development Servers**
```bash
# Terminal 1 - Frontend (Next.js)
cd client && npm run dev

# Terminal 2 - Backend (Go)
cd backend && go run cmd/server/main.go

# Terminal 3 - Supabase (if running locally)
npx supabase start
```

## Project Architecture

### Frontend Architecture (Next.js 14+)

```
client/src/
├── app/                    # App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── (dashboard)/       # Main app pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Shadcn)
│   ├── auth/             # Authentication components
│   ├── challenges/       # Challenge-related components
│   ├── films/            # Film-related components
│   └── profile/          # Profile components
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utilities and configurations
│   ├── api.ts           # API client
│   ├── utils.ts         # Utility functions
│   └── supabase.ts      # Supabase client
└── types/               # TypeScript type definitions
```

### Backend Architecture (Go)

```
backend/
├── cmd/
│   └── server/           # Application entrypoint
├── internal/
│   ├── api/             # HTTP handlers and routes
│   ├── domain/          # Business logic and models
│   ├── services/        # Business services
│   ├── middleware/      # HTTP middleware
│   └── config/          # Configuration management
├── pkg/                 # Public packages
└── docs/               # API documentation
```

## Development Workflow

### Git Workflow

1. **Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

2. **Commit Message Convention**
```
feat: add new feature
fix: resolve bug in component
docs: update API documentation
style: format code
refactor: improve code structure
test: add unit tests
chore: update dependencies
```

### Code Quality

#### Frontend (TypeScript/React)

1. **ESLint Configuration** (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

2. **Prettier Configuration** (`.prettierrc`)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

3. **TypeScript Configuration** (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Backend (Go)

1. **Code Formatting**
```bash
# Format code
go fmt ./...

# Organize imports
goimports -w .

# Lint code
golangci-lint run
```

2. **Testing Standards**
```go
// Example test file
func TestUserService_Create(t *testing.T) {
    tests := []struct {
        name    string
        input   CreateUserRequest
        want    *User
        wantErr bool
    }{
        {
            name: "valid user creation",
            input: CreateUserRequest{
                Email:    "test@example.com",
                Username: "testuser",
                FullName: "Test User",
            },
            want: &User{
                Email:    "test@example.com",
                Username: "testuser",
                FullName: "Test User",
            },
            wantErr: false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test implementation
        })
    }
}
```

## Component Development

### UI Component Guidelines

1. **Component Structure**
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComponentProps {
  title: string
  onAction?: () => void
  className?: string
}

export function Component({ title, onAction, className }: ComponentProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    setIsLoading(true)
    try {
      await onAction?.()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={handleAction} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  )
}
```

2. **Styling Guidelines**
- Use Tailwind CSS classes for styling
- Follow mobile-first responsive design
- Use semantic HTML elements
- Implement proper accessibility attributes

### API Integration

1. **API Client Pattern**
```typescript
// lib/api.ts
class ApiClient {
  private baseUrl: string
  private supabase: SupabaseClient

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL!
    this.supabase = createClient(/* ... */)
  }

  async getFilms(filters?: FilmFilters) {
    return this.supabase
      .from('films')
      .select('*')
      .match(filters || {})
  }

  async createFilm(data: CreateFilmRequest) {
    return this.supabase
      .from('films')
      .insert(data)
      .select()
      .single()
  }
}

export const api = new ApiClient()
```

2. **Error Handling**
```typescript
try {
  const { data, error } = await api.getFilms()
  if (error) {
    console.error('API Error:', error)
    toast.error('Failed to load films')
    return
  }
  setFilms(data)
} catch (error) {
  console.error('Unexpected error:', error)
  toast.error('Something went wrong')
}
```

## Testing Strategy

### Frontend Testing

1. **Unit Tests with Jest**
```bash
npm test
npm run test:watch
npm run test:coverage
```

2. **Component Testing with React Testing Library**
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Component } from './Component'

describe('Component', () => {
  it('renders title correctly', () => {
    render(<Component title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onAction when button is clicked', () => {
    const mockAction = jest.fn()
    render(<Component title="Test" onAction={mockAction} />)
    
    fireEvent.click(screen.getByText('Action'))
    expect(mockAction).toHaveBeenCalled()
  })
})
```

3. **E2E Testing with Playwright**
```typescript
import { test, expect } from '@playwright/test'

test('user can create a challenge', async ({ page }) => {
  await page.goto('/challenges/create')
  
  await page.fill('[data-testid="title"]', 'Test Challenge')
  await page.fill('[data-testid="description"]', 'Test Description')
  await page.click('[data-testid="submit"]')
  
  await expect(page).toHaveURL(/\/challenges\/\w+/)
})
```

### Backend Testing

1. **Unit Tests**
```bash
go test ./...
go test -cover ./...
go test -race ./...
```

2. **Integration Tests**
```go
func TestChallengeAPI_Integration(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    // Create test server
    server := setupTestServer(db)
    defer server.Close()
    
    // Test API endpoints
    resp, err := http.Post(server.URL+"/api/challenges", "application/json", body)
    require.NoError(t, err)
    assert.Equal(t, http.StatusCreated, resp.StatusCode)
}
```

## Database Development

### Supabase Schema Management

1. **Migration Files**
```sql
-- migrations/001_initial_schema.sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);
```

2. **Database Functions**
```sql
-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'challenges_created', (SELECT COUNT(*) FROM challenges WHERE creator_id = user_id),
    'films_created', (SELECT COUNT(*) FROM films WHERE creator_id = user_id),
    'total_likes', (SELECT COUNT(*) FROM film_likes fl JOIN films f ON fl.film_id = f.id WHERE f.creator_id = user_id)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
```tsx
import dynamic from 'next/dynamic'

const FilmPlayer = dynamic(() => import('./FilmPlayer'), {
  loading: () => <div>Loading player...</div>,
  ssr: false
})
```

2. **Image Optimization**
```tsx
import Image from 'next/image'

<Image
  src="/film-thumbnail.jpg"
  alt="Film thumbnail"
  width={400}
  height={300}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Backend Optimization

1. **Database Query Optimization**
```go
// Use prepared statements
stmt, err := db.Prepare("SELECT * FROM films WHERE genre = ANY($1) LIMIT $2")
defer stmt.Close()

// Use connection pooling
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(25)
db.SetConnMaxLifetime(5 * time.Minute)
```

2. **Caching Strategy**
```go
// Redis caching
func (s *filmService) GetFilm(id string) (*Film, error) {
    // Check cache first
    cached, err := s.redis.Get(ctx, "film:"+id).Result()
    if err == nil {
        var film Film
        json.Unmarshal([]byte(cached), &film)
        return &film, nil
    }
    
    // Fetch from database
    film, err := s.repo.GetFilm(id)
    if err != nil {
        return nil, err
    }
    
    // Cache result
    data, _ := json.Marshal(film)
    s.redis.Set(ctx, "film:"+id, data, time.Hour)
    
    return film, nil
}
```

## Debugging and Monitoring

### Development Debugging

1. **Frontend Debugging**
```tsx
// Use React DevTools
// Add debug logs
console.log('Component state:', { films, loading, error })

// Use browser debugger
debugger
```

2. **Backend Debugging**
```go
// Use delve debugger
import "log"

log.Printf("Processing request: %+v", request)

// Add structured logging
logger.Info("Film created", 
    zap.String("film_id", film.ID),
    zap.String("creator_id", film.CreatorID),
)
```

### Production Monitoring

1. **Error Tracking**
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error)
```

2. **Performance Monitoring**
```go
// OpenTelemetry tracing
import "go.opentelemetry.io/otel"

tracer := otel.Tracer("goreal-backend")
ctx, span := tracer.Start(ctx, "create-film")
defer span.End()
```

This development guide provides the foundation for contributing to the GoReal Platform. Follow these guidelines to maintain code quality and consistency across the project.
