# GoReal Cloudflare Workers

This directory contains Cloudflare Workers that enhance the GoReal platform with edge computing capabilities, caching, file storage, and real-time features.

## 🚀 Features

- **API Proxy & Caching**: Intelligent caching layer for Go backend API
- **File Storage**: R2-based file upload and management
- **Session Management**: KV-based session storage
- **Real-time Features**: Durable Objects for chat and live challenges
- **Analytics**: Custom event tracking with Analytics Engine
- **Rate Limiting**: Advanced rate limiting with KV storage
- **Security**: Enhanced security headers and CORS management

## 📁 Project Structure

```
cloudflare/
├── src/
│   ├── index.ts                 # Main worker entry point
│   ├── types/
│   │   └── bindings.ts          # TypeScript type definitions
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── rateLimiter.ts       # Rate limiting middleware
│   │   └── errorHandler.ts     # Error handling middleware
│   ├── routes/
│   │   ├── auth.ts              # Authentication routes
│   │   ├── files.ts             # File management routes
│   │   ├── cache.ts             # Cache management routes
│   │   ├── proxy.ts             # Backend proxy routes
│   │   └── analytics.ts         # Analytics routes
│   └── durable-objects/
│       ├── ChatRoom.ts          # Real-time chat functionality
│       └── LiveChallenge.ts     # Live challenge management
├── wrangler.toml                # Cloudflare Workers configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers plan
- Wrangler CLI installed globally: `npm install -g wrangler`

### 2. Install Dependencies

```bash
cd cloudflare
npm install
```

### 3. Configure Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create KV namespaces
wrangler kv:namespace create "CACHE_KV"
wrangler kv:namespace create "SESSION_KV"
wrangler kv:namespace create "METADATA_KV"

# Create R2 buckets
wrangler r2 bucket create goreal-files
wrangler r2 bucket create goreal-images
wrangler r2 bucket create goreal-videos

# Create D1 database (optional)
wrangler d1 create goreal-edge

# Create Queue
wrangler queues create goreal-background-tasks

# Create Analytics dataset
wrangler analytics create goreal-analytics
```

### 4. Update Configuration

1. Copy `.env.example` to `.env` and fill in your values
2. Update `wrangler.toml` with the IDs from the created resources
3. Configure your custom domain (optional)

### 5. Deploy

```bash
# Deploy to development
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 🔧 Development

### Local Development

```bash
# Start local development server
npm run dev
```

This will start the worker locally with hot reloading.

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run types:check
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with session management
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Validate session
- `POST /api/auth/refresh` - Refresh session

### File Management
- `POST /api/files/upload` - Upload files to R2
- `GET /api/files/:fileId` - Get file metadata
- `DELETE /api/files/:fileId` - Delete file

### Caching
- `GET /api/cache/:key` - Get cache entry (admin)
- `POST /api/cache` - Set cache entry (admin)
- `DELETE /api/cache/:key` - Delete cache entry (admin)

### Analytics
- `POST /api/analytics/track` - Track custom events
- `POST /api/analytics/pageview` - Track page views
- `POST /api/analytics/interaction` - Track user interactions

### Proxy (Backend API)
- `/api/proxy/*` - Proxy requests to Go backend with caching

## 🔄 Real-time Features

### Chat Rooms
Connect to chat rooms using WebSocket:
```javascript
const ws = new WebSocket('wss://your-worker.your-subdomain.workers.dev/chat/websocket?user_id=123&username=john');
```

### Live Challenges
Connect to live challenges:
```javascript
const ws = new WebSocket('wss://your-worker.your-subdomain.workers.dev/challenge/websocket?user_id=123&username=john');
```

## 🗄️ Storage

### KV Namespaces
- **CACHE_KV**: API response caching, rate limiting
- **SESSION_KV**: User session management
- **METADATA_KV**: File metadata, user preferences

### R2 Buckets
- **FILES_BUCKET**: General file storage
- **IMAGES_BUCKET**: Image files with optimization
- **VIDEOS_BUCKET**: Video files for streaming

### D1 Database (Optional)
- Edge data storage for frequently accessed information

## 📊 Analytics

The workers collect various analytics:
- User authentication events
- File upload/download metrics
- API usage statistics
- Performance metrics
- Error tracking

## 🔒 Security Features

- Rate limiting per IP and user
- CORS configuration
- Secure headers
- Input validation
- Session management
- File type validation

## 🚀 Performance Optimizations

- Intelligent API response caching
- CDN-based file delivery
- Edge computing for reduced latency
- Optimized database queries
- Efficient session management

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Wrangler Configuration
The `wrangler.toml` file contains all Cloudflare-specific configuration including bindings, routes, and deployment settings.

## 📝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Test locally before deploying

## 🐛 Troubleshooting

### Common Issues

1. **KV/R2 Access Errors**: Ensure bindings are correctly configured in `wrangler.toml`
2. **CORS Issues**: Check CORS configuration in the main worker
3. **Rate Limiting**: Adjust rate limits in middleware if needed
4. **Session Issues**: Verify JWT secret matches backend configuration

### Debugging

Use `wrangler tail` to see real-time logs:
```bash
wrangler tail
```

## 📄 License

This project is part of the GoReal platform and follows the same license terms.
