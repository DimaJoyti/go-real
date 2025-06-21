# Cloudflare Integration Guide

This document provides comprehensive instructions for integrating the GoReal platform with Cloudflare services including Workers, Pages, R2, KV, and other edge computing features.

## 🌟 Overview

The Cloudflare integration enhances the GoReal platform with:

- **Edge Computing**: Cloudflare Workers for API acceleration and caching
- **File Storage**: R2 object storage for images, videos, and documents
- **Caching**: KV storage for sessions, API responses, and metadata
- **Real-time Features**: Durable Objects for chat and live challenges
- **CDN**: Global content delivery network
- **Security**: DDoS protection, WAF, and rate limiting
- **Analytics**: Custom event tracking and performance monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │   Cloudflare     │    │   Go Backend    │
│     Pages       │◄──►│    Workers       │◄──►│      API        │
│  (Frontend)     │    │  (Edge Logic)    │    │   (Business)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Cloudflare     │             │
         └──────────────►│    Services      │◄────────────┘
                        │  (KV, R2, D1)    │
                        └──────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

- Cloudflare account with Workers plan
- Node.js 18+ installed
- Wrangler CLI: `npm install -g wrangler`

### 2. Setup Cloudflare Resources

```bash
# Navigate to cloudflare directory
cd cloudflare

# Run setup script
./scripts/setup.sh
```

### 3. Configure Environment

```bash
# Copy environment files
cp .env.example .env
cp ../client/.env.example ../client/.env.local

# Update with your values
# - Cloudflare account ID
# - API tokens
# - Resource IDs from setup script
```

### 4. Deploy

```bash
# Deploy everything
../scripts/deploy-cloudflare.sh staging

# Or deploy individually
npm run deploy:staging  # Workers
wrangler pages deploy out --project-name=goreal-staging  # Pages
```

## 📁 Project Structure

```
cloudflare/
├── src/
│   ├── index.ts                 # Main worker entry
│   ├── types/bindings.ts        # TypeScript definitions
│   ├── middleware/              # Auth, rate limiting, errors
│   ├── routes/                  # API endpoints
│   └── durable-objects/         # Real-time features
├── scripts/setup.sh             # Resource setup
├── wrangler.toml               # Worker configuration
└── package.json                # Dependencies

client/
├── src/
│   ├── lib/cloudflare-api.ts   # API client
│   └── hooks/useCloudflare.ts  # React hooks
├── _headers                    # Cloudflare Pages headers
├── _redirects                  # URL redirects
└── next.config.js              # Updated for CF Pages
```

## 🔧 Configuration

### Cloudflare Workers (wrangler.toml)

```toml
name = "goreal-workers"
main = "src/index.ts"
compatibility_date = "2024-12-18"

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE_KV"
id = "your-cache-kv-id"

# R2 Buckets
[[r2_buckets]]
binding = "FILES_BUCKET"
bucket_name = "goreal-files"

# Environment Variables
[vars]
GO_BACKEND_URL = "https://api.goreal.com"
```

### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/workers/:path*',
        destination: 'https://goreal-workers.your-subdomain.workers.dev/api/:path*',
      },
    ];
  },
};
```

## 🔌 API Integration

### Frontend Usage

```typescript
import { cloudflareAPI, useCloudflareAuth, useFileUpload } from '@/lib/cloudflare-api';

// Authentication
const { user, login, logout } = useCloudflareAuth();

// File uploads
const { uploadFile, isUploading } = useFileUpload();

// Analytics
cloudflareAPI.trackEvent('button_click', { button: 'signup' });
```

### Available Endpoints

#### Authentication
- `POST /api/auth/login` - Login with session management
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/session` - Validate current session

#### File Management
- `POST /api/files/upload` - Upload to R2 storage
- `GET /api/files/:id` - Get file metadata
- `DELETE /api/files/:id` - Delete file

#### Caching
- `GET /api/cache/:key` - Get cached data
- `POST /api/cache` - Set cache entry
- `DELETE /api/cache/:key` - Clear cache

#### Analytics
- `POST /api/analytics/track` - Track custom events
- `POST /api/analytics/pageview` - Track page views

#### Proxy (Cached Backend)
- `/api/proxy/*` - Cached Go backend API calls

## 🔄 Real-time Features

### Chat Rooms

```typescript
import { useChatRoom } from '@/hooks/useCloudflare';

const { messages, sendMessage, isConnected } = useChatRoom(
  'room-123',
  user.id,
  user.username
);

// Send message
sendMessage({
  type: 'send_message',
  data: { message: 'Hello world!' }
});
```

### Live Challenges

```typescript
import { useLiveChallenge } from '@/hooks/useCloudflare';

const { messages, sendMessage } = useLiveChallenge(
  'challenge-456',
  user.id,
  user.username
);

// Submit entry
sendMessage({
  type: 'submit_entry',
  data: { content: 'My submission', file_url: 'https://...' }
});
```

## 🗄️ Storage Services

### KV Storage

Used for:
- User sessions
- API response caching
- Rate limiting counters
- User preferences

```typescript
// Set cache entry
await cloudflareAPI.setCacheEntry('user:123:preferences', userData, 3600);

// Get cached data
const cached = await cloudflareAPI.getCacheEntry('api:challenges:list');
```

### R2 Object Storage

Used for:
- User uploaded files
- Images and videos
- Documents and assets

```typescript
// Upload file
const fileData = await cloudflareAPI.uploadFile(
  file,
  'images',  // bucket
  'avatars', // folder
  true       // public
);
```

### D1 Database (Optional)

Used for:
- Edge data that needs SQL queries
- Frequently accessed metadata
- Analytics aggregations

## 📊 Analytics & Monitoring

### Event Tracking

```typescript
// Track user actions
cloudflareAPI.trackEvent('challenge_completed', {
  challenge_id: '123',
  completion_time: 45000,
  score: 95
});

// Track page performance
cloudflareAPI.trackPerformance({
  page: '/challenges',
  load_time: 1200,
  first_contentful_paint: 800
});
```

### Error Tracking

```typescript
// Automatic error tracking
try {
  // Your code
} catch (error) {
  cloudflareAPI.trackError(error.name, error.message, error.stack);
}
```

## 🔒 Security Features

### Rate Limiting

- IP-based rate limiting
- User-based rate limiting
- Endpoint-specific limits
- Configurable burst sizes

### Authentication

- JWT session management
- Secure session storage in KV
- Automatic session refresh
- Session validation middleware

### CORS & Headers

- Configurable CORS origins
- Security headers (CSP, HSTS, etc.)
- Content type validation
- Request size limits

## 🚀 Performance Optimizations

### Caching Strategy

1. **Static Assets**: Long-term caching (1 year)
2. **API Responses**: Short-term caching (5-30 minutes)
3. **User Data**: Session-based caching
4. **Images**: CDN caching with optimization

### Edge Computing

- API requests processed at edge locations
- Reduced latency for global users
- Intelligent request routing
- Automatic failover to origin

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```bash
   # Check CORS configuration in worker
   # Update allowed origins in wrangler.toml
   ```

2. **KV/R2 Access Denied**
   ```bash
   # Verify bindings in wrangler.toml
   # Check resource IDs match created resources
   ```

3. **Session Issues**
   ```bash
   # Verify JWT secret matches backend
   # Check session KV namespace
   ```

### Debugging

```bash
# View real-time logs
wrangler tail

# Test worker locally
wrangler dev

# Check deployment status
wrangler deployments list
```

## 📈 Scaling Considerations

### Performance

- Workers automatically scale to handle traffic
- KV storage has global replication
- R2 provides unlimited storage
- D1 scales with your application

### Costs

- Workers: $5/month + $0.50 per million requests
- KV: $0.50 per million reads, $5 per million writes
- R2: $0.015 per GB stored, $0.36 per million requests
- Pages: Free for most use cases

### Limits

- Worker CPU time: 10ms (free), 30s (paid)
- KV value size: 25MB
- R2 object size: 5TB
- Concurrent connections: 1000 per worker

## 🔄 Migration Guide

### From Existing Setup

1. **Backup Current Data**
   ```bash
   # Export current files from Pinata/IPFS
   # Backup database
   ```

2. **Gradual Migration**
   ```bash
   # Start with new uploads to R2
   # Migrate existing files in batches
   # Update file URLs progressively
   ```

3. **Testing**
   ```bash
   # Test all functionality in staging
   # Verify file access and uploads
   # Check real-time features
   ```

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)
- [KV Storage Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Durable Objects Documentation](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)

## 🤝 Support

For issues specific to the GoReal Cloudflare integration:

1. Check the troubleshooting section above
2. Review Cloudflare Workers logs with `wrangler tail`
3. Verify configuration in `wrangler.toml`
4. Test locally with `wrangler dev`

For Cloudflare-specific issues, refer to their official documentation and support channels.
