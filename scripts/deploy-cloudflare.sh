#!/bin/bash

# GoReal Cloudflare Deployment Script
# This script deploys both Workers and Pages

set -e

echo "🚀 Deploying GoReal to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare first:"
    wrangler login
fi

# Get deployment environment (default to staging)
ENVIRONMENT=${1:-staging}
echo "📦 Deploying to environment: $ENVIRONMENT"

# Deploy Cloudflare Workers
echo "🔧 Deploying Cloudflare Workers..."
cd cloudflare

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Worker dependencies..."
    npm install
fi

# Deploy workers
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Deploying to production..."
    npm run deploy:production
else
    echo "🧪 Deploying to staging..."
    npm run deploy:staging
fi

# Get the deployed worker URL
WORKER_URL=$(wrangler whoami 2>/dev/null | grep -o 'https://.*\.workers\.dev' || echo "")
if [ -z "$WORKER_URL" ]; then
    echo "⚠️  Could not determine worker URL. Please check your deployment."
    WORKER_URL="https://goreal-workers.your-subdomain.workers.dev"
fi

echo "✅ Workers deployed to: $WORKER_URL"

# Deploy Cloudflare Pages
echo "🌐 Deploying Cloudflare Pages..."
cd ../client

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Set environment variables for build
export NEXT_PUBLIC_WORKERS_URL="$WORKER_URL"
export NEXT_PUBLIC_WEBSOCKET_URL="${WORKER_URL/https:/wss:}"

if [ "$ENVIRONMENT" = "production" ]; then
    export NEXT_PUBLIC_FILES_URL="https://files.goreal.com"
    export NEXT_PUBLIC_APP_URL="https://goreal.com"
else
    export NEXT_PUBLIC_FILES_URL="https://dev-files.goreal.com"
    export NEXT_PUBLIC_APP_URL="https://dev.goreal.com"
fi

# Build the application
echo "🔨 Building frontend application..."
npm run build

# Deploy to Cloudflare Pages
echo "📤 Deploying to Cloudflare Pages..."

if [ "$ENVIRONMENT" = "production" ]; then
    PROJECT_NAME="goreal-production"
else
    PROJECT_NAME="goreal-staging"
fi

# Create or update Pages project
wrangler pages project create $PROJECT_NAME --compatibility-date=2024-12-18 || echo "Project might already exist"

# Deploy the built application
wrangler pages deploy out --project-name=$PROJECT_NAME --compatibility-date=2024-12-18

# Get the deployed Pages URL
PAGES_URL=$(wrangler pages project list | grep $PROJECT_NAME | awk '{print $3}' || echo "")
if [ -z "$PAGES_URL" ]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        PAGES_URL="https://goreal.com"
    else
        PAGES_URL="https://dev.goreal.com"
    fi
fi

echo "✅ Pages deployed to: $PAGES_URL"

# Update CORS settings in Workers if needed
echo "🔧 Updating CORS settings..."
cd ../cloudflare

# This would require updating the worker with the new Pages URL
# For now, we'll just remind the user
echo "⚠️  Remember to update CORS settings in your worker to include: $PAGES_URL"

# Summary
echo ""
echo "🎉 Deployment Summary:"
echo "======================"
echo "Environment: $ENVIRONMENT"
echo "Workers URL: $WORKER_URL"
echo "Pages URL: $PAGES_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Update your DNS settings to point your custom domain to Cloudflare Pages"
echo "2. Configure SSL/TLS settings in Cloudflare dashboard"
echo "3. Set up custom domain for Workers if needed"
echo "4. Update environment variables in your local .env files"
echo ""
echo "✅ Deployment complete!"
