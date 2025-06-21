# GoReal Platform Deployment Guide

## Overview

This guide covers deploying the GoReal Platform to production environments using various deployment strategies.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and Go 1.21+
- Supabase project setup
- Domain name and SSL certificates
- Cloud storage (AWS S3, Google Cloud Storage, or Supabase Storage)

## Environment Setup

### Production Environment Variables

#### Frontend (.env.production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_id
```

#### Backend (.env.production)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your-super-secure-jwt-secret
PORT=8080
CORS_ORIGINS=https://your-domain.com
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://user:pass@db:5432/goreal
STORAGE_BUCKET=goreal-production
```

## Docker Deployment

### 1. Docker Compose (Recommended)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./client/.env.production
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "8080:8080"
    environment:
      - GO_ENV=production
    env_file:
      - ./backend/.env.production
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: goreal
      POSTGRES_USER: goreal
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  redis_data:
  postgres_data:
```

### 2. Frontend Dockerfile

Create `client/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 3. Backend Dockerfile

Create `backend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
```

### 4. Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8080;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support for real-time features
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## Cloud Deployment

### 1. AWS Deployment

#### Using AWS ECS with Fargate

1. **Build and push Docker images to ECR:**

```bash
# Create ECR repositories
aws ecr create-repository --repository-name goreal-frontend
aws ecr create-repository --repository-name goreal-backend

# Build and push images
docker build -t goreal-frontend ./client
docker build -t goreal-backend ./backend

# Tag and push to ECR
docker tag goreal-frontend:latest 123456789.dkr.ecr.region.amazonaws.com/goreal-frontend:latest
docker push 123456789.dkr.ecr.region.amazonaws.com/goreal-frontend:latest
```

2. **Create ECS task definition:**

```json
{
  "family": "goreal-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "123456789.dkr.ecr.region.amazonaws.com/goreal-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    },
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.region.amazonaws.com/goreal-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

### 2. Google Cloud Platform

#### Using Cloud Run

```bash
# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/goreal-frontend ./client
gcloud run deploy goreal-frontend --image gcr.io/PROJECT_ID/goreal-frontend --platform managed

# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT_ID/goreal-backend ./backend
gcloud run deploy goreal-backend --image gcr.io/PROJECT_ID/goreal-backend --platform managed
```

### 3. Vercel (Frontend Only)

For the Next.js frontend, you can deploy directly to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client directory
cd client
vercel --prod
```

Configure environment variables in Vercel dashboard.

## Database Setup

### Supabase Production Setup

1. **Create production project in Supabase**
2. **Run database migrations:**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (run your migration files)
\i migrations/001_initial_schema.sql
\i migrations/002_challenges.sql
\i migrations/003_films.sql
```

3. **Configure Row Level Security policies**
4. **Set up storage buckets:**

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('challenge-images', 'challenge-images', true),
  ('films', 'films', true),
  ('film-thumbnails', 'film-thumbnails', true);
```

## Monitoring and Logging

### 1. Application Monitoring

Add monitoring with Prometheus and Grafana:

```yaml
# Add to docker-compose.prod.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

### 2. Log Aggregation

Use ELK stack or cloud logging:

```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
```

## Security Considerations

### 1. SSL/TLS Configuration

- Use Let's Encrypt for free SSL certificates
- Configure strong cipher suites
- Enable HSTS headers

### 2. Environment Security

- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate API keys regularly
- Enable database encryption at rest

### 3. Network Security

- Configure VPC with private subnets
- Use security groups to restrict access
- Enable DDoS protection

## Backup Strategy

### 1. Database Backups

```bash
# Automated Supabase backups are included in paid plans
# For additional backups:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. File Storage Backups

```bash
# Sync Supabase storage to S3
aws s3 sync supabase-bucket s3://backup-bucket/$(date +%Y%m%d)
```

## Performance Optimization

### 1. CDN Configuration

- Use CloudFlare or AWS CloudFront
- Configure caching rules for static assets
- Enable image optimization

### 2. Database Optimization

- Set up read replicas for heavy read workloads
- Configure connection pooling
- Monitor and optimize slow queries

### 3. Caching Strategy

- Redis for session storage and caching
- Application-level caching for API responses
- Browser caching for static assets

## Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] Storage buckets created
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimization applied
- [ ] Health checks configured
- [ ] CI/CD pipeline set up

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check connection strings and credentials
   - Verify network connectivity
   - Check firewall rules

2. **File upload failures**
   - Verify storage bucket permissions
   - Check file size limits
   - Validate CORS configuration

3. **Authentication issues**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Validate OAuth provider settings

### Health Check Endpoints

- Frontend: `GET /api/health`
- Backend: `GET /health`
- Database: `SELECT 1`

Monitor these endpoints for service availability.
