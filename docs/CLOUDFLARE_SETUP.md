# 🚀 GoReal Cloudflare Integration - Complete Setup Guide

This guide will walk you through setting up Cloudflare integration for your GoReal platform, including Workers, Pages, R2 storage, KV caching, and real-time features.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Cloudflare account with Workers Paid plan ($5/month minimum)
- ✅ Node.js 18+ installed
- ✅ Git repository access
- ✅ Domain name (optional, for custom domains)

## 🎯 What You'll Get

After completing this setup:

- **🚀 Edge Computing**: API acceleration with Cloudflare Workers
- **📁 File Storage**: R2 object storage for all media files
- **⚡ Caching**: KV storage for sessions and API responses
- **💬 Real-time**: WebSocket chat and live challenges
- **📊 Analytics**: Custom event tracking and monitoring
- **🔒 Security**: Rate limiting, DDoS protection, and WAF
- **🌍 Global CDN**: Worldwide content delivery

## 🛠️ Step-by-Step Setup

### Step 1: Install Wrangler CLI

```bash
# Install globally
npm install -g wrangler

# Verify installation
wrangler --version
```

### Step 2: Login to Cloudflare

```bash
# Login to your Cloudflare account
wrangler login

# Verify login
wrangler whoami
```

### Step 3: Set Up Cloudflare Resources

```bash
# Navigate to the cloudflare directory
cd cloudflare

# Run the automated setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script will create:
- 3 KV namespaces (cache, sessions, metadata)
- 3 R2 buckets (files, images, videos)
- 1 D1 database (optional)
- 1 Queue for background tasks
- 1 Analytics dataset

### Step 4: Configure Environment Variables

#### For Cloudflare Workers:

```bash
# Copy and edit the environment file
cp .env.example .env

# Edit with your values
nano .env
```

Required variables:
```env
ENVIRONMENT=development
GO_BACKEND_URL=http://localhost:8080
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### For Next.js Frontend:

```bash
# Navigate to client directory
cd ../client

# Copy and edit environment file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required variables:
```env
NEXT_PUBLIC_WORKERS_URL=http://localhost:8787
NEXT_PUBLIC_FILES_URL=https://files.goreal.com
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8787
```

### Step 5: Install Dependencies

```bash
# Install Workers dependencies
cd cloudflare
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 6: Test Locally

#### Start Cloudflare Workers:

```bash
cd cloudflare
npm run dev
```

This starts the Workers development server on `http://localhost:8787`

#### Start Next.js Frontend:

```bash
cd client
npm run dev
```

This starts the frontend on `http://localhost:3000`

### Step 7: Deploy to Staging

```bash
# From the root directory
./scripts/deploy-cloudflare.sh staging
```

This will:
- Deploy Workers to staging environment
- Build and deploy frontend to Cloudflare Pages
- Configure redirects and headers

### Step 8: Configure Custom Domains (Optional)

#### For Workers:
1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Triggers
4. Add custom domain (e.g., `api.goreal.com`)

#### For Pages:
1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your Pages project
3. Go to Custom domains
4. Add your domain (e.g., `goreal.com`)

### Step 9: Production Deployment

```bash
# Deploy to production
./scripts/deploy-cloudflare.sh production
```

## 🔧 Configuration Details

### Cloudflare Workers Configuration

The `wrangler.toml` file contains all bindings and settings:

```toml
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

### Frontend Integration

The frontend automatically uses Cloudflare services:

```typescript
// File upload to R2
const { uploadFile } = useFileUpload();
const fileData = await uploadFile(file, 'images');

// Real-time chat
const { messages, sendMessage } = useChatRoom('room-123', user.id, user.username);

// Analytics tracking
cloudflareAPI.trackEvent('button_click', { button: 'signup' });
```

## 📊 Monitoring & Analytics

### View Logs

```bash
# Real-time worker logs
wrangler tail

# Specific environment
wrangler tail --env production
```

### Analytics Dashboard

1. Go to Cloudflare Dashboard → Analytics & Logs
2. Select Workers Analytics
3. View performance metrics and usage

### Custom Analytics

The integration includes custom event tracking:

```typescript
// Track user actions
cloudflareAPI.trackEvent('challenge_completed', {
  challenge_id: '123',
  score: 95
});

// Track page performance
cloudflareAPI.trackPerformance({
  page: '/challenges',
  load_time: 1200
});
```

## 🔒 Security Features

### Rate Limiting

Automatic rate limiting is configured:
- 100 requests per minute per IP
- 200 requests per minute per authenticated user
- 5 file uploads per minute per user

### CORS Configuration

CORS is configured for your domains:
```javascript
origin: ['http://localhost:3000', 'https://goreal.com']
```

### Security Headers

Automatic security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

## 🚀 Performance Benefits

### Before Cloudflare:
- API calls: Direct to Go backend
- File storage: Pinata/IPFS
- No caching layer
- Single region deployment

### After Cloudflare:
- API calls: Cached at edge locations
- File storage: Global R2 with CDN
- Intelligent caching with KV
- Global edge deployment

**Expected improvements:**
- 40-60% faster API responses
- 70-80% faster file delivery
- 99.9% uptime with DDoS protection
- Automatic scaling for traffic spikes

## 🐛 Troubleshooting

### Common Issues:

1. **"Binding not found" errors**
   ```bash
   # Check wrangler.toml bindings match created resources
   wrangler kv:namespace list
   wrangler r2 bucket list
   ```

2. **CORS errors**
   ```bash
   # Update CORS origins in src/index.ts
   # Redeploy workers
   npm run deploy
   ```

3. **File upload failures**
   ```bash
   # Check R2 bucket permissions
   # Verify bucket names in wrangler.toml
   ```

4. **WebSocket connection issues**
   ```bash
   # Check WebSocket URL in frontend
   # Verify Durable Objects are deployed
   ```

### Getting Help:

1. Check logs: `wrangler tail`
2. Test locally: `wrangler dev`
3. Review configuration files
4. Check Cloudflare Dashboard for errors

## 💰 Cost Estimation

### Monthly Costs (estimated):

**Workers:**
- Base plan: $5/month
- Requests: $0.50 per million (after 100k free)

**KV Storage:**
- Reads: $0.50 per million (after 100k free)
- Writes: $5 per million (after 1k free)

**R2 Storage:**
- Storage: $0.015 per GB
- Requests: $0.36 per million

**Pages:**
- Free for most use cases
- $20/month for advanced features

**Estimated total for small-medium app: $10-30/month**

## 🎉 Next Steps

After successful setup:

1. **Test all features** in staging environment
2. **Migrate existing files** from Pinata to R2
3. **Update DNS settings** for custom domains
4. **Configure monitoring** and alerts
5. **Train your team** on new features

## 📚 Additional Resources

- [Complete Integration Guide](./docs/CLOUDFLARE_INTEGRATION.md)
- [API Documentation](./cloudflare/README.md)
- [Frontend Hooks Guide](./client/src/hooks/useCloudflare.ts)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

## ✅ Verification Checklist

- [ ] Wrangler CLI installed and logged in
- [ ] All Cloudflare resources created
- [ ] Environment variables configured
- [ ] Local development working
- [ ] Staging deployment successful
- [ ] File uploads working
- [ ] Real-time features working
- [ ] Analytics tracking working
- [ ] Custom domains configured (if applicable)
- [ ] Production deployment successful

**Congratulations! 🎉 Your GoReal platform is now powered by Cloudflare's global edge network!**
