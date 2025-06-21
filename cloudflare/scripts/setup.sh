#!/bin/bash

# GoReal Cloudflare Workers Setup Script
# This script sets up all necessary Cloudflare resources

set -e

echo "🚀 Setting up GoReal Cloudflare Workers..."

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

echo "📦 Creating KV namespaces..."

# Create KV namespaces
echo "Creating CACHE_KV namespace..."
CACHE_KV_ID=$(wrangler kv:namespace create "CACHE_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
CACHE_KV_PREVIEW_ID=$(wrangler kv:namespace create "CACHE_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating SESSION_KV namespace..."
SESSION_KV_ID=$(wrangler kv:namespace create "SESSION_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
SESSION_KV_PREVIEW_ID=$(wrangler kv:namespace create "SESSION_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating METADATA_KV namespace..."
METADATA_KV_ID=$(wrangler kv:namespace create "METADATA_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
METADATA_KV_PREVIEW_ID=$(wrangler kv:namespace create "METADATA_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "🪣 Creating R2 buckets..."

# Create R2 buckets
wrangler r2 bucket create goreal-files || echo "Bucket goreal-files might already exist"
wrangler r2 bucket create goreal-images || echo "Bucket goreal-images might already exist"
wrangler r2 bucket create goreal-videos || echo "Bucket goreal-videos might already exist"

# Create preview buckets
wrangler r2 bucket create goreal-files-preview || echo "Preview bucket goreal-files-preview might already exist"
wrangler r2 bucket create goreal-images-preview || echo "Preview bucket goreal-images-preview might already exist"
wrangler r2 bucket create goreal-videos-preview || echo "Preview bucket goreal-videos-preview might already exist"

echo "🗄️ Creating D1 database..."

# Create D1 database
D1_DB_ID=$(wrangler d1 create goreal-edge --output json | jq -r '.database_id' 2>/dev/null || echo "")
if [ -z "$D1_DB_ID" ]; then
    echo "⚠️  D1 database creation failed or already exists. You may need to create it manually."
    D1_DB_ID="your-d1-database-id"
fi

echo "📊 Creating Analytics dataset..."

# Create Analytics dataset (this might fail if not available in your plan)
wrangler analytics create goreal-analytics || echo "⚠️  Analytics dataset creation failed. This feature might not be available in your plan."

echo "🔄 Creating Queue..."

# Create Queue
wrangler queues create goreal-background-tasks || echo "⚠️  Queue creation failed or already exists."

echo "📝 Updating wrangler.toml with resource IDs..."

# Update wrangler.toml with the created resource IDs
sed -i.bak "s/your-cache-kv-namespace-id/$CACHE_KV_ID/g" wrangler.toml
sed -i.bak "s/your-cache-kv-preview-id/$CACHE_KV_PREVIEW_ID/g" wrangler.toml
sed -i.bak "s/your-session-kv-namespace-id/$SESSION_KV_ID/g" wrangler.toml
sed -i.bak "s/your-session-kv-preview-id/$SESSION_KV_PREVIEW_ID/g" wrangler.toml
sed -i.bak "s/your-metadata-kv-namespace-id/$METADATA_KV_ID/g" wrangler.toml
sed -i.bak "s/your-metadata-kv-preview-id/$METADATA_KV_PREVIEW_ID/g" wrangler.toml
sed -i.bak "s/your-d1-database-id/$D1_DB_ID/g" wrangler.toml

# Remove backup file
rm -f wrangler.toml.bak

echo "📋 Resource Summary:"
echo "==================="
echo "CACHE_KV ID: $CACHE_KV_ID"
echo "SESSION_KV ID: $SESSION_KV_ID"
echo "METADATA_KV ID: $METADATA_KV_ID"
echo "D1_DB ID: $D1_DB_ID"
echo ""
echo "R2 Buckets created:"
echo "- goreal-files"
echo "- goreal-images"
echo "- goreal-videos"
echo ""

echo "🔧 Next steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Update any remaining configuration in wrangler.toml"
echo "3. Run 'npm install' to install dependencies"
echo "4. Run 'npm run dev' for local development"
echo "5. Run 'npm run deploy' to deploy to Cloudflare"
echo ""
echo "✅ Setup complete! Your Cloudflare Workers environment is ready."
