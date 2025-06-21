# 🚀 Supabase Integration - GoReal Platform

This document provides comprehensive instructions for setting up and using Supabase with the GoReal Platform.

## 📋 Overview

The GoReal Platform uses Supabase as its primary database and backend service, providing:

- **PostgreSQL Database** with advanced features
- **Real-time subscriptions** for live updates
- **Authentication** with multiple providers
- **File Storage** for media and documents
- **Row Level Security** for data protection
- **Edge Functions** for serverless computing

## 🏗️ Database Schema

### Core Tables

1. **profiles** - User profiles extending Supabase auth
2. **challenges** - Social challenges with rewards
3. **challenge_participations** - User participation in challenges
4. **films** - Short film content
5. **film_likes** - Film engagement
6. **film_comments** - Film discussions
7. **properties** - Real estate properties
8. **property_shares** - Fractional ownership
9. **notifications** - System notifications
10. **user_follows** - Social connections

### Key Features

- **Automatic timestamps** with triggers
- **Participant counting** with real-time updates
- **User statistics** with custom functions
- **Trending algorithms** for content discovery
- **Social feed generation** for personalized content

## 🔧 Setup Instructions

### Prerequisites

1. **Supabase CLI** installed globally:
   ```bash
   npm install -g supabase
   ```

2. **Docker** running on your system

3. **Node.js** and **Go** development environments

### Quick Setup

Run the automated setup script:

```bash
./scripts/setup-supabase.sh
```

This script will:
- Initialize Supabase project
- Start local development environment
- Run database migrations
- Generate TypeScript types
- Create environment files
- Optionally seed with sample data

### Manual Setup

If you prefer manual setup:

1. **Initialize Supabase:**
   ```bash
   supabase init
   ```

2. **Start local development:**
   ```bash
   supabase start
   ```

3. **Run migrations:**
   ```bash
   supabase db reset
   ```

4. **Generate types:**
   ```bash
   supabase gen types typescript --local > client/src/lib/database.types.ts
   ```

## 🔑 Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Backend (.env)
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Storage Buckets

The platform uses several storage buckets:

- **avatars** - User profile pictures (5MB limit)
- **challenge-images** - Challenge thumbnails (10MB limit)
- **films** - Video content (500MB limit)
- **film-thumbnails** - Video thumbnails (5MB limit)
- **property-images** - Property photos (10MB limit)
- **property-documents** - Legal documents (50MB limit, private)

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **Public read access** for appropriate content
- **Owner-only write access** for user-generated content
- **Admin override** for platform management
- **Privacy controls** for sensitive data

### Authentication

Supported authentication methods:
- **Email/Password** with confirmation
- **OAuth providers** (GitHub, Google)
- **Magic links** for passwordless login
- **Phone/SMS** authentication

## 🔄 Real-time Features

### Subscriptions

The platform supports real-time updates for:
- **Challenge participation** changes
- **Film likes and comments**
- **Property share transactions**
- **Notification delivery**
- **User activity feeds**

### Usage Example

```typescript
import { useRealtimeSubscription } from '@/hooks/useSupabase'

const { data: challenges } = useRealtimeSubscription(
  'challenges',
  'status.eq.active'
)
```

## 🛠️ Development Tools

### Supabase Studio

Access the local Supabase Studio at: http://localhost:54323

Features:
- **Table editor** for data management
- **SQL editor** for custom queries
- **Auth management** for user administration
- **Storage browser** for file management
- **API documentation** auto-generated

### Database Functions

Custom functions available:
- `get_user_stats(user_id)` - User statistics
- `get_trending_challenges(limit)` - Popular challenges
- `get_user_feed(user_id, limit, offset)` - Personalized feed
- `create_notification(...)` - Send notifications

## 📈 Performance Optimization

### Indexes

Optimized indexes for:
- **User lookups** by ID and email
- **Content filtering** by status and type
- **Social queries** for follows and likes
- **Search functionality** with GIN indexes
- **Time-based queries** for feeds

### Caching Strategy

- **Client-side caching** with React Query
- **Edge caching** for static content
- **Database connection pooling**
- **Optimistic updates** for better UX

## 🧪 Testing

### Sample Data

The seed file includes:
- **5 sample users** with different roles
- **4 challenges** in various states
- **5 films** with engagement data
- **4 properties** with fractional ownership
- **Social connections** and notifications

### Testing Queries

```sql
-- Get user statistics
SELECT * FROM get_user_stats('550e8400-e29b-41d4-a716-446655440004');

-- Get trending challenges
SELECT * FROM get_trending_challenges(5);

-- Get user feed
SELECT * FROM get_user_feed('550e8400-e29b-41d4-a716-446655440004', 10, 0);
```

## 🚀 Production Deployment

### Supabase Cloud

1. Create project at https://supabase.com
2. Run migrations: `supabase db push`
3. Update environment variables
4. Configure custom domain (optional)
5. Set up monitoring and alerts

### Environment Variables

Update production environment with:
- Supabase project URL
- Production API keys
- OAuth provider credentials
- SMTP configuration
- Storage bucket settings

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Functions](https://supabase.com/docs/guides/database/functions)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Management](https://supabase.com/docs/guides/storage)

## 🆘 Troubleshooting

### Common Issues

1. **Docker not running**: Ensure Docker is started
2. **Port conflicts**: Check if ports 54321-54324 are available
3. **Migration errors**: Reset database with `supabase db reset`
4. **Type generation**: Re-run `supabase gen types typescript --local`

### Support

- Check Supabase status: `supabase status`
- View logs: `supabase logs`
- Reset everything: `supabase stop && supabase start`

---

🎉 **Supabase Integration Complete!** Your GoReal Platform now has a powerful, scalable backend ready for development and production use.
